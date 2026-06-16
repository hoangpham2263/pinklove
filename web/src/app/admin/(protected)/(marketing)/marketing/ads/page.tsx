import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Image, PanelsTopLeft, Store } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const ADS_FEATURES = [
  {
    key: "advertisers",
    title: "Advertisers",
    description: "Hồ sơ bên ngoài thuê đặt quảng cáo.",
    href: ROUTES.ADMIN.MARKETING_ADVERTISERS,
    icon: BriefcaseBusiness,
  },
  {
    key: "placements",
    title: "Placements",
    description: "Vị trí render banner và priority listing.",
    href: ROUTES.ADMIN.MARKETING_AD_PLACEMENTS,
    icon: PanelsTopLeft,
  },
  {
    key: "banner-ads",
    title: "Banner Ads",
    description: "Quản lý campaign/banner thuê ngoài.",
    href: ROUTES.ADMIN.MARKETING_BANNER_ADS,
    icon: Image,
  },
  {
    key: "creatives",
    title: "Creatives",
    description: "Quản lý hình ảnh, CTA và link đích.",
    href: ROUTES.ADMIN.MARKETING_AD_CREATIVES,
    icon: Image,
  },
  {
    key: "provider-priority",
    title: "Sponsored Providers",
    description: "Ưu tiên hiển thị provider/xưởng top.",
    href: ROUTES.ADMIN.MARKETING_PROVIDER_PRIORITY,
    icon: Store,
  },
];

export default async function AdminAdsOverviewPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-8 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Ads</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý banner thuê ngoài, placement và ưu tiên hiển thị provider mà không trộn vào booking dịch vụ.
        </p>
      </div>

      <section id="ads" className="scroll-mt-20 space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ADS_FEATURES.map((entry) => {
            const Icon = entry.icon;

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
    </section>
  );
}
