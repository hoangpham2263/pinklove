import "server-only";

import { listAllLandingPages } from "@/features/landing-pages/server/service";
import { listManagedPages } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { ROUTES } from "@/lib/routes";

export type TargetUrlOption = {
  label: string;
  href: string;
};

const STATIC_TARGET_URLS: TargetUrlOption[] = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Templates", href: ROUTES.TEMPLATES },
  { label: "Paper products", href: ROUTES.PAPER },
  { label: "Services", href: ROUTES.SERVICES },
  { label: "Tools", href: ROUTES.TOOLS },
  { label: "Blog", href: ROUTES.BLOG },
  { label: "Search", href: ROUTES.SEARCH },
  { label: "Wishlist", href: ROUTES.WISHLIST },
  { label: "Contact", href: ROUTES.CONTACT },
  { label: "About", href: ROUTES.ABOUT },
];

export async function getTargetUrlOptions(): Promise<TargetUrlOption[]> {
  const [managedPages, landingPages] = await Promise.all([
    listManagedPages(),
    listAllLandingPages(),
  ]);

  const options = [
    ...STATIC_TARGET_URLS,
    ...managedPages.map((page) => ({
      label: `Page: ${page.name || page.title || page.slug}`,
      href: getManagedPagePath(page),
    })),
    ...landingPages.map((page) => ({
      label: `Landing: ${page.name}`,
      href: ROUTES.LANDING_PAGE(page.slug),
    })),
  ];

  const seen = new Set<string>();
  return options.filter((option) => {
    if (!option.href || seen.has(option.href)) return false;
    seen.add(option.href);
    return true;
  });
}
