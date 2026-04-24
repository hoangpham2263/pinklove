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
        label: "Footer Social",
        description: "Phần placeholder email và social hiển thị trong footer.",
        fields: [
          { name: "footerNewsletterPlaceholder", label: "Placeholder ô email", type: "text", width: 12 },
          {
            name: "footerSocialLinks",
            type: "repeater",
            label: "Footer Social Links",
            description: "Danh sách social hiển thị ở footer.",
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
  {
    type: "section",
    label: "Floating Bar Settings",
    description: "Thiết lập social dùng chung và các nút nổi bên phải.",
    fields: [
      {
        name: "floatingBarItems",
        type: "repeater",
        label: "Floating Bar Buttons",
        description: "Danh sách nút nổi bên phải, mỗi nút gồm ảnh và liên kết mở tab mới.",
        addLabel: "Thêm nút nổi",
        fields: [
          { name: "image", label: "Ảnh nút", type: "media", width: 3 },
          { name: "label", label: "Tên hiển thị", type: "text", width: 3 },
          { name: "url", label: "Liên kết", type: "text", width: 6 },
        ],
      },
    ],
  },
  {
    type: "section",
    label: "FAQ Settings",
    description: "Nội dung FAQ dùng chung cho trang dịch vụ.",
    fields: [
      { name: "globalFaqTitle", label: "Tiêu đề FAQ", type: "text", width: 12 },
      { name: "globalFaqDescription", label: "Mô tả FAQ", type: "textarea", width: 12 },
      {
        name: "globalFaqItems",
        type: "repeater",
        label: "FAQ Items",
        description: "Danh sách câu hỏi thường gặp hiển thị sau phần dịch vụ.",
        addLabel: "Thêm câu hỏi",
        fields: [
          { name: "question", label: "Câu hỏi", type: "textarea", width: 4 },
          { name: "answer", label: "Trả lời", type: "wysiwyg", width: 8 },
        ],
      },
    ],
  },
  {
    type: "section",
    label: "PinkCloud Settings",
    description: "Thiết lập nội dung bubble message của PinkCloud.",
    fields: [
      {
        name: "pinkCloudMessages",
        type: "repeater",
        label: "PinkCloud Messages",
        description: "Danh sách câu thoại luân phiên hiển thị trong bubble của PinkCloud.",
        addLabel: "Thêm message",
        fields: [
          { name: "message", label: "Message", type: "text", width: 12 },
        ],
      },
    ],
  },
];
