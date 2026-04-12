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
    name: "Trang chủ",
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
    name: "Giới thiệu",
    label: "Trang giới thiệu",
    fields: [
      { name: "bannerImage", label: "Ảnh banner đầu trang", type: "media" },
      { name: "introHeading", label: "Tiêu đề giới thiệu", type: "text" },
      { name: "introText", label: "Nội dung giới thiệu", type: "textarea" },
    ],
  },
  contact: {
    slug: "contact",
    name: "Liên hệ",
    label: "Trang liên hệ",
    fields: [
      {
        type: "section",
        label: "Intro",
        description: "Nội dung mở đầu của trang liên hệ.",
        fields: [
          { name: "heroBadge", label: "Nhãn nhỏ đầu trang", type: "text", width: 3 },
          { name: "supportTitle", label: "Tiêu đề khối giới thiệu", type: "text", width: 9 },
          { name: "supportDescription", label: "Mô tả khối giới thiệu", type: "textarea", width: 12 },
          { name: "responseTime", label: "Thời gian phản hồi", type: "text", width: 6 },
          { name: "officeHours", label: "Khung giờ hỗ trợ", type: "text", width: 6 },
        ],
      },
      {
        type: "section",
        label: "Contact Info",
        description: "Thông tin liên hệ chính hiển thị trong card.",
        fields: [
          { name: "contactEmail", label: "Email liên hệ công khai", type: "text", width: 6 },
          { name: "contactPhone", label: "Số điện thoại liên hệ", type: "text", width: 6 },
          { name: "contactAddress", label: "Địa chỉ văn phòng", type: "textarea", width: 12 },
        ],
      },
      {
        name: "socialLinks",
        type: "repeater",
        label: "Social Links",
        description: "Các kênh social ở phần đầu trang.",
        addLabel: "Thêm social link",
        fields: [
          { name: "image", label: "Ảnh đại diện", type: "media", width: 2 },
          { name: "label", label: "Tên kênh", type: "text", width: 3 },
          { name: "url", label: "Liên kết", type: "text", width: 7 },
          { name: "description", label: "Mô tả ngắn", type: "textarea", width: 12 },
        ],
      },
      {
        name: "contactMethods",
        type: "repeater",
        label: "Contact Methods",
        description: "Các card phương thức liên hệ như email, hotline, địa chỉ.",
        addLabel: "Thêm contact method",
        fields: [
          { name: "label", label: "Tên field", type: "text", width: 3 },
          { name: "value", label: "Giá trị hiển thị", type: "text", width: 3 },
          { name: "href", label: "Liên kết khi click", type: "text", width: 3 },
          { name: "description", label: "Mô tả ngắn", type: "textarea", width: 3 },
        ],
      },
      {
        name: "faqItems",
        type: "repeater",
        label: "FAQ",
        description: "Danh sách câu hỏi thường gặp.",
        addLabel: "Thêm câu hỏi",
        fields: [
          { name: "question", label: "Câu hỏi", type: "text", width: 4 },
          { name: "answer", label: "Trả lời", type: "textarea", width: 8 },
        ],
      },
      {
        type: "section",
        label: "Map",
        fields: [
          { name: "googleMapsEmbed", label: "Liên kết nhúng Google Maps", type: "textarea", width: 12 },
        ],
      },
    ],
  },
  templates: {
    slug: "templates",
    name: "Mẫu thiệp",
    label: "Trang mẫu thiệp",
    fields: [],
  },
  builder: {
    slug: "builder",
    name: "Tự tạo thiệp",
    label: "Trang builder",
    fields: [],
  },
  services: {
    slug: "services",
    name: "Dịch vụ",
    label: "Trang gói dịch vụ",
    fields: [],
  },
  tools: {
    slug: "tools",
    name: "Công cụ",
    label: "Trang công cụ",
    fields: [],
  },
  "tools/qr-builder": {
    slug: "tools/qr-builder",
    name: "Tạo mã QR",
    label: "Trang công cụ QR",
    fields: [],
  },
  "tools/wedding-budget": {
    slug: "tools/wedding-budget",
    name: "Dự toán cưới",
    label: "Trang công cụ chi phí cưới",
    fields: [],
  },
  blog: {
    slug: "blog",
    name: "Bài viết",
    label: "Trang blog",
    fields: [],
  },
  "not-found": {
    slug: "not-found",
    name: "Không tìm thấy",
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
