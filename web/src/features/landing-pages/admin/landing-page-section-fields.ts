import type { FieldSchema } from "@/features/pages/schema";
import type { LandingPageSectionType } from "@/features/landing-pages/types";

const listField = (name: string, label: string, addLabel: string): FieldSchema => ({
  name,
  label,
  type: "repeater",
  addLabel,
  width: 12,
  fields: [
    { name: "value", label, type: "text", width: 12 },
  ],
});

const SECTION_FIELDS: Record<LandingPageSectionType, FieldSchema[]> = {
  hero: [
    { name: "eyebrow", label: "Nhãn nhỏ", type: "text", width: 6 },
    { name: "headline", label: "Tiêu đề chính", type: "text", width: 6 },
    { name: "subheadline", label: "Mô tả", type: "textarea", rows: 4, width: 12 },
    { name: "primaryCta", label: "Nhãn nút chính", type: "text", width: 6 },
  ],
  gallery: [
    { name: "title", label: "Tiêu đề", type: "text", width: 6 },
    { name: "layout", label: "Kiểu hiển thị", type: "text", width: 3 },
    { name: "imageRatio", label: "Tỷ lệ ảnh", type: "text", width: 3 },
    { name: "images", label: "Hình ảnh", type: "media", multiple: true, width: 12 },
    listField("captions", "Chú thích", "Thêm chú thích"),
  ],
  video: [
    { name: "title", label: "Tiêu đề", type: "text", width: 6 },
    { name: "provider", label: "Nền tảng", type: "text", width: 3 },
    { name: "autoplay", label: "Tự động phát", type: "switch", width: 3 },
    { name: "hook", label: "Thông điệp mở đầu", type: "textarea", rows: 3, width: 12 },
    { name: "videoUrl", label: "Video", type: "media", width: 12 },
  ],
  reviews: [
    { name: "title", label: "Tiêu đề", type: "text", width: 8 },
    { name: "style", label: "Kiểu hiển thị", type: "text", width: 4 },
    listField("quotes", "Nội dung đánh giá", "Thêm đánh giá"),
    listField("metrics", "Chỉ số social proof", "Thêm chỉ số"),
  ],
  faq: [
    { name: "title", label: "Tiêu đề", type: "text", width: 12 },
    listField("questions", "Câu hỏi", "Thêm câu hỏi"),
  ],
  countdown: [
    { name: "title", label: "Tiêu đề", type: "text", width: 6 },
    { name: "mode", label: "Chế độ", type: "text", width: 3 },
    { name: "durationMinutes", label: "Số phút", type: "text", width: 3 },
  ],
  cta: [
    { name: "headline", label: "Tiêu đề kêu gọi", type: "textarea", rows: 3, width: 8 },
    { name: "buttonLabel", label: "Nhãn nút", type: "text", width: 4 },
  ],
  pricing: [
    { name: "layout", label: "Kiểu hiển thị", type: "text", width: 6 },
    { name: "buttonLabel", label: "Nhãn nút", type: "text", width: 6 },
    { name: "highlightDiscount", label: "Nhấn mạnh giảm giá", type: "switch", width: 6 },
    { name: "showInstallments", label: "Hiện trả góp", type: "switch", width: 6 },
  ],
  features: [
    { name: "title", label: "Tiêu đề", type: "text", width: 12 },
    listField("items", "Điểm nổi bật", "Thêm điểm nổi bật"),
  ],
  related_products: [
    { name: "title", label: "Tiêu đề", type: "text", width: 8 },
    { name: "source", label: "Nguồn sản phẩm", type: "text", width: 4 },
  ],
  custom: [
    { name: "title", label: "Tiêu đề", type: "text", width: 12 },
    { name: "body", label: "Nội dung", type: "wysiwyg", width: 12 },
    { name: "image", label: "Hình ảnh", type: "media", width: 12 },
  ],
};

const STRING_LIST_FIELDS = new Set(["captions", "items", "quotes", "metrics", "questions"]);
const NUMBER_FIELDS = new Set(["durationMinutes"]);

export function getLandingPageSectionFields(sectionType: LandingPageSectionType) {
  return SECTION_FIELDS[sectionType];
}

export function toSectionEditorValues(content: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(content).map(([key, value]) => [
      key,
      STRING_LIST_FIELDS.has(key) && Array.isArray(value)
        ? value.map((item) => ({ value: String(item) }))
        : value,
    ])
  );
}

export function fromSectionEditorValues(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (STRING_LIST_FIELDS.has(key) && Array.isArray(value)) {
        return [
          key,
          value
            .map((item) => {
              if (item && typeof item === "object" && "value" in item) {
                return String((item as { value: unknown }).value ?? "").trim();
              }
              return String(item ?? "").trim();
            })
            .filter(Boolean),
        ];
      }

      if (NUMBER_FIELDS.has(key) && typeof value === "string") {
        const numberValue = Number(value);
        return [key, Number.isFinite(numberValue) ? numberValue : 0];
      }

      return [key, value];
    })
  );
}
