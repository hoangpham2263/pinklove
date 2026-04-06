import { AUTH_PAGE_FIELDS } from "@/features/auth/fields";
import { getPageTemplateFields } from "@/features/pages/registry";
import type { SystemPageConfig } from "./types";

export const SYSTEM_PAGES: Record<string, SystemPageConfig> = {
  home: {
    name: "Home Page",
    template: "home",
    label: "Trang chủ hệ thống",
    fields: getPageTemplateFields("home"),
  },
  login: {
    name: "User Login",
    template: "login",
    label: "Trang đăng nhập hệ thống",
    fields: AUTH_PAGE_FIELDS,
  },
  register: {
    name: "User Register",
    template: "register",
    label: "Trang đăng ký hệ thống",
    fields: AUTH_PAGE_FIELDS,
  },
};

export function isSystemPageSlug(slug: string): boolean {
  return slug in SYSTEM_PAGES;
}

export function getSystemPageFields(slug: string): SystemPageConfig["fields"] {
  return SYSTEM_PAGES[slug]?.fields ?? [];
}
