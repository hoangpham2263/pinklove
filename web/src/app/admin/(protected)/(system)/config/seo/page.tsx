import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAdminAccessContext } from "@/features/access/server/service";
import { ADMIN_NAV_ICON_MAP } from "@/features/admin/config/navigation-icons";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const SEO_ITEMS = [
  {
    key: "page-seo",
    title: "Page SEO",
    description: "Manage titles, descriptions, canonical URLs, OG images, and metadata for each page.",
    href: ROUTES.ADMIN.SEO_PAGES,
    iconName: "search",
    permission: "content.view",
  },
  {
    key: "seo-schema",
    title: "SEO Schema",
    description: "Manage structured data, breadcrumb schema, and page-type data mapping.",
    href: ROUTES.ADMIN.SEO_SCHEMA,
    iconName: "file-code-2",
    permission: "content.view",
  },
  {
    key: "seo-rules",
    title: "SEO Rules",
    description: "Manage SEO operating rules, indexing policy, and content governance.",
    href: ROUTES.ADMIN.SEO_RULES,
    iconName: "search",
    permission: "content.view",
  },
  {
    key: "breadcrumbs",
    title: "Breadcrumbs",
    description: "Configure breadcrumb UI and breadcrumb schema across the website.",
    href: ROUTES.ADMIN.CONFIG_BREADCRUMBS,
    iconName: "list-tree",
    permission: "configuration.view",
  },
  {
    key: "open-graph",
    title: "Open Graph",
    description: "Manage social preview metadata and default images for shared links.",
    href: ROUTES.ADMIN.CONFIG_OPENGRAPH,
    iconName: "image",
    permission: "configuration.view",
  },
  {
    key: "sitemap",
    title: "Sitemap Index",
    description: "View live sitemap.xml, child sitemaps, and exported URL counts.",
    href: ROUTES.ADMIN.CONFIG_SITEMAP_INDEX,
    iconName: "file-code-2",
    permission: "configuration.view",
  },
  {
    key: "sitemap-settings",
    title: "Sitemap Settings",
    description: "Configure sitemap groups, robots.txt, and website indexing rules.",
    href: ROUTES.ADMIN.CONFIG_SITEMAP_SETTINGS,
    iconName: "settings",
    permission: "configuration.view",
  },
  {
    key: "seo-redirects",
    title: "SEO Redirects",
    description: "Manage intentional SEO redirects independently from source-code routes and slugs.",
    href: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS,
    iconName: "radio",
    permission: "configuration.view",
  },
] as const;

function canAccess(permission: string, permissionKeys?: string[]) {
  return !permissionKeys || permissionKeys.includes(permission);
}

export default async function AdminSeoConfigPage() {
  const user = await requireAdmin();
  const access = await getAdminAccessContext(user.id);
  const permissionKeys = access?.isSuperAdmin ? undefined : access?.permissionKeys ?? [];
  const visibleItems = SEO_ITEMS.filter((item) => canAccess(item.permission, permissionKeys));

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">SEO Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage page metadata, schema, breadcrumbs, Open Graph, sitemaps, robots, and SEO redirects from one place.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((entry) => {
          const Icon = ADMIN_NAV_ICON_MAP[entry.iconName];
          return (
            <Link
              key={entry.key}
              href={entry.href}
              className="group flex min-w-0 items-start gap-3 rounded-lg border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-medium">{entry.title}</span>
                <span className="block text-sm text-muted-foreground">{entry.description}</span>
              </span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
