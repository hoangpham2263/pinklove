import type { ProductType } from "@/features/products/types";
import type { FieldSchema } from "@/features/pages/schema";
import { createDefaultBuilderDocument } from "@/features/invitations/builder/defaults";

export type InvitationTemplateDefinition = {
  label: string;
  productType: ProductType;
  defaultTitle: string;
  fields: FieldSchema[];
  defaults: Record<string, unknown>;
  allowProduct?: boolean;
};

const INVITATION_TEMPLATE_BASE_FIELDS: FieldSchema[] = [
  { name: "brideName", label: "Tên cô dâu", type: "text" },
  { name: "groomName", label: "Tên chú rể", type: "text" },
  { name: "heroSubtitle", label: "Lời mở đầu", type: "textarea" },
  { name: "eventDate", label: "Ngày cưới", type: "text" },
  { name: "venue", label: "Địa điểm", type: "text" },
  { name: "gallery", label: "Gallery Images", type: "media", multiple: true },
];

const INVITATION_TEMPLATE_BASE_DEFAULTS = {
  brideName: "Lan",
  groomName: "Minh",
  heroSubtitle: "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.",
  eventDate: "15.12.2026",
  venue: "White Palace, TP.HCM",
  gallery: [],
} satisfies Record<string, unknown>;

export const INVITATION_TEMPLATES: Record<string, InvitationTemplateDefinition> = {
  aurora_veil: {
    label: "Aurora Veil",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Aurora Veil",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Ngày mình chọn nhau",
      storyBody: "Một khởi đầu dịu dàng, một lời mời chân thành và một ngày cưới thật ấm áp đang chờ phía trước.",
    },
  },
  golden_aisle: {
    label: "Golden Aisle",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Golden Aisle",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Lối đi dẫn đến ngày hạnh phúc",
      storyBody: "Mọi chi tiết được sắp đặt để kể lại hành trình yêu thương theo phong cách trang nhã và sang trọng.",
    },
  },
  blush_sonata: {
    label: "Blush Sonata",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Blush Sonata",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Khúc nhạc màu hồng",
      storyBody: "Một bản phối nhẹ nhàng giữa kỷ niệm, hình ảnh và lời mời dành cho những người thân yêu nhất.",
    },
  },
  moonlight_garden: {
    label: "Moonlight Garden",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Moonlight Garden",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Dạ tiệc dưới ánh trăng",
      storyBody: "Phù hợp cho những lễ cưới buổi tối, nhiều cảm xúc và muốn nhấn mạnh không khí lãng mạn.",
    },
  },
  pearl_manor: {
    label: "Pearl Manor",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Pearl Manor",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Tinh giản và sang trọng",
      storyBody: "Một mẫu dành cho cặp đôi thích nhịp đọc ngắn gọn, khoảng trắng đẹp và cảm giác editorial hiện đại.",
    },
  },
  linen_vows: {
    label: "Linen Vows",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Linen Vows",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Lời hẹn ước trên nền linen",
      storyBody: "Thiết kế sáng và thoáng, phù hợp cho những lời mời tinh tế với nhiều cảm xúc nhưng vẫn rất gọn gàng.",
    },
  },
  freeform_sections: {
    label: "Builder Trống Hệ Thống",
    productType: "builder",
    defaultTitle: "Thiệp cưới tự tạo",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
    allowProduct: false,
  },
  editorial_story_builder: {
    label: "Editorial Story",
    productType: "builder",
    defaultTitle: "Builder Editorial Story",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
  floral_scroll_builder: {
    label: "Floral Scroll",
    productType: "builder",
    defaultTitle: "Builder Floral Scroll",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
  timeline_ceremony_builder: {
    label: "Timeline Ceremony",
    productType: "builder",
    defaultTitle: "Builder Timeline Ceremony",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
  minimal_portrait_builder: {
    label: "Minimal Portrait",
    productType: "builder",
    defaultTitle: "Builder Minimal Portrait",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
  velvet_chapel_builder: {
    label: "Velvet Chapel",
    productType: "builder",
    defaultTitle: "Builder Velvet Chapel",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
  ivory_atelier_builder: {
    label: "Ivory Atelier",
    productType: "builder",
    defaultTitle: "Builder Ivory Atelier",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
};

export function getInvitationTemplateDefaults(templateKey: string) {
  const definition = INVITATION_TEMPLATES[templateKey];
  if (!definition) {
    return {};
  }

  return definition.productType === "coded_template"
    ? {
        ...INVITATION_TEMPLATE_BASE_DEFAULTS,
        ...definition.defaults,
      }
    : definition.defaults;
}

export function getInvitationTemplateFields(templateKey: string): FieldSchema[] {
  const definition = INVITATION_TEMPLATES[templateKey];
  if (!definition) {
    return [];
  }

  return definition.productType === "coded_template"
    ? [...INVITATION_TEMPLATE_BASE_FIELDS, ...definition.fields]
    : definition.fields;
}

export function getInvitationTemplateLabel(templateKey: string) {
  return INVITATION_TEMPLATES[templateKey]?.label ?? templateKey;
}

export function getInvitationTemplateProductType(templateKey: string): ProductType | null {
  return INVITATION_TEMPLATES[templateKey]?.productType ?? null;
}

export function getInvitationTemplateOptions(productType?: ProductType) {
  return Object.entries(INVITATION_TEMPLATES)
    .filter(([, config]) => config.allowProduct !== false)
    .filter(([, config]) => !productType || config.productType === productType)
    .map(([value, config]) => ({
      value,
      label: config.label,
      productType: config.productType,
    }));
}
