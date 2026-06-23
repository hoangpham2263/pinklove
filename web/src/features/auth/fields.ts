import type { FieldSchema } from "@/features/pages/schema";

export type AuthPageFields = {
  heading?: string;
  subheading?: string;
  sideImage?: unknown;
};

export const AUTH_PAGE_FIELDS: FieldSchema[] = [
  { name: "heading", label: "Tiêu đề chính", type: "text" },
  { name: "subheading", label: "Tiêu đề phụ", type: "text" },
  { name: "sideImage", label: "Logo trang xác thực", type: "media" },
];
