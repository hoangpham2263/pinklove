import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PROVIDER_NAV_ICON_MAP } from "@/features/provider-orders/config/navigation-icons";
import { getProviderNavGroup } from "@/features/provider-orders/config/navigation";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type ProviderFeatureOverviewProps = {
  groupKey: string;
};

export async function ProviderFeatureOverview({ groupKey }: ProviderFeatureOverviewProps) {
  await requireProvider(ROUTES.PROVIDER.LOGIN);
  const group = getProviderNavGroup(groupKey);

  if (!group) {
    throw new Error(`Unknown Provider group: ${groupKey}`);
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{group.label}</h1>
        <p className="text-sm text-muted-foreground">{group.description}</p>
      </div>

      <section id={group.key} className="scroll-mt-20 space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {group.children.map((entry) => {
            const Icon = PROVIDER_NAV_ICON_MAP[entry.iconName];

            return (
              <Link
                key={entry.key}
                href={entry.href}
                className="group flex min-w-0 items-start gap-3 rounded-lg border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-medium">{entry.label}</span>
                  <span className="block text-sm text-muted-foreground">{entry.description}</span>
                </span>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </section>
    </section>
  );
}
