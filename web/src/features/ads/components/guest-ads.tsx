import Link from "next/link";
import { BadgePercent, Megaphone } from "lucide-react";

import {
  listActiveAdsForPlacement,
  listActiveProviderPromotions,
} from "@/features/ads/server/service";
import { AdEventTracker } from "@/features/ads/components/ad-event-tracker";
import { GuestPromotedProvidersShowcase } from "@/features/ads/components/guest-promoted-providers-showcase";

type GuestAdBannerProps = {
  placementKey: string;
  className?: string;
};

type GuestPromotedProvidersProps = {
  placementKey: string;
  className?: string;
  limit?: number;
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GuestAdBanner({ placementKey, className }: GuestAdBannerProps) {
  const ads = await listActiveAdsForPlacement(placementKey);
  const ad = ads[0];

  if (!ad) {
    return null;
  }

  const imageUrl = getText(ad.image_url);
  const targetUrl = getText(ad.target_url) || "#";
  const headline = getText(ad.headline);
  const body = getText(ad.body);
  const ctaLabel = getText(ad.cta_label) || "Xem ngay";
  const altText = getText(ad.alt_text) || headline || "PinkLove banner";
  const campaignId = String(ad.id ?? "");

  return (
    <section className={className}>
      <div className="container mx-auto px-4">
        <AdEventTracker
          impression={{ kind: "ad", id: campaignId, targetType: "placement", targetId: placementKey }}
          click={{ kind: "ad", id: campaignId, targetType: "placement", targetId: placementKey }}
        >
          <Link
            href={targetUrl}
            className="group grid overflow-hidden rounded-[24px] border border-[#ffd1f7] bg-white shadow-[0_18px_48px_rgba(255,111,245,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(255,111,245,0.22)] lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="relative min-h-48 overflow-hidden bg-[#fff5fd]">
              {imageUrl ? (
                <img src={imageUrl} alt={altText} className="h-full min-h-48 w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-48 items-center justify-center text-[#d94dce]">
                  <Megaphone className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 lg:p-8">
              <div className="flex w-fit items-center gap-2 rounded-full border border-[#ffd1f7] bg-[#fff5fd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b529aa]">
                <BadgePercent className="h-3.5 w-3.5" />
                Sponsored
              </div>
              {headline ? <h2 className="text-2xl font-semibold text-stone-950 lg:text-3xl">{headline}</h2> : null}
              {body ? <p className="text-sm leading-6 text-stone-700 lg:text-base">{body}</p> : null}
              <span className="inline-flex w-fit items-center rounded-full bg-[#FF6FF5] px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[#d94dce]">
                {ctaLabel}
              </span>
            </div>
          </Link>
        </AdEventTracker>
      </div>
    </section>
  );
}

export async function GuestPromotedProviders({ placementKey, className, limit = 6 }: GuestPromotedProvidersProps) {
  const promotions = await listActiveProviderPromotions({ placementKey, limit });

  if (!promotions.length) {
    return null;
  }

  return (
    <section className={className}>
      <GuestPromotedProvidersShowcase
        promotions={promotions.map((promotion) => ({
          id: String(promotion.id),
          providerId: String(promotion.provider_id ?? ""),
          provider: getText(promotion.provider),
          title: getText(promotion.title),
          plan: getText(promotion.plan),
          priorityWeight: String(promotion.priority_weight ?? ""),
        }))}
      />
    </section>
  );
}
