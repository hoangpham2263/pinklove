import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { getAdminPathPermission } from "@/features/access/config/permissions";
import { getAdminAccessContext } from "@/features/access/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const CONFIG_SECTIONS = [
  {
    title: "Branding & Appearance",
    icon: "settings" as const,
    items: [
      {
        title: "Branding",
        description: "Manage the site name, logo, and identity icons shown across the website.",
        href: ROUTES.ADMIN.CONFIG_BRANDING,
      },
      {
        title: "Notifications",
        description: "Manage site-wide notifications shared across the user experience.",
        href: ROUTES.ADMIN.NOTIFICATIONS,
      },
    ],
  },
  {
    title: "Communication & Sign-in",
    icon: "globe" as const,
    items: [
      {
        title: "Email",
        description: "Configure sender details, SMTP transport, and demo email cards for system-wide email.",
        href: ROUTES.ADMIN.CONFIG_EMAIL,
      },
      {
        title: "Third-party Sign-in",
        description: "Configure OAuth and external sign-in providers such as Google.",
        href: ROUTES.ADMIN.CONFIG_THIRD_PARTY,
      },
    ],
  },
  {
    title: "SEO & Indexing",
    icon: "link" as const,
    items: [
      {
        title: "Breadcrumbs",
        description: "Configure breadcrumb UI and breadcrumb schema across the website.",
        href: ROUTES.ADMIN.CONFIG_BREADCRUMBS,
      },
      {
        title: "Open Graph",
        description: "Manage social preview metadata and default images for shared links.",
        href: ROUTES.ADMIN.CONFIG_OPENGRAPH,
      },
      {
        title: "Sitemap Index",
        description: "View the live sitemap.xml, child sitemaps, and the number of exported URLs.",
        href: ROUTES.ADMIN.CONFIG_SITEMAP_INDEX,
      },
      {
        title: "Sitemap Settings",
        description: "Configure sitemap groups, robots.txt, and website indexing rules.",
        href: ROUTES.ADMIN.CONFIG_SITEMAP_SETTINGS,
      },
      {
        title: "SEO Redirects",
        description: "Manage intentional SEO redirects independently from source-code routes and slugs.",
        href: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS,
      },
    ],
  },
  {
    title: "SEO Documentation",
    icon: "docs" as const,
    items: [
      {
        title: "Page SEO",
        description: "Guidance for entering titles, descriptions, canonicals, OG images, and metadata for each page.",
        href: ROUTES.ADMIN.SEO_PAGES,
      },
      {
        title: "SEO Schema",
        description: "Documentation for structured data, breadcrumb schema, and page-type data mapping.",
        href: ROUTES.ADMIN.SEO_SCHEMA,
      },
      {
        title: "SEO Rules",
        description: "SEO content operating rules that reduce intent overlap and keep indexing stable.",
        href: ROUTES.ADMIN.SEO_RULES,
      },
    ],
  },
  {
    title: "Sales & Payments",
    icon: "settings" as const,
    items: [
      {
        title: "Ecommerce",
        description: "Configure checkout, currency, and shared shipping behavior for orders.",
        href: ROUTES.ADMIN.CONFIG_ECOMMERCE,
      },
      {
        title: "Shipping",
        description: "Connect shipping providers, configure shipping fees, and map pickup addresses.",
        href: ROUTES.ADMIN.CONFIG_SHIPPING,
      },
      {
        title: "Payment Methods",
        description: "Manage payment methods, providers, instructions, and receiving account details.",
        href: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
      },
    ],
  },
  {
    title: "Catalog & discovery",
    icon: "docs" as const,
    items: [
      {
        title: "Search Documents",
        description: "Inspect generated search-index documents for offerings when debugging search.",
        href: ROUTES.ADMIN.CONFIG_SEARCH_DOCUMENTS,
      },
      {
        title: "Template Attributes",
        description: "Inspect attributes used for template and offering discovery/SEO.",
        href: ROUTES.ADMIN.CONFIG_TEMPLATE_ATTRIBUTES,
      },
    ],
  },
  {
    title: "Integrations & Operations",
    icon: "globe" as const,
    items: [
      {
        title: "Internal APIs",
        description: "Manage internal APIs used for imports, synchronization, and extended system data integrations.",
        href: ROUTES.ADMIN.CONFIG_INTERNAL_APIS,
      },
      {
        title: "Hooks",
        description: "Review all available website hook points for external synchronization and integrations.",
        href: ROUTES.ADMIN.HOOKS,
      },
      {
        title: "Security Management",
        description: "Manage rate limits, logs, blocked IPs, upload rules, endpoint protection, and backups.",
        href: ROUTES.ADMIN.SECURITY,
      },
    ],
  },
] as const;

function pathForPermission(href: string) {
  return href.split("#")[0]?.split("?")[0] || href;
}

function sectionsWithPermissions(sections: typeof CONFIG_SECTIONS) {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      permission: getAdminPathPermission(pathForPermission(item.href)),
    })),
  }));
}

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const access = await getAdminAccessContext(user.id);
  const permissionKeys = access?.isSuperAdmin ? undefined : access?.permissionKeys ?? [];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <ConfigSectionsHub
        sections={sectionsWithPermissions(CONFIG_SECTIONS)}
        permissionKeys={permissionKeys}
        scopeLabel="Configuration center for site settings and security management."
      />
    </section>
  );
}
