import { NextResponse } from "next/server";

import { respondError, respondSuccess } from "@/lib/action-response";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { saveVendorOfferingSubmission, listVendorOfferingSubmissionsForVendor } from "@/features/vendor-offering-submissions/server/service";
import type { OfferingFulfillmentType } from "@/features/offerings/types";
import type { VendorOfferingSubmissionType } from "@/features/vendor-offering-submissions/types";

export const runtime = "nodejs";

export async function GET() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const submissions = await listVendorOfferingSubmissionsForVendor(vendor.id);
  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const formData = await request.formData();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const linkedOfferingId = String(formData.get("linkedOfferingId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const submissionType = String(formData.get("submissionType") ?? "create").trim() as VendorOfferingSubmissionType;
  const name = String(formData.get("name") ?? "").trim();
  const slugCandidate = String(formData.get("slugCandidate") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const fulfillmentType = String(formData.get("fulfillmentType") ?? "physical").trim() as OfferingFulfillmentType;
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
      location: ROUTES.PARTNER.OFFERINGS,
    });
  }

  try {
    const id = await saveVendorOfferingSubmission({
      submissionId: submissionId || undefined,
      vendorUserId: vendor.id,
      linkedOfferingId: linkedOfferingId || undefined,
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
      location: ROUTES.PARTNER.OFFERING(id),
      message: "Đã lưu hồ sơ sản phẩm.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown_error";
    const message =
      code === "LINKED_OFFERING_NOT_ALLOWED"
        ? "Bạn không thể liên kết đến sản phẩm không thuộc vendor này."
        : code === "LINKED_OFFERING_REQUIRED"
          ? "Hãy chọn sản phẩm live cần cập nhật hoặc ngừng bán."
          : code === "SUBMISSION_LOCKED"
            ? "Hồ sơ này đang khóa, không thể sửa lúc này."
            : "Không thể lưu hồ sơ sản phẩm.";

    return respondError(request, {
      error: code,
      message,
      location: submissionId ? ROUTES.PARTNER.OFFERING(submissionId) : ROUTES.PARTNER.OFFERING_NEW,
    });
  }
}
