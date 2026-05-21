import type { FieldSchema } from "@/features/pages/schema";

export type ContentPageConfig = {
  slug: string;
  name: string;
  label: string;
  fields: FieldSchema[];
};

export const CONTENT_PAGE_SLUG_ALIASES: Record<string, string> = {
  "about-us": "gioi-thieu",
  contact: "lien-he",
  templates: "mau-thiep",
  paper: "thiep-giay",
  builder: "tu-tao-thiep",
  services: "dich-vu",
  tools: "cong-cu",
  "tools/qr-builder": "cong-cu/tao-ma-qr",
  "tools/wedding-budget": "cong-cu/du-toan-cuoi",
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
          { name: "bannerTopLine", label: "Dòng 1", type: "text", width: 12 },
          { name: "bannerLine1Prefix", label: "Dòng 2 - Phần cố định", type: "text", width: 6 },
          {
            name: "bannerLine1Rotating",
            label: "Dòng 2 - Nội dung thay đổi",
            type: "textarea",
            width: 6,
            rows: 5,
          },
          { name: "bannerLine1Suffix", label: "Dòng 3 - Phần cố định", type: "text", width: 6 },
          {
            name: "bannerLine2",
            label: "Dòng 3 - Tên thương hiệu",
            type: "text",
            width: 6,
          },
          { name: "bannerShortDescription", label: "Mô tả ngắn", type: "text", width: 12 },
          { name: "bannerDescription", label: "Mô tả", type: "wysiwyg", width: 12 },
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
  "gioi-thieu": {
    slug: "gioi-thieu",
    name: "Giới thiệu",
    label: "Trang giới thiệu",
    fields: [
      {
        type: "section",
        label: "Banner",
        description: "Nội dung đầu trang giới thiệu doanh nghiệp.",
        fields: [
          { name: "bannerImage", label: "Ảnh banner đầu trang", type: "media", width: 4 },
          { name: "introHeading", label: "Tiêu đề giới thiệu", type: "text", width: 12 },
          { name: "introText", label: "Nội dung giới thiệu", type: "textarea", width: 12 },
        ],
      },
      {
        type: "section",
        label: "Sứ mệnh",
        description: "Thông điệp chính về lý do doanh nghiệp tồn tại và cách tạo giá trị.",
        fields: [
          { name: "missionTitle", label: "Tiêu đề sứ mệnh", type: "text", width: 12 },
          { name: "missionText", label: "Mô tả sứ mệnh", type: "textarea", width: 12 },
        ],
      },
      {
        name: "stats",
        type: "repeater",
        label: "Số liệu nổi bật",
        addLabel: "Thêm số liệu",
        fields: [
          { name: "value", label: "Số liệu", type: "text", width: 3 },
          { name: "label", label: "Nhãn", type: "text", width: 5 },
          { name: "description", label: "Mô tả", type: "textarea", width: 12 },
        ],
      },
      {
        name: "valueItems",
        type: "repeater",
        label: "Giá trị cốt lõi",
        addLabel: "Thêm giá trị",
        fields: [
          { name: "title", label: "Tiêu đề", type: "text", width: 5 },
          { name: "description", label: "Mô tả", type: "textarea", width: 12 },
        ],
      },
      {
        name: "storyItems",
        type: "repeater",
        label: "Hành trình / câu chuyện",
        addLabel: "Thêm mốc",
        fields: [
          { name: "label", label: "Nhãn mốc", type: "text", width: 3 },
          { name: "title", label: "Tiêu đề", type: "text", width: 9 },
          { name: "description", label: "Mô tả", type: "textarea", width: 12 },
        ],
      },
      {
        type: "section",
        label: "CTA cuối trang",
        description: "Kêu gọi khách truy cập liên hệ hoặc xem thêm.",
        fields: [
          { name: "ctaTitle", label: "Tiêu đề CTA", type: "text", width: 12 },
          { name: "ctaDescription", label: "Mô tả CTA", type: "textarea", width: 12 },
          { name: "ctaButtonText", label: "Nút CTA", type: "text", width: 4 },
          { name: "ctaButtonLink", label: "Link CTA", type: "text", width: 8 },
        ],
      },
    ],
  },
  "lien-he": {
    slug: "lien-he",
    name: "Liên hệ",
    label: "Trang liên hệ",
    fields: [
      {
        type: "section",
        label: "Intro",
        description: "Nội dung mở đầu của trang liên hệ.",
        fields: [
          { name: "heroTitleText", label: "Tiêu đề", type: "text", width: 5 },
          { name: "heroTitleKeyword", label: "Keyword tiêu đề", type: "text", width: 5 },
          { name: "heroTitleKeywordHighlight", label: "Bật hiệu ứng keyword", type: "switch", width: 6 },
          { name: "supportDescription", label: "Mô tả", type: "textarea", width: 12 },
        ],
      },
      {
        type: "section",
        label: "Contact Info",
        description: "3 thông tin nhanh hiển thị ở phần đầu trang liên hệ.",
        fields: [
          {
            name: "responseTime",
            label: "Phản hồi",
            description: "Ví dụ: Trong vòng 2 giờ làm việc",
            type: "text",
            width: 4,
          },
          {
            name: "officeHours",
            label: "Hỗ trợ",
            description: "Ví dụ: 08:30 - 18:00, Thứ 2 - Thứ 7",
            type: "text",
            width: 4,
          },
          {
            name: "contactPhone",
            label: "Hotline",
            description: "Ví dụ: 0909 000 999",
            type: "text",
            width: 4,
          },
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
    ],
  },
  "mau-thiep": {
    slug: "mau-thiep",
    name: "Mẫu thiệp",
    label: "Trang mẫu thiệp",
    fields: [],
  },
  "thiep-giay": {
    slug: "thiep-giay",
    name: "Thiệp giấy",
    label: "Trang thiệp giấy",
    fields: [],
  },
  "tu-tao-thiep": {
    slug: "tu-tao-thiep",
    name: "Tự tạo thiệp",
    label: "Trang builder",
    fields: [],
  },
  "dich-vu": {
    slug: "dich-vu",
    name: "Dịch vụ",
    label: "Trang gói dịch vụ",
    fields: [
      {
        type: "section",
        label: "Banner",
        description: "Nội dung đầu trang dịch vụ.",
        fields: [
          { name: "heroTitle", label: "Tiêu đề", type: "text", width: 12 },
          { name: "heroDescription", label: "Mô tả", type: "textarea", width: 12 },
        ],
      },
      {
        type: "section",
        label: "Thông tin bảng gói",
        fields: [
          { name: "plansTitle", label: "Tiêu đề bảng gói", type: "text", width: 12 },
          { name: "plansDescription", label: "Mô tả bảng gói", type: "textarea", width: 12 },
          { name: "highlightEyebrow", label: "Nhãn khuyến mãi", type: "text", width: 4 },
          { name: "highlightTitle", label: "Tiêu đề khuyến mãi", type: "text", width: 4 },
          { name: "highlightBadgeLabel", label: "Nhãn badge khuyến mãi", type: "text", width: 4 },
          { name: "highlightDescription", label: "Mô tả khuyến mãi", type: "textarea", width: 8 },
          { name: "highlightOffer", label: "Nội dung badge khuyến mãi", type: "text", width: 4 },
          { name: "plansEyebrow", label: "Nhãn nhỏ bảng gói", type: "text", width: 4 },
          { name: "comparisonEyebrow", label: "Nhãn nhỏ bảng so sánh", type: "text", width: 4 },
          { name: "comparisonFirstColumnTitle", label: "Tiêu đề cột hạng mục", type: "text", width: 4 },
          { name: "planFeaturesTitle", label: "Tiêu đề danh sách tính năng", type: "text", width: 6 },
          { name: "comparisonLimitTitle", label: "Tiêu đề nhóm giới hạn", type: "text", width: 6 },
        ],
      },
      {
        type: "section",
        label: "Các gói dịch vụ",
        fields: [
          {
            name: "pricingPlans",
            type: "repeater",
            label: "Danh sách gói",
            addLabel: "Thêm gói",
            fields: [
              { name: "name", label: "Tên gói", type: "text", width: 3 },
              { name: "price", label: "Giá", type: "text", width: 3 },
              { name: "badge", label: "Nhãn nổi bật", type: "text", width: 3 },
              { name: "summary", label: "Mô tả ngắn", type: "textarea", width: 12 },
            ],
          },
          {
            name: "comparisonLimitRows",
            type: "repeater",
            label: "Giới hạn gói",
            addLabel: "Thêm giới hạn",
            fields: [
              { name: "label", label: "Hạng mục", type: "text", width: 3 },
              { name: "plan1", label: "Gói 1", type: "text", width: 3 },
              { name: "plan2", label: "Gói 2", type: "text", width: 3 },
              { name: "plan3", label: "Gói 3", type: "text", width: 3 },
            ],
          },
          {
            name: "comparisonFeatureRows",
            type: "repeater",
            label: "Tính năng chính",
            addLabel: "Thêm tính năng",
            fields: [
              { name: "label", label: "Tính năng", type: "text", width: 6 },
              { name: "plan1", label: "Gói 1", type: "checkbox", width: 2 },
              { name: "plan2", label: "Gói 2", type: "checkbox", width: 2 },
              { name: "plan3", label: "Gói 3", type: "checkbox", width: 2 },
            ],
          },
        ],
      },
      {
        name: "faqItems",
        type: "repeater",
        label: "FAQ",
        addLabel: "Thêm câu hỏi",
        fields: [
          { name: "question", label: "Câu hỏi", type: "text", width: 4 },
          { name: "answer", label: "Trả lời", type: "textarea", width: 8 },
        ],
      },
      {
        type: "section",
        label: "CTA cuối trang",
        fields: [
          { name: "ctaTitle", label: "Tiêu đề CTA", type: "text", width: 12 },
          { name: "ctaDescription", label: "Mô tả CTA", type: "textarea", width: 12 },
          { name: "ctaButtonText", label: "Nút CTA", type: "text", width: 4 },
          { name: "ctaButtonLink", label: "Link CTA", type: "text", width: 8 },
        ],
      },
    ],
  },
  "partners/apply": {
    slug: "partners/apply",
    name: "Nhà cung cấp",
    label: "Trang nhà cung cấp",
    fields: [],
  },
  affiliates: {
    slug: "affiliates",
    name: "Affiliate",
    label: "Trang affiliate",
    fields: [],
  },
  "cong-cu": {
    slug: "cong-cu",
    name: "Công cụ",
    label: "Trang công cụ",
    fields: [],
  },
  "cong-cu/tao-ma-qr": {
    slug: "cong-cu/tao-ma-qr",
    name: "Tạo mã QR",
    label: "Trang công cụ QR",
    fields: [],
  },
  "cong-cu/du-toan-cuoi": {
    slug: "cong-cu/du-toan-cuoi",
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

export function resolveContentPageSlugAlias(slug: string): string {
  return CONTENT_PAGE_SLUG_ALIASES[slug] ?? slug;
}

export function isContentPageSlug(slug: string): boolean {
  return resolveContentPageSlugAlias(slug) in CONTENT_PAGES;
}

export function getContentPageFields(slug: string): FieldSchema[] {
  return CONTENT_PAGES[resolveContentPageSlugAlias(slug)]?.fields ?? [];
}

export function getContentPageLabel(slug: string): string {
  return CONTENT_PAGES[resolveContentPageSlugAlias(slug)]?.label ?? slug;
}

export function listContentPageConfigs(): ContentPageConfig[] {
  return Object.values(CONTENT_PAGES);
}

export function listContentPageSlugs(): string[] {
  return Object.keys(CONTENT_PAGES);
}
