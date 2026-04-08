import type { FieldSchema } from "@/features/pages/schema";

export type ContentPageConfig = {
  slug: string;
  name: string;
  label: string;
  fields: FieldSchema[];
};

export const CONTENT_PAGES: Record<string, ContentPageConfig> = {
  home: {
    slug: "home",
    name: "Home Page",
    label: "Trang chủ",
    fields: [
      { name: "heroTitle", label: "Tiêu đề Hero", type: "text" },
      { name: "heroDescription", label: "Mô tả Hero", type: "textarea" },
      { name: "heroButtonText", label: "Nhãn nút chính", type: "text" },
      { name: "heroButtonLink", label: "Liên kết nút chính", type: "text" },
      { name: "secondaryButtonText", label: "Nhãn nút phụ", type: "text" },
      { name: "secondaryButtonLink", label: "Liên kết nút phụ", type: "text" },
    ],
  },
  "about-us": {
    slug: "about-us",
    name: "About Us",
    label: "Trang giới thiệu",
    fields: [
      { name: "bannerImage", label: "Ảnh banner đầu trang", type: "media" },
      { name: "introHeading", label: "Tiêu đề giới thiệu", type: "text" },
      { name: "introText", label: "Nội dung giới thiệu", type: "textarea" },
    ],
  },
  contact: {
    slug: "contact",
    name: "Contact",
    label: "Trang liên hệ",
    fields: [
      { name: "contactEmail", label: "Email liên hệ công khai", type: "text" },
      { name: "contactPhone", label: "Số điện thoại liên hệ", type: "text" },
      { name: "contactAddress", label: "Địa chỉ văn phòng", type: "textarea" },
      { name: "googleMapsEmbed", label: "Liên kết nhúng Google Maps", type: "textarea" },
      { name: "zaloUrl", label: "Liên kết Zalo", type: "text" },
      { name: "zaloImage", label: "Ảnh Zalo", type: "media" },
      { name: "facebookUrl", label: "Liên kết Facebook", type: "text" },
      { name: "facebookImage", label: "Ảnh Facebook", type: "media" },
      { name: "instagramUrl", label: "Liên kết Instagram", type: "text" },
      { name: "instagramImage", label: "Ảnh Instagram", type: "media" },
      { name: "tiktokUrl", label: "Liên kết TikTok", type: "text" },
      { name: "tiktokImage", label: "Ảnh TikTok", type: "media" },
    ],
  },
  templates: {
    slug: "templates",
    name: "Templates",
    label: "Trang mẫu thiệp",
    fields: [],
  },
  builder: {
    slug: "builder",
    name: "Builder",
    label: "Trang builder",
    fields: [],
  },
  services: {
    slug: "services",
    name: "Services",
    label: "Trang gói dịch vụ",
    fields: [],
  },
  tools: {
    slug: "tools",
    name: "Tools",
    label: "Trang công cụ",
    fields: [],
  },
  "tools/qr-builder": {
    slug: "tools/qr-builder",
    name: "QR Builder",
    label: "Trang công cụ QR",
    fields: [],
  },
  "tools/wedding-budget": {
    slug: "tools/wedding-budget",
    name: "Wedding Budget",
    label: "Trang công cụ chi phí cưới",
    fields: [],
  },
  blog: {
    slug: "blog",
    name: "Blog",
    label: "Trang blog",
    fields: [],
  },
  "not-found": {
    slug: "not-found",
    name: "Not Found",
    label: "Trang 404",
    fields: [
      { name: "badgeText", label: "Nhãn nhỏ đầu trang", type: "text" },
      { name: "panelTitle", label: "Tiêu đề khối điều hướng", type: "text" },
      { name: "panelDescription", label: "Mô tả khối điều hướng", type: "textarea" },
      { name: "primaryButtonText", label: "Nhãn nút chính", type: "text" },
      { name: "primaryButtonLink", label: "Liên kết nút chính", type: "text" },
      { name: "secondaryButtonText", label: "Nhãn nút phụ", type: "text" },
      { name: "secondaryButtonLink", label: "Liên kết nút phụ", type: "text" },
      { name: "card1Title", label: "Tiêu đề card 1", type: "text" },
      { name: "card1Description", label: "Mô tả card 1", type: "textarea" },
      { name: "card1Link", label: "Liên kết card 1", type: "text" },
      { name: "card2Title", label: "Tiêu đề card 2", type: "text" },
      { name: "card2Description", label: "Mô tả card 2", type: "textarea" },
      { name: "card2Link", label: "Liên kết card 2", type: "text" },
      { name: "card3Title", label: "Tiêu đề card 3", type: "text" },
      { name: "card3Description", label: "Mô tả card 3", type: "textarea" },
      { name: "card3Link", label: "Liên kết card 3", type: "text" },
      { name: "card4Title", label: "Tiêu đề card 4", type: "text" },
      { name: "card4Description", label: "Mô tả card 4", type: "textarea" },
      { name: "card4Link", label: "Liên kết card 4", type: "text" },
      { name: "backLinkText", label: "Nhãn link quay lại", type: "text" },
      { name: "backLink", label: "Liên kết quay lại", type: "text" },
    ],
  },
};

export function isContentPageSlug(slug: string): boolean {
  return slug in CONTENT_PAGES;
}

export function getContentPageFields(slug: string): FieldSchema[] {
  return CONTENT_PAGES[slug]?.fields ?? [];
}

export function getContentPageLabel(slug: string): string {
  return CONTENT_PAGES[slug]?.label ?? slug;
}

export function listContentPageConfigs(): ContentPageConfig[] {
  return Object.values(CONTENT_PAGES);
}

export function listContentPageSlugs(): string[] {
  return Object.keys(CONTENT_PAGES);
}
