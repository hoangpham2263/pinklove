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
        title: "SEO Management",
        description: "Manage page metadata, schema, breadcrumbs, Open Graph, sitemaps, robots, and SEO redirects.",
        href: ROUTES.ADMIN.CONFIG_SEO,
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
        href: ROUTES.ADMIN.CONFIG_HOOKS,
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
        scopeLabel="Configuration center for site settings, SEO, and security management."
      />
    </section>
  );
}
