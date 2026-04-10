import { AUTH_PAGE_FIELDS } from "@/features/auth/fields";
import { listContentPageSlugs } from "@/features/pages/registry";

type AuthPageConfig = {
  name: string;
  label: string;
  fields: typeof AUTH_PAGE_FIELDS;
};

export const AUTH_PAGES: Record<string, AuthPageConfig> = {
  login: {
    name: "Customer Login",
    label: "Trang đăng nhập hệ thống",
    fields: AUTH_PAGE_FIELDS,
  },
  register: {
    name: "Customer Register",
    label: "Trang đăng ký hệ thống",
    fields: AUTH_PAGE_FIELDS,
  },
};

export function isAuthPageSlug(slug: string): boolean {
  return slug in AUTH_PAGES;
}

export function getAuthPageFields(slug: string): AuthPageConfig["fields"] {
  return AUTH_PAGES[slug]?.fields ?? [];
}

export function isManagedSitePageSlug(slug: string): boolean {
  return isAuthPageSlug(slug) || listContentPageSlugs().includes(slug);
}
