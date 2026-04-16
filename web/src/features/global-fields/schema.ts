import type { FieldSchema } from "@/features/pages/schema";

export const GLOBAL_FIELDS_SCHEMA: FieldSchema[] = [
  {
    type: "section",
    label: "Header Settings",
    description: "Nội dung dùng chung cho header và phần nhận diện đầu trang.",
    fields: [
      { name: "siteAnnouncement", label: "Thông báo toàn site", type: "textarea", width: 12 },
      { name: "defaultShareBadge", label: "Ảnh badge dùng chung", type: "media", width: 12 },
    ],
  },
  {
    type: "section",
    label: "Footer Settings",
    description: "Nội dung dùng chung cho footer khu guest.",
    fields: [
      {
        type: "section",
        label: "Brand & Contact",
        description: "Khối logo, tagline và thông tin liên hệ đầu footer.",
        fields: [
          { name: "footerBackgroundImage", label: "Ảnh nền footer", type: "media", width: 12 },
          { name: "footerBrandImage", label: "Logo footer", type: "media", width: 6 },
          { name: "footerBrandTagline", label: "Tagline ở footer", type: "text", width: 6 },
          {
            name: "footerIntroItems",
            type: "repeater",
            label: "Footer Intro Items",
            description: "Danh sách dòng giới thiệu như địa chỉ, hotline, email.",
            addLabel: "Thêm dòng giới thiệu",
            fields: [
              { name: "icon", label: "Icon", type: "media", width: 2 },
              { name: "label", label: "Label", type: "text", width: 3 },
              { name: "value", label: "Value", type: "text", width: 4 },
              { name: "href", label: "Liên kết", type: "text", width: 3 },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Services Column",
        description: "Danh sách link cột Dịch vụ.",
        fields: [
          {
            name: "footerServiceLinks",
            type: "repeater",
            label: "Footer Service Links",
            addLabel: "Thêm link dịch vụ",
            fields: [
              { name: "label", label: "Tên link", type: "text", width: 4 },
              { name: "url", label: "Liên kết", type: "text", width: 8 },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Quick Links Column",
        description: "Danh sách link cột Liên kết nhanh.",
        fields: [
          {
            name: "footerQuickLinks",
            type: "repeater",
            label: "Footer Quick Links",
            addLabel: "Thêm quick link",
            fields: [
              { name: "label", label: "Tên link", type: "text", width: 4 },
              { name: "url", label: "Liên kết", type: "text", width: 8 },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Partners Column",
        description: "Danh sách link cột Đối tác.",
        fields: [
          {
            name: "footerPartnerLinks",
            type: "repeater",
            label: "Footer Partner Links",
            addLabel: "Thêm link đối tác",
            fields: [
              { name: "label", label: "Tên link", type: "text", width: 4 },
              { name: "url", label: "Liên kết", type: "text", width: 8 },
            ],
          },
        ],
      },
      {
        type: "section",
        label: "Social & Floating Buttons",
        description: "Social trong footer và các nút nổi bên phải.",
        fields: [
          { name: "footerNewsletterPlaceholder", label: "Placeholder ô email", type: "text", width: 12 },
          { name: "zaloUrl", label: "Liên kết Zalo", type: "text", width: 3 },
          { name: "facebookUrl", label: "Liên kết Facebook", type: "text", width: 3 },
          { name: "instagramUrl", label: "Liên kết Instagram", type: "text", width: 3 },
          { name: "tiktokUrl", label: "Liên kết TikTok", type: "text", width: 3 },
          {
            name: "footerSocialLinks",
            type: "repeater",
            label: "Footer Social Links",
            description: "Danh sách social ở footer và nút nổi bên phải.",
            addLabel: "Thêm social link",
            fields: [
              { name: "platform", label: "Nền tảng", type: "text", width: 3 },
              { name: "label", label: "Tên hiển thị", type: "text", width: 3 },
              { name: "url", label: "Liên kết", type: "text", width: 6 },
            ],
          },
        ],
      },
      { name: "footerCopyright", label: "Copyright footer", type: "text", width: 12 },
    ],
  },
];
