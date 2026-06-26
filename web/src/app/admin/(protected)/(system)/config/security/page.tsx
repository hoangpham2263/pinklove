import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAdminAccessContext } from "@/features/access/server/service";
import { ADMIN_NAV_ICON_MAP } from "@/features/admin/config/navigation-icons";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const SECURITY_ITEMS = [
  {
    key: "auth-rate-limits",
    title: "Auth Rate Limits",
    description: "Configure login thresholds, view limit records, unlock users, and manage cleanup.",
    href: ROUTES.ADMIN.SECURITY_SETTINGS_AUTH_RATE_LIMITS,
    iconName: "radio",
    permission: "security.view",
  },
  {
    key: "csrf-protection",
    title: "CSRF Protection",
    description: "Review auth CSRF status and production enforcement for sensitive forms.",
    href: ROUTES.ADMIN.SECURITY_SETTINGS_CSRF,
    iconName: "settings",
    permission: "security.view",
  },
  {
    key: "security-headers",
    title: "Security Headers",
    description: "Configure CSP, HSTS, frame protection, nosniff, referrer, and permissions headers.",
    href: ROUTES.ADMIN.SECURITY_SETTINGS_HEADERS,
    iconName: "settings",
    permission: "security.view",
  },
  {
    key: "proxy-ip-detection",
    title: "Proxy / IP Detection",
    description: "Review trusted IP headers and configure suspicious IP detection rules.",
    href: ROUTES.ADMIN.SECURITY_SETTINGS_PROXY,
    iconName: "settings",
    permission: "security.view",
  },
  {
    key: "security-logs",
    title: "Security Logs",
    description: "Investigate login failures, rate-limit hits, CSRF failures, and suspicious traffic.",
    href: ROUTES.ADMIN.SECURITY_LOGS,
    iconName: "radio",
    permission: "security.logs.view",
  },
  {
    key: "blocked-ips",
    title: "Blocked IPs",
    description: "Block, unblock, import, and extend temporary IP/subnet blocks.",
    href: ROUTES.ADMIN.SECURITY_BLOCKED_IPS,
    iconName: "radio",
    permission: "security.ip_blocks.manage",
  },
  {
    key: "security-audit-logs",
    title: "Security Audit Logs",
    description: "Review append-only audit history for security-sensitive admin actions.",
    href: ROUTES.ADMIN.SECURITY_AUDIT_LOGS,
    iconName: "radio",
    permission: "security.logs.view",
  },
  {
    key: "upload-security",
    title: "Upload Security",
    description: "Manage centralized file, media, and avatar upload safety rules.",
    href: ROUTES.ADMIN.SECURITY_UPLOAD,
    iconName: "image",
    permission: "security.view",
  },
  {
    key: "endpoint-protection",
    title: "Endpoint Protection",
    description: "Manage heavy endpoint protection, cache behavior, rate limits, and false-positive controls.",
    href: ROUTES.ADMIN.SECURITY_ENDPOINT_PROTECTION,
    iconName: "settings",
    permission: "security.view",
  },
  {
    key: "backup-security",
    title: "Backup/Restore Security",
    description: "Monitor backup packages, retention, encryption, checksums, and safe restore checks.",
    href: ROUTES.ADMIN.SECURITY_BACKUPS,
    iconName: "package",
    permission: "security.backups.view",
  },
] as const;

function canAccess(permission: string, permissionKeys?: string[]) {
  return !permissionKeys || permissionKeys.includes(permission);
}

export default async function AdminSecurityPage() {
  const user = await requireAdmin();
  const access = await getAdminAccessContext(user.id);
  const permissionKeys = access?.isSuperAdmin ? undefined : access?.permissionKeys ?? [];
  const visibleItems = SECURITY_ITEMS.filter((item) => canAccess(item.permission, permissionKeys));

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Security Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage security settings, logs, blocked IPs, upload rules, endpoint protection, and backup safety.
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
