import type { TemplateField } from "@/features/pages/types";

export type AuthPageFields = {
  heading?: string;
  subheading?: string;
  sideImage?: unknown;
};

export const AUTH_PAGE_FIELDS: TemplateField[] = [
  { name: "heading", label: "Tiêu đề chính", type: "text" },
  { name: "subheading", label: "Tiêu đề phụ", type: "text" },
  { name: "sideImage", label: "Ảnh bên cạnh", type: "media" },
];
