import { getAuthPageFields, isAuthPageSlug } from "@/features/auth/page-registry";
import {
  getContentPageFields,
  isContentPageSlug,
  listContentPageSlugs,
} from "@/features/pages/registry";

export { getAuthPageFields, getContentPageFields, isAuthPageSlug, isContentPageSlug, listContentPageSlugs };

export function isManagedSitePageSlug(slug: string): boolean {
  return isAuthPageSlug(slug) || isContentPageSlug(slug);
}

export function getManagedPageFields(slug: string) {
  return isAuthPageSlug(slug) ? getAuthPageFields(slug) : getContentPageFields(slug);
}
