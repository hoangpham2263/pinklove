import type { TemplateField } from "@/features/pages/types";

export type SystemPageConfig = {
  name: string;
  template: string;
  label: string;
  fields: TemplateField[];
};
