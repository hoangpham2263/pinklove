import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAdminAccessContext } from "@/features/access/server/service";
import {
  canAccessAdminFeature,
  canAccessAdminFeatureItem,
  canAccessAdminFeatureSection,
  getAdminFeature,
} from "@/features/admin/config/navigation";
import { ADMIN_NAV_ICON_MAP } from "@/features/admin/config/navigation-icons";
import { requireAdmin } from "@/lib/auth";

type AdminFeatureOverviewProps = {
  featureKey: string;
};

export async function AdminFeatureOverview({ featureKey }: AdminFeatureOverviewProps) {
  const user = await requireAdmin();
  const access = await getAdminAccessContext(user.id);
  const permissionKeys = access?.isSuperAdmin ? undefined : access?.permissionKeys ?? [];
  const feature = getAdminFeature(featureKey);

  if (!feature) {
    throw new Error(`Unknown Admin feature: ${featureKey}`);
  }

  if (!canAccessAdminFeature(feature, permissionKeys)) {
    return null;
  }

  const visibleSections = feature.sections
    .filter((section) => canAccessAdminFeatureSection(section, permissionKeys))
    .map((section) => ({
      ...section,
      items: section.items.filter((entry) => canAccessAdminFeatureItem(entry, permissionKeys)),
    }))
    .filter((section) => section.items.length > 0);

  const hideSingleSectionHeader = visibleSections.length === 1;

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{feature.label}</h1>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </div>

      {visibleSections.map((section) => (
        <section key={section.key} id={section.key} className="scroll-mt-20 space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
          {!hideSingleSectionHeader && !section.hideHeader ? (
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground" title={section.description}>
                {section.title}
              </h2>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((entry) => {
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
      ))}
    </section>
  );
}
