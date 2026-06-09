import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { getOfferingById } from "@/features/offerings/server/service";
import { updateLandingPage } from "@/features/landing-pages/server/service";
import {
  LANDING_PAGE_SECTION_TYPES,
  LANDING_PAGE_STATUSES,
  type LandingPageSectionType,
  type LandingPageStatus,
} from "@/features/landing-pages/types";

export const runtime = "nodejs";

function isLandingPageStatus(value: string): value is LandingPageStatus {
  return LANDING_PAGE_STATUSES.includes(value as LandingPageStatus);
}

function isSectionType(value: string): value is LandingPageSectionType {
  return LANDING_PAGE_SECTION_TYPES.includes(value as LandingPageSectionType);
}

function withQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function parseSections(input: string) {
  const parsed = JSON.parse(input) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("LANDING_PAGE_INVALID_SECTIONS");
  }

  return parsed.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("LANDING_PAGE_INVALID_SECTIONS");
    }

    const record = item as Record<string, unknown>;
    const sectionType = typeof record.sectionType === "string" ? record.sectionType : "";
    const content = record.content && typeof record.content === "object" && !Array.isArray(record.content)
      ? (record.content as Record<string, unknown>)
      : {};

    if (!isSectionType(sectionType)) {
      throw new Error("LANDING_PAGE_INVALID_SECTIONS");
    }

    return { sectionType, content };
  });
}

function parseChromeContent(input: string): {
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
} {
  const parsed = JSON.parse(input) as unknown;
  const record = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};

  const parseLinks = (value: unknown) => Array.isArray(value)
    ? value.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return [];
        }
        const link = item as Record<string, unknown>;
        const label = typeof link.label === "string" ? link.label.trim() : "";
        const href = typeof link.href === "string" ? link.href.trim() : "";
        return label && href ? [{ label, href }] : [];
      })
    : [];

  const parseContent = (value: unknown) => {
    const content = value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
    return { ...content, links: parseLinks(content.links) };
  };

  return { header: parseContent(record.header), footer: parseContent(record.footer) };
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const landingPageId = String(formData.get("landingPageId") ?? "").trim();
  const sourceOfferingId = String(formData.get("sourceOfferingId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const sectionsJson = String(formData.get("sectionsJson") ?? "[]");
  const chromeContentJson = String(formData.get("chromeContentJson") ?? "{}");
  const fallbackLocation = landingPageId
    ? ROUTES.ADMIN.LANDING_PAGE(landingPageId)
    : ROUTES.ADMIN.LANDING_PAGES;

  if (!landingPageId || !sourceOfferingId || !name || !slug) {
    return respondError(request, {
      error: "missing_fields",
      message: "Thiếu thông tin landing page.",
      location: withQuery(fallbackLocation, "error", "missing_fields"),
    });
  }

  if (!isLandingPageStatus(status)) {
    return respondError(request, {
      error: "invalid_fields",
      message: "Trạng thái landing page không hợp lệ.",
      location: withQuery(fallbackLocation, "error", "invalid_fields"),
    });
  }

  const sourceOffering = await getOfferingById(sourceOfferingId);
  if (!sourceOffering) {
    return respondError(request, {
      error: "source_offering_not_found",
      message: "Không tìm thấy sản phẩm nguồn.",
      location: withQuery(fallbackLocation, "error", "source_offering_not_found"),
    });
  }

  let sections;
  let chromeContent;
  try {
    sections = parseSections(sectionsJson);
    chromeContent = parseChromeContent(chromeContentJson);
  } catch {
    return respondError(request, {
      error: "invalid_sections",
      message: "Nội dung sections không hợp lệ.",
      location: withQuery(fallbackLocation, "error", "invalid_sections"),
    });
  }

  try {
    const landingPage = await updateLandingPage({
      landingPageId,
      sourceOfferingId: sourceOffering.id,
      name,
      slug,
      status,
      header: chromeContent.header,
      footer: chromeContent.footer,
      sections,
    });

    if (!landingPage) {
      return respondError(request, {
        error: "landing_page_not_found",
        message: "Không tìm thấy landing page.",
        location: withQuery(ROUTES.ADMIN.LANDING_PAGES, "error", "landing_page_not_found"),
      });
    }

    return respondSuccess(request, {
      location: withQuery(ROUTES.ADMIN.LANDING_PAGE(landingPage.id), "saved", "1"),
      message: "Đã cập nhật landing page.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const duplicate = (error as { code?: string }).code === "23505"
      || message.includes("landing_pages_slug_unique")
      || message.includes("landing_pages_slug_key");
    const invalidSlug = message === "LANDING_PAGE_INVALID_SLUG";

    return respondError(request, {
      error: duplicate ? "duplicate_slug" : invalidSlug ? "invalid_slug" : "update_failed",
      message: duplicate
        ? "Slug landing page đã tồn tại."
        : invalidSlug
          ? "Slug chỉ được dùng chữ thường, số và dấu gạch ngang."
          : "Không thể cập nhật landing page.",
      location: withQuery(fallbackLocation, "error", duplicate ? "duplicate_slug" : invalidSlug ? "invalid_slug" : "update_failed"),
    });
  }
}
