import { NextResponse } from "next/server";

import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { saveProviderOfferingSubmission, listProviderOfferingSubmissionsForProvider } from "@/features/provider-offering-submissions/server/service";
import { PROVIDER_SERVICE_KIND_VALUES } from "@/features/provider-offering-submissions/config/service-kinds";
import type { OfferingFulfillmentType } from "@/features/offerings/types";
import type { ProviderOfferingSubmissionType } from "@/features/provider-offering-submissions/types";

export const runtime = "nodejs";

const FULFILLMENT_TYPES = new Set<OfferingFulfillmentType>(["digital", "physical", "service"]);
const SUBMISSION_TYPES = new Set<ProviderOfferingSubmissionType>(["create", "update", "discontinue"]);

function parseNonNegativeNumber(value: FormDataEntryValue | null) {
  const numberValue = Number(value ?? "0");
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0;
}

function parseNonNegativeInteger(value: FormDataEntryValue | null) {
  return Math.trunc(parseNonNegativeNumber(value));
}

export async function GET() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const submissions = await listProviderOfferingSubmissionsForProvider(provider.id);
  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const formData = await request.formData();
  const submissionId = String(formData.get("submissionId") ?? "").trim();
  const linkedOfferingId = String(formData.get("linkedOfferingId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const rawSubmissionType = String(formData.get("submissionType") ?? "create").trim() as ProviderOfferingSubmissionType;
  const submissionType = SUBMISSION_TYPES.has(rawSubmissionType) ? rawSubmissionType : "create";
  const name = String(formData.get("name") ?? "").trim();
  const slugCandidate = String(formData.get("slugCandidate") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "");
  const description = String(formData.get("description") ?? "");
  const thumbnailUrl = String(formData.get("thumbnailUrl") ?? "").trim();
  const rawFulfillmentType = String(formData.get("fulfillmentType") ?? "service").trim() as OfferingFulfillmentType;
  const fulfillmentType = FULFILLMENT_TYPES.has(rawFulfillmentType) ? rawFulfillmentType : "service";
  const rawServiceKind = String(formData.get("serviceKind") ?? "other").trim();
  const serviceKind = PROVIDER_SERVICE_KIND_VALUES.includes(rawServiceKind) ? rawServiceKind : "other";
  const durationMinutes = parseNonNegativeInteger(formData.get("durationMinutes"));
  const serviceArea = String(formData.get("serviceArea") ?? "").trim();
  const purchaseCost = parseNonNegativeNumber(formData.get("purchaseCost"));
  const proposedStockQuantity = parseNonNegativeInteger(formData.get("proposedStockQuantity"));
  const lowStockThreshold = parseNonNegativeInteger(formData.get("lowStockThreshold"));
  const allowBackorder = formData.get("allowBackorder") === "on";
  const providerSku = String(formData.get("providerSku") ?? "");
  const providerNote = String(formData.get("providerNote") ?? "");

  if (!name || !slugCandidate) {
    return respondError(request, {
      error: "invalid_submission",
      message: "Dữ liệu hồ sơ dịch vụ/sản phẩm chờ duyệt không hợp lệ.",
      location: ROUTES.PROVIDER.OFFERINGS,
    });
  }

  try {
    const id = await saveProviderOfferingSubmission({
      submissionId: submissionId || undefined,
      providerId: provider.id,
      linkedOfferingId: linkedOfferingId || undefined,
      categoryId: categoryId || undefined,
      submissionType,
      name,
      slugCandidate,
      excerpt,
      description,
      thumbnailUrl,
      fulfillmentType,
      serviceKind,
      durationMinutes,
      serviceArea,
      purchaseCost,
      proposedStockQuantity,
      lowStockThreshold,
      allowBackorder,
      providerSku,
      providerNote,
    });

    return respondSuccess(request, {
      location: ROUTES.PROVIDER.OFFERING(id),
      message: "Đã lưu hồ sơ dịch vụ/sản phẩm.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown_error";
    const message =
      code === "LINKED_OFFERING_NOT_ALLOWED"
        ? "Bạn không thể liên kết đến dịch vụ/sản phẩm không thuộc provider này."
        : code === "LINKED_OFFERING_REQUIRED"
          ? "Hãy chọn dịch vụ/sản phẩm live cần cập nhật hoặc ngừng bán."
          : code === "SUBMISSION_LOCKED"
            ? "Hồ sơ này đang khóa, không thể sửa lúc này."
            : "Không thể lưu hồ sơ dịch vụ/sản phẩm.";

    return respondError(request, {
      error: code,
      message,
      location: submissionId ? ROUTES.PROVIDER.OFFERING(submissionId) : ROUTES.PROVIDER.OFFERING_NEW,
    });
  }
}
