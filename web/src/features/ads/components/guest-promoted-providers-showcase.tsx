"use client";

import Link from "next/link";
import { BadgePercent, Sparkles, Star } from "lucide-react";

import { PagedCarousel } from "@/components/common/paged-carousel";
import { GuestMarketingSoftGlow } from "@/app/user-site/_components/guest-marketing-background";
import { AdEventTracker } from "@/features/ads/components/ad-event-tracker";
import { ROUTES } from "@/lib/routes";

type PromotedProviderItem = {
  id: string;
  providerId: string;
  provider: string;
  title: string;
  plan: string;
  priorityWeight: string;
};

type GuestPromotedProvidersShowcaseProps = {
  promotions: PromotedProviderItem[];
};

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function GuestPromotedProvidersShowcase({ promotions }: GuestPromotedProvidersShowcaseProps) {
  if (!promotions.length) {
    return null;
  }

  return (
    <div className="container mx-auto px-4">
      <div className="relative overflow-hidden rounded-[30px] border border-[#ffd1f7] bg-white/92 p-5 shadow-[0_24px_70px_rgba(217,77,206,0.12)] lg:p-7">
        <GuestMarketingSoftGlow />

        <PagedCarousel
          items={promotions}
          itemsPerPage={6}
          header={(
            <>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#b529aa]">
                <Sparkles className="h-3.5 w-3.5" />
                Provider ưu tiên
              </p>
              <h2 className="mt-2 max-w-3xl text-2xl font-semibold text-stone-950 lg:text-4xl">
                Mỗi lượt hiển thị 6 đối tác nổi bật
              </h2>
              <Link href={ROUTES.CONTACT} className="mt-3 inline-flex text-sm font-semibold text-[#b529aa] underline-offset-4 hover:underline sm:hidden">
                Yêu cầu tư vấn
              </Link>
            </>
          )}
          actions={(
            <Link href={ROUTES.CONTACT} className="mr-2 hidden text-sm font-semibold text-[#b529aa] underline-offset-4 hover:underline sm:inline-flex">
              Yêu cầu tư vấn
            </Link>
          )}
          renderItem={(promotion, _index, absoluteIndex) => (
            <AdEventTracker
              key={promotion.id}
              impression={{ kind: "provider-promotion", id: promotion.id, providerId: promotion.providerId, targetType: "provider", targetId: promotion.providerId }}
              click={{ kind: "provider-promotion", id: promotion.id, providerId: promotion.providerId, targetType: "provider", targetId: promotion.providerId }}
            >
              <article
                className="group min-h-44 rounded-[24px] border border-[#f8d8f4] bg-white p-5 shadow-[0_14px_34px_rgba(35,31,39,0.07)] transition hover:-translate-y-1 hover:border-[#ff6ff5] hover:shadow-[0_22px_48px_rgba(217,77,206,0.16)]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(35,31,39,0.16)]">
                    {getInitials(promotion.provider || promotion.title)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff5fd] px-3 py-1 text-xs font-semibold text-[#b529aa]">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    #{absoluteIndex + 1}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-lg font-semibold text-stone-950">{promotion.provider || promotion.title}</h3>
                {promotion.title && promotion.title !== promotion.provider ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{promotion.title}</p>
                ) : null}
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4 text-xs font-medium text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgePercent className="h-3.5 w-3.5 text-[#b529aa]" />
                    {promotion.plan || "Featured"}
                  </span>
                  <span>W {promotion.priorityWeight}</span>
                </div>
              </article>
            </AdEventTracker>
          )}
        />
      </div>
    </div>
  );
}
