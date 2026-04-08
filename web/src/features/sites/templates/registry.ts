import type { ProductType } from "@/features/products/types";
import type { FieldSchema } from "@/features/pages/schema";
import { createDefaultBuilderDocument } from "@/features/sites/builder/defaults";

export type WeddingTemplateDefinition = {
  label: string;
  productType: ProductType;
  defaultTitle: string;
  fields: FieldSchema[];
  defaults: Record<string, unknown>;
};

const WEDDING_TEMPLATE_BASE_FIELDS: FieldSchema[] = [
  { name: "brideName", label: "Tên cô dâu", type: "text" },
  { name: "groomName", label: "Tên chú rể", type: "text" },
  { name: "heroSubtitle", label: "Lời mở đầu", type: "textarea" },
  { name: "eventDate", label: "Ngày cưới", type: "text" },
  { name: "venue", label: "Địa điểm", type: "text" },
  { name: "gallery", label: "Gallery URLs", type: "textarea" },
];

const WEDDING_TEMPLATE_BASE_DEFAULTS = {
  brideName: "Lan",
  groomName: "Minh",
  heroSubtitle: "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.",
  eventDate: "15.12.2026",
  venue: "White Palace, TP.HCM",
  gallery: [],
} satisfies Record<string, unknown>;

export const WEDDING_TEMPLATES: Record<string, WeddingTemplateDefinition> = {
  romantic_bloom: {
    label: "Romantic Bloom",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Romantic Bloom",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      storyTitle: "Chuyện của chúng mình",
      storyBody: "Từ một lần gặp gỡ rất tình cờ, chúng mình đã cùng nhau đi qua nhiều kỷ niệm đẹp.",
    },
  },
  classic_garden: {
    label: "Classic Garden",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Classic Garden",
    fields: [
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
    ],
    defaults: {
      brideName: "Trâm",
      groomName: "Huy",
      heroSubtitle: "Một lời mời ấm áp dành cho người thân yêu trong ngày cưới của chúng tôi.",
      eventDate: "20.01.2027",
      venue: "Garden Hall, Đà Lạt",
      storyTitle: "Hành trình yêu thương",
      storyBody: "Chúng mình mong được chia sẻ niềm vui này với tất cả bạn bè và người thân.",
    },
  },
  freeform_sections: {
    label: "Builder Starter",
    productType: "builder_template",
    defaultTitle: "Thiệp cưới tự tạo",
    fields: [],
    defaults: {
      builderDocument: createDefaultBuilderDocument(),
    },
  },
};

export function getWeddingTemplateDefaults(templateKey: string) {
  const definition = WEDDING_TEMPLATES[templateKey];
  if (!definition) {
    return {};
  }

  return definition.productType === "coded_template"
    ? {
        ...WEDDING_TEMPLATE_BASE_DEFAULTS,
        ...definition.defaults,
      }
    : definition.defaults;
}

export function getWeddingTemplateFields(templateKey: string): FieldSchema[] {
  const definition = WEDDING_TEMPLATES[templateKey];
  if (!definition) {
    return [];
  }

  return definition.productType === "coded_template"
    ? [...WEDDING_TEMPLATE_BASE_FIELDS, ...definition.fields]
    : definition.fields;
}

export function getWeddingTemplateLabel(templateKey: string) {
  return WEDDING_TEMPLATES[templateKey]?.label ?? templateKey;
}

export function getWeddingTemplateProductType(templateKey: string): ProductType | null {
  return WEDDING_TEMPLATES[templateKey]?.productType ?? null;
}

export function getWeddingTemplateOptions(productType?: ProductType) {
  return Object.entries(WEDDING_TEMPLATES)
    .filter(([, config]) => !productType || config.productType === productType)
    .map(([value, config]) => ({
      value,
      label: config.label,
      productType: config.productType,
    }));
}
