import { AboutTemplate } from "@/features/client/templates/AboutTemplate";
import { ContactTemplate } from "@/features/client/templates/ContactTemplate";
import { DefaultTemplate } from "@/features/client/templates/DefaultTemplate";
import { HomeTemplate } from "@/features/client/templates/HomeTemplate";
import type { CmsPage } from "@/lib/cms";
import type { PageTemplateDefinition, TemplateField } from "./types";

const PUBLIC_PAGE_TEMPLATES: Record<string, PageTemplateDefinition> = {
  default: {
    label: "Mặc định",
    fields: [],
    component: DefaultTemplate,
  },
  home: {
    label: "Trang chủ",
    fields: [
      { name: "heroTitle", label: "Tiêu đề Hero", type: "text" },
      { name: "heroDescription", label: "Mô tả Hero", type: "textarea" },
      { name: "heroButtonText", label: "Nhãn nút chính", type: "text" },
      { name: "heroButtonLink", label: "Liên kết nút chính", type: "text" },
      { name: "secondaryButtonText", label: "Nhãn nút phụ", type: "text" },
      { name: "secondaryButtonLink", label: "Liên kết nút phụ", type: "text" },
    ],
    component: HomeTemplate,
  },
  about: {
    label: "Giới thiệu",
    fields: [
      { name: "bannerImage", label: "Ảnh banner đầu trang", type: "media" },
      { name: "introHeading", label: "Tiêu đề giới thiệu", type: "text" },
      { name: "introText", label: "Nội dung giới thiệu", type: "textarea" },
    ],
    component: AboutTemplate,
  },
  contact: {
    label: "Liên hệ",
    fields: [
      { name: "contactEmail", label: "Email liên hệ công khai", type: "text" },
      { name: "contactPhone", label: "Số điện thoại liên hệ", type: "text" },
      { name: "contactAddress", label: "Địa chỉ văn phòng", type: "textarea" },
      { name: "googleMapsEmbed", label: "Liên kết nhúng Google Maps", type: "textarea" },
    ],
    component: ContactTemplate,
  },
};

export function getPageTemplateLabel(templateKey: string): string {
  return PUBLIC_PAGE_TEMPLATES[templateKey]?.label ?? templateKey;
}

export function getPageTemplateFields(templateKey: string): TemplateField[] {
  return PUBLIC_PAGE_TEMPLATES[templateKey]?.fields ?? [];
}

export function listPageTemplateOptions() {
  return Object.entries(PUBLIC_PAGE_TEMPLATES).map(([value, config]) => ({
    value,
    label: config.label,
  }));
}

export function buildCmsPageDraft(input: {
  name: string;
  slug: string;
  title?: string;
  template?: string;
}): Pick<CmsPage, "name" | "slug" | "title" | "status" | "template"> {
  return {
    name: input.name,
    slug: input.slug,
    title: input.title?.trim() || input.name,
    status: "draft",
    template: input.template || "default",
  };
}

export function resolvePublicTemplateKey(page: Pick<CmsPage, "template" | "slug">): string {
  const templateKey = page.template || "default";

  if (templateKey !== "default") {
    return templateKey;
  }

  if (page.slug === "home") return "home";
  if (page.slug === "about-us" || page.slug === "about") return "about";
  if (page.slug === "contact") return "contact";
  return "default";
}
