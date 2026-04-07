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

export const WEDDING_TEMPLATES: Record<string, WeddingTemplateDefinition> = {
  romantic_bloom: {
    label: "Romantic Bloom",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Romantic Bloom",
    fields: [
      { name: "heroTitle", label: "Tiêu đề Hero", type: "text" },
      { name: "heroSubtitle", label: "Mô tả Hero", type: "textarea" },
      { name: "eventDate", label: "Ngày cưới", type: "text" },
      { name: "venue", label: "Địa điểm", type: "text" },
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
      { name: "gallery", label: "Gallery URLs", type: "textarea" },
    ],
    defaults: {
      heroTitle: "Minh & Lan",
      heroSubtitle: "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.",
      eventDate: "15.12.2026",
      venue: "White Palace, TP.HCM",
      storyTitle: "Chuyện của chúng mình",
      storyBody: "Từ một lần gặp gỡ rất tình cờ, chúng mình đã cùng nhau đi qua nhiều kỷ niệm đẹp.",
      gallery: [],
    },
  },
  classic_garden: {
    label: "Classic Garden",
    productType: "coded_template",
    defaultTitle: "Thiệp cưới Classic Garden",
    fields: [
      { name: "heroTitle", label: "Tiêu đề Hero", type: "text" },
      { name: "heroSubtitle", label: "Mô tả Hero", type: "textarea" },
      { name: "eventDate", label: "Ngày cưới", type: "text" },
      { name: "venue", label: "Địa điểm", type: "text" },
      { name: "storyTitle", label: "Tiêu đề câu chuyện", type: "text" },
      { name: "storyBody", label: "Nội dung câu chuyện", type: "textarea" },
      { name: "gallery", label: "Gallery URLs", type: "textarea" },
    ],
    defaults: {
      heroTitle: "Huy & Trâm",
      heroSubtitle: "Một lời mời ấm áp dành cho người thân yêu trong ngày cưới của chúng tôi.",
      eventDate: "20.01.2027",
      venue: "Garden Hall, Đà Lạt",
      storyTitle: "Hành trình yêu thương",
      storyBody: "Chúng mình mong được chia sẻ niềm vui này với tất cả bạn bè và người thân.",
      gallery: [],
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
  return WEDDING_TEMPLATES[templateKey]?.defaults ?? {};
}

export function getWeddingTemplateFields(templateKey: string): FieldSchema[] {
  return WEDDING_TEMPLATES[templateKey]?.fields ?? [];
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
