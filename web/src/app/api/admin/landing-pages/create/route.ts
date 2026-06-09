import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { getOfferingById } from "@/features/offerings/server/service";
import { createLandingPageFromTemplate } from "@/features/landing-pages/server/service";
import { LANDING_PAGE_STATUSES, type LandingPageStatus } from "@/features/landing-pages/types";

export const runtime = "nodejs";

function isLandingPageStatus(value: string): value is LandingPageStatus {
  return LANDING_PAGE_STATUSES.includes(value as LandingPageStatus);
}

function withQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const sourceOfferingId = String(formData.get("sourceOfferingId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const createLocation = sourceOfferingId
    ? `${ROUTES.ADMIN.LANDING_PAGE_NEW}?sourceOffering=${encodeURIComponent(sourceOfferingId)}`
    : ROUTES.ADMIN.LANDING_PAGE_NEW;

  if (!sourceOfferingId || !templateId) {
    return respondError(request, {
      error: "missing_fields",
      message: "Thiếu sản phẩm nguồn hoặc mẫu landing page.",
      location: withQuery(createLocation, "error", "missing_fields"),
    });
  }

  if (!isLandingPageStatus(status)) {
    return respondError(request, {
      error: "invalid_status",
      message: "Trạng thái landing không hợp lệ.",
      location: withQuery(createLocation, "error", "invalid_status"),
    });
  }

  const offering = await getOfferingById(sourceOfferingId);
  if (!offering) {
    return respondError(request, {
      error: "offering_not_found",
      message: "Không tìm thấy sản phẩm.",
      location: withQuery(createLocation, "error", "offering_not_found"),
    });
  }

  try {
    const landingPage = await createLandingPageFromTemplate({
      sourceOfferingId: offering.id,
      templateId,
      name: name || undefined,
      slug: slug || undefined,
      status,
    });

    return respondSuccess(request, {
      location: withQuery(ROUTES.ADMIN.LANDING_PAGE(landingPage.id), "created", "1"),
      message: "Đã tạo landing page.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const duplicate = (error as { code?: string }).code === "23505"
      || message.includes("landing_pages_slug_unique")
      || message.includes("landing_pages_slug_key");
    const invalidSlug = message === "LANDING_PAGE_INVALID_SLUG";
    const templateMissing = message === "LANDING_PAGE_TEMPLATE_NOT_FOUND";

    return respondError(request, {
      error: duplicate ? "duplicate_slug" : invalidSlug ? "invalid_slug" : templateMissing ? "template_not_found" : "create_failed",
      message: duplicate
        ? "Slug landing page đã tồn tại."
        : invalidSlug
          ? "Slug landing page chỉ được dùng chữ thường, số và dấu gạch ngang."
          : templateMissing
            ? "Mẫu landing page không tồn tại."
            : "Không thể tạo landing page.",
      location: withQuery(
        createLocation,
        "error",
        duplicate ? "duplicate_slug" : invalidSlug ? "invalid_slug" : templateMissing ? "template_not_found" : "create_failed"
      ),
    });
  }
}
