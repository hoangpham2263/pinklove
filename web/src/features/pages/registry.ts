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
      {
        type: "section",
        label: "Banner",
        description: "Nội dung banner đầu trang.",
        fields: [
          { name: "bannerTitle", label: "Title", type: "text", width: 12 },
          { name: "bannerShortDescription", label: "Short Description", type: "text", width: 12 },
          { name: "bannerDescription", label: "Description", type: "wysiwyg", width: 12 },
          { name: "heroButtonText", label: "Nhãn nút chính", type: "text", width: 6 },
          { name: "heroButtonLink", label: "Liên kết nút chính", type: "text", width: 6 },
        ],
      },
      {
        type: "section",
        label: "About Us",
        description: "Nội dung phần giới thiệu trên trang chủ.",
        layout: "two-columns",
        fields: [
          { name: "aboutTitle", label: "Tiêu đề", type: "text", column: "left", width: 12 },
          { name: "aboutDescription", label: "Mô tả", type: "wysiwyg", column: "left", width: 12 },
          { name: "aboutImage", label: "Hình ảnh", type: "media", column: "left", width: 12 },
          { name: "aboutText1", label: "Nội dung bên phải 1", type: "textarea", column: "right", width: 12 },
          { name: "aboutText2", label: "Nội dung bên phải 2", type: "textarea", column: "right", width: 12 },
          { name: "aboutText3", label: "Nội dung bên phải 3", type: "textarea", column: "right", width: 12 },
          {
            name: "aboutItems",
            type: "repeater",
            label: "Items",
            addLabel: "Thêm",
            column: "right",
            width: 12,
            fields: [
              { name: "label", label: "Nhãn", type: "text", width: 12 },
              { name: "content", label: "Nội dung", type: "textarea", width: 12 },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Services Intro",
        description: "Tiêu đề và mô tả phần dịch vụ trên trang chủ.",
        fields: [
          { name: "servicesTitle", label: "Tiêu đề phần dịch vụ", type: "text", width: 12 },
          { name: "servicesDescription", label: "Mô tả phần dịch vụ", type: "textarea", width: 12 },
          {
            name: "serviceItems",
            type: "repeater",
            label: "Service Items",
            description: "Danh sách card dịch vụ hiển thị bên dưới hero.",
            addLabel: "Thêm dịch vụ",
            fields: [
              { name: "headerImage", label: "Ảnh header", type: "media", width: 3 },
              { name: "title", label: "Tiêu đề", type: "text", width: 3 },
              { name: "description", label: "Mô tả ngắn", type: "textarea", width: 6 },
              { name: "descriptionItems", label: "Danh sách mô tả", type: "textarea", width: 12, rows: 8, description: "Mỗi dòng sẽ hiển thị thành một bullet." },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Event Planner",
        description: "Khối nội dung dưới Our Services. 4 field đầu tiên sẽ ghép thành cụm tiêu đề lớn theo thứ tự: dòng trên, dòng dưới, số nổi bật, phần chữ theo sau số.",
        fields: [
          { name: "eventPlannerEyebrow", label: "Tiêu đề dòng trên", type: "text", width: 6, description: "Ví dụ: Bạn đang có kế hoạch" },
          { name: "eventPlannerTitle", label: "Tiêu đề dòng dưới", type: "text", width: 6, description: "Ví dụ: mời tiệc" },
          { name: "eventPlannerHighlight", label: "Số hoặc chữ nổi bật", type: "text", width: 6, description: "Ví dụ: 100+ hoặc 24/7" },
          { name: "eventPlannerSuffix", label: "Phần chữ đi sau số nổi bật", type: "text", width: 6, description: "Ví dụ: mẫu thiệp đẹp dành cho bạn" },
          {
            name: "eventPlannerProblems",
            type: "repeater",
            label: "Danh sách vấn đề",
            description: "Danh sách card khó khăn ở hàng trên.",
            addLabel: "Thêm problem card",
            width: 12,
            fields: [
              { name: "image", label: "Hình minh họa", type: "media", width: 3 },
              { name: "title", label: "Tiêu đề", type: "text", width: 4 },
              { name: "description", label: "Mô tả", type: "textarea", width: 5 },
            ],
          },
          { name: "eventPlannerSolutionTitle", label: "Tiêu đề phần giải pháp", type: "text", width: 12 },
          { name: "eventPlannerHighlightText", label: "Cụm chữ cần tô nổi trong tiêu đề giải pháp", type: "text", width: 6 },
          { name: "eventPlannerSolutionDescription", label: "Mô tả phần giải pháp", type: "textarea", width: 12 },
          { name: "eventPlannerCtaText", label: "Nhãn nút CTA", type: "text", width: 6 },
          { name: "eventPlannerCtaLink", label: "Liên kết nút CTA", type: "text", width: 6 },
          {
            name: "eventPlannerFeatures",
            type: "repeater",
            label: "Danh sách tính năng",
            description: "Danh sách card tính năng ở hàng dưới.",
            addLabel: "Thêm feature card",
            width: 12,
            fields: [
              { name: "title", label: "Tiêu đề", type: "text", width: 4 },
              { name: "description", label: "Mô tả", type: "textarea", width: 6 },
              { name: "accentImage", label: "Ảnh trang trí", type: "media", width: 2 },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Invitation Gallery",
        description: "Khối chọn mẫu và tạo thiệp ở cuối trang home.",
        fields: [
          { name: "invitationGalleryBadge", label: "Icon/Ký hiệu đầu tiêu đề", type: "text", width: 3 },
          { name: "invitationGalleryTitle", label: "Tiêu đề", type: "text", width: 9 },
          { name: "invitationGalleryDescription", label: "Mô tả", type: "textarea", width: 12 },
          { name: "invitationGalleryCtaText", label: "Nhãn CTA", type: "text", width: 6 },
          { name: "invitationGalleryCtaLink", label: "Liên kết CTA", type: "text", width: 6 },
          {
            name: "invitationGalleryProductSlugs",
            label: "Sản phẩm hiển thị",
            description: "Chọn các mẫu thiệp muốn hiển thị trong section này.",
            type: "product-select",
            multiple: true,
            width: 12,
          },
        ],
      },
      {
        type: "section",
        label: "Shared Invitations",
        description: "Khối các mẫu thiệp đã chia sẻ thành công trên trang home.",
        fields: [
          { name: "sharedInvitationsBadge", label: "Icon/Ký hiệu đầu tiêu đề", type: "text", width: 3 },
          { name: "sharedInvitationsTitle", label: "Tiêu đề", type: "text", width: 9 },
          { name: "sharedInvitationsDescription", label: "Mô tả", type: "textarea", width: 12 },
          { name: "sharedInvitationsCtaText", label: "Nhãn CTA", type: "text", width: 6 },
          { name: "sharedInvitationsCtaLink", label: "Liên kết CTA", type: "text", width: 6 },
          {
            name: "sharedInvitationsProductSlugs",
            label: "Sản phẩm hiển thị",
            description: "Chọn các mẫu thiệp muốn hiển thị trong section này.",
            type: "product-select",
            multiple: true,
            width: 12,
          },
        ],
      },
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
