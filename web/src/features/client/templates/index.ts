import { CmsPage } from "@/lib/cms";
import { DefaultTemplate } from "./DefaultTemplate";
import { ContactTemplate } from "./ContactTemplate";
import { HomeTemplate } from "./HomeTemplate";
import { AboutTemplate } from "./AboutTemplate";

// We don't render Login/Register inside PageRenderer yet, but they act as templates for CMS Custom Fields.
const DummyTemplate = () => null;

export type TemplateField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "media";
  defaultValue?: string;
};

export type TemplateConfig = {
  label: string;
  component: React.ComponentType<{ page: CmsPage }>;
  fields?: TemplateField[];
};

/**
 * Registry chứa tất cả các template cho trang CMS.
 * Để thêm template mới:
 * 1. Tạo component trong folder này.
 * 2. Khai báo nó vào object CMS_TEMPLATES dưới đây.
 */
export const CMS_TEMPLATES: Record<string, TemplateConfig> = {
  default: { label: "Default (Auto-select by slug)", component: DefaultTemplate },
  home: { 
    label: "Home Page", 
    component: HomeTemplate,
    fields: [
      { name: "heroTitle", label: "Hero Title (Overwrites Title)", type: "text" },
      { name: "heroDescription", label: "Hero Description (Overwrites Excerpt)", type: "textarea" },
      { name: "heroButtonText", label: "Primary Button Text", type: "text" },
      { name: "heroButtonLink", label: "Primary Button Link", type: "text" },
      { name: "secondaryButtonText", label: "Secondary Button Text", type: "text" },
      { name: "secondaryButtonLink", label: "Secondary Button Link", type: "text" },
    ]
  },
  about: { 
    label: "About Us", 
    component: AboutTemplate,
    fields: [
      { name: "bannerImage", label: "Top Banner Image", type: "media" },
      { name: "introHeading", label: "Intro Heading", type: "text" },
      { name: "introText", label: "Intro Text", type: "textarea" },
    ]
  },
  contact: { 
    label: "Contact Us", 
    component: ContactTemplate,
    fields: [
      { name: "contactEmail", label: "Public Contact Email", type: "text" },
      { name: "contactPhone", label: "Public Contact Phone", type: "text" },
      { name: "contactAddress", label: "Office Address", type: "textarea" },
      { name: "googleMapsEmbed", label: "Google Maps Embed URL", type: "textarea" },
    ]
  },
  login: {
    label: "User Login",
    component: DummyTemplate, // Custom rendered in /user/login/page.tsx
    fields: [
      { name: "heading", label: "Heading (e.g. Welcome Back)", type: "text" },
      { name: "subheading", label: "Subheading", type: "text" },
      { name: "sideImage", label: "Side Image", type: "media" },
      { name: "quote", label: "Quote Text", type: "textarea" },
      { name: "quoteAuthor", label: "Quote Author", type: "text" },
    ],
  },
  register: {
    label: "User Register",
    component: DummyTemplate, // Custom rendered in /user/register/page.tsx
    fields: [
      { name: "heading", label: "Heading (e.g. Create an account)", type: "text" },
      { name: "subheading", label: "Subheading", type: "text" },
      { name: "sideImage", label: "Side Image", type: "media" },
      { name: "quote", label: "Quote Text", type: "textarea" },
      { name: "quoteAuthor", label: "Quote Author", type: "text" },
    ],
  },
};

export type TemplateKey = keyof typeof CMS_TEMPLATES;

/**
 * Danh sách các trang hệ thống. Các trang này luôn tồn tại và không thể xoá.
 */
export const SYSTEM_PAGES: Record<string, { name: string; template: string }> = {
  home: { name: "Home Page", template: "home" },
  login: { name: "User Login", template: "login" },
  register: { name: "User Register", template: "register" },
};