type PermissionRule = {
  prefixes: string[];
  permission: string;
};

const rules: PermissionRule[] = [
  { prefixes: ["/api/admin/access", "/api/admin/users"], permission: "accounts.manage" },
  { prefixes: ["/admin/access", "/admin/users", "/admin/customers", "/admin/internal-accounts", "/api/admin/users", "/api/admin/internal-accounts"], permission: "accounts.view" },
  { prefixes: ["/admin/offerings", "/api/admin/offerings"], permission: "offerings.view" },
  { prefixes: ["/admin/providers", "/api/admin/providers"], permission: "marketplace.view" },
  { prefixes: ["/admin/bookings", "/api/admin/bookings"], permission: "bookings.view" },
  { prefixes: ["/admin/marketing", "/admin/landing-pages", "/api/admin/marketing", "/api/admin/landing-pages"], permission: "marketing.view" },
  { prefixes: ["/admin/wedding-planning"], permission: "planning.view" },
  { prefixes: ["/admin/orders", "/admin/payments", "/admin/shipments", "/api/admin/orders", "/api/admin/payments", "/api/admin/shipments"], permission: "commerce.view" },
  { prefixes: ["/admin/pages", "/admin/menus", "/admin/blog", "/api/admin/pages", "/api/admin/menus", "/api/admin/blog"], permission: "content.view" },
  { prefixes: ["/admin/affiliates", "/api/admin/affiliates"], permission: "affiliates.view" },
  { prefixes: ["/admin/messages"], permission: "messages.view" },
  { prefixes: ["/admin/comments", "/api/admin/comments"], permission: "comments.view" },
  { prefixes: ["/admin/analytics"], permission: "analytics.view" },
  { prefixes: ["/admin/config", "/api/admin/config"], permission: "configuration.view" },
  { prefixes: ["/admin/audit-logs", "/admin/global-fields", "/admin/media", "/admin/domain-events", "/admin/notifications", "/admin/hooks", "/admin/seo", "/api/admin/media", "/api/admin/global-fields", "/api/admin/notifications"], permission: "system.view" },
  { prefixes: ["/api/admin/realtime"], permission: "marketplace.view" },
];

export function getAdminPathPermission(pathname: string) {
  const rule = rules.find((candidate) => candidate.prefixes.some((prefix) => pathname.startsWith(prefix)));
  return rule?.permission ?? "dashboard.view";
}
