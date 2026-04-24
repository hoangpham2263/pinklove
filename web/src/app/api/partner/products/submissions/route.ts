import { NextResponse } from "next/server";

import { respondError, respondSuccess } from "@/lib/action-response";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { saveVendorProductSubmission, listVendorProductSubmissionsForVendor } from "@/features/vendor-product-submissions/server/service";
import type { ProductFulfillmentType } from "@/features/products/types";
import type { VendorProductSubmissionType } from "@/features/vendor-product-submissions/types";

export const runtime = "nodejs";

export async function GET() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const submissions = await listVendorProductSubmissionsForVendor(vendor.id);
  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const formData = await request.formData();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const linkedProductId = String(formData.get("linkedProductId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const submissionType = String(formData.get("submissionType") ?? "create").trim() as VendorProductSubmissionType;
  const name = String(formData.get("name") ?? "").trim();
  const slugCandidate = String(formData.get("slugCandidate") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "physical").trim() as ProductFulfillmentType;
  const purchaseCost = Math.max(0, Number(formData.get("purchaseCost") ?? "0"));
  const proposedStockQuantity = Math.max(0, Number(formData.get("proposedStockQuantity") ?? "0"));
  const lowStockThreshold = Math.max(0, Number(formData.get("lowStockThreshold") ?? "0"));
  const allowBackorder = formData.get("allowBackorder") === "on";
  const vendorSku = String(formData.get("vendorSku") ?? "");
  const vendorNote = String(formData.get("vendorNote") ?? "");

  if (!name || !slugCandidate || !["create", "update", "discontinue"].includes(submissionType)) {
    return respondError(request, {
      error: "invalid_submission",
      message: "Dữ liệu sản phẩm chờ duyệt không hợp lệ.",
      location: ROUTES.PARTNER.PRODUCTS,
    });
  }

  try {
    const id = await saveVendorProductSubmission({
      submissionId: submissionId || undefined,
      vendorUserId: vendor.id,
      linkedProductId: linkedProductId || undefined,
      categoryId: categoryId || undefined,
      submissionType,
      name,
      slugCandidate,
      excerpt,
      description,
      thumbnailUrl,
      fulfillmentType,
      purchaseCost,
      proposedStockQuantity,
      lowStockThreshold,
      allowBackorder,
      vendorSku,
      vendorNote,
    });

    return respondSuccess(request, {
      location: ROUTES.PARTNER.PRODUCT(id),
      message: "Đã lưu hồ sơ sản phẩm.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown_error";
    const message =
      code === "LINKED_PRODUCT_NOT_ALLOWED"
        ? "Bạn không thể liên kết đến sản phẩm không thuộc vendor này."
        : code === "LINKED_PRODUCT_REQUIRED"
          ? "Hãy chọn sản phẩm live cần cập nhật hoặc ngừng bán."
          : code === "SUBMISSION_LOCKED"
            ? "Hồ sơ này đang khóa, không thể sửa lúc này."
            : "Không thể lưu hồ sơ sản phẩm.";

    return respondError(request, {
      error: code,
      message,
      location: submissionId ? ROUTES.PARTNER.PRODUCT(submissionId) : ROUTES.PARTNER.PRODUCT_NEW,
    });
  }
}
