import type { ComponentType } from "react";
import type { CmsPage } from "@/lib/cms";

export type TemplateField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "media";
};

export type TemplateRenderer = ComponentType<{ page: CmsPage }>;

export type PageTemplateDefinition = {
  label: string;
  fields: TemplateField[];
  component: TemplateRenderer;
};
