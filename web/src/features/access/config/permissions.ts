import { ROUTES } from "@/lib/routes";

type PermissionRule = {
  prefixes: string[];
  permission: string;
};

const rules: PermissionRule[] = [
  { prefixes: ["/api/admin/access", "/api/admin/users", "/api/admin/providers/accounts"], permission: "accounts.manage" },
  { prefixes: ["/accounts", "/providers/accounts", "/access", "/users", "/customers", "/internal-accounts", "/api/admin/users", "/api/admin/internal-accounts"], permission: "accounts.view" },
  { prefixes: ["/content"], permission: "content.view" },
  { prefixes: ["/offerings", "/api/admin/offerings"], permission: "offerings.view" },
  { prefixes: ["/providers", "/api/admin/providers"], permission: "marketplace.view" },
  { prefixes: ["/booking", "/bookings", "/api/admin/bookings"], permission: "bookings.view" },
  { prefixes: ["/marketing", "/landing-pages", "/api/admin/marketing", "/api/admin/landing-pages"], permission: "marketing.view" },
  { prefixes: ["/wedding-planning"], permission: "planning.view" },
  { prefixes: ["/commerce", "/orders", "/payments", "/shipments", "/api/admin/orders", "/api/admin/payments", "/api/admin/shipments"], permission: "commerce.view" },
  { prefixes: ["/pages", "/menus", "/blog", "/api/admin/pages", "/api/admin/menus", "/api/admin/blog"], permission: "content.view" },
  { prefixes: ["/affiliates", "/api/admin/affiliates"], permission: "affiliates.view" },
  { prefixes: ["/messages"], permission: "messages.view" },
  { prefixes: ["/comments", "/api/admin/comments"], permission: "comments.view" },
  { prefixes: ["/communication"], permission: "dashboard.view" },
  { prefixes: ["/analytics"], permission: "analytics.view" },
  { prefixes: [ROUTES.API.ADMIN.SECURITY.EVENTS_EXPORT, ROUTES.API.ADMIN.SECURITY.AUDIT_LOGS_EXPORT], permission: "security.logs.export" },
  { prefixes: [ROUTES.ADMIN.SECURITY_LOGS, ROUTES.API.ADMIN.SECURITY.EVENTS_EXPORT.replace(/\/export$/, "")], permission: "security.logs.view" },
  { prefixes: [ROUTES.ADMIN.SECURITY_AUDIT_LOGS, ROUTES.API.ADMIN.SECURITY.AUDIT_LOGS_EXPORT.replace(/\/export$/, "")], permission: "security.logs.view" },
  { prefixes: [ROUTES.ADMIN.SECURITY_BLOCKED_IPS, ROUTES.API.ADMIN.SECURITY.BLOCKED_IPS_ACTION.replace(/\/action$/, "")], permission: "security.ip_blocks.manage" },
  { prefixes: [ROUTES.API.ADMIN.SECURITY.AUTH_RATE_LIMIT_ACTION.replace(/\/action$/, "")], permission: "security.rate_limits.manage" },
  { prefixes: [ROUTES.ADMIN.SECURITY_BACKUPS, ROUTES.API.ADMIN.SECURITY.BACKUPS_CREATE.replace(/\/create$/, "")], permission: "security.backups.view" },
  { prefixes: [ROUTES.ADMIN.SECURITY], permission: "security.view" },
  { prefixes: [ROUTES.ADMIN.CONFIG, ROUTES.API.ADMIN.CONFIG.UPDATE.replace(/\/update$/, "")], permission: "configuration.view" },
  { prefixes: ["/audit-logs", "/global-fields", "/media", "/domain-events", "/notifications", "/api/admin/media", "/api/admin/global-fields", "/api/admin/notifications"], permission: "system.view" },
  { prefixes: ["/api/admin/realtime"], permission: "marketplace.view" },
];

export function getAdminPathPermission(pathname: string) {
  const rule = rules.find((candidate) => candidate.prefixes.some((prefix) => pathname.startsWith(prefix)));
  return rule?.permission ?? "dashboard.view";
}
