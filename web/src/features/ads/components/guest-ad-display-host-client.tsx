"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { AdEventTracker } from "@/features/ads/components/ad-event-tracker";

type JsonRecord = Record<string, unknown>;

export type GuestDisplayAd = {
  id: string;
  name: string;
  placementId: string;
  placementKey: string;
  placementType: string;
  placementMetadata: JsonRecord;
  campaignMetadata: JsonRecord;
  creativeMetadata: JsonRecord;
  imageUrl: string;
  mobileImageUrl: string;
  targetUrl: string;
  altText: string;
  headline: string;
  body: string;
  ctaLabel: string;
};

type GuestAdDisplayHostClientProps = {
  ads: GuestDisplayAd[];
};

const INTRUSIVE_MODES = new Set(["modal", "floating"]);

function getText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function getStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

function getPageRules(metadata: JsonRecord) {
  const pageRules = metadata.pageRules && typeof metadata.pageRules === "object" && !Array.isArray(metadata.pageRules)
    ? metadata.pageRules as JsonRecord
    : {};

  return {
    include: [
      ...getStringArray(metadata.targetPages),
      ...getStringArray(pageRules.include),
    ],
    exclude: getStringArray(pageRules.exclude),
  };
}

function matchesPattern(pathname: string, pattern: string) {
  const normalizedPattern = pattern.trim();
  if (!normalizedPattern) return false;
  if (normalizedPattern === pathname) return true;
  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -1);
    return pathname.startsWith(prefix);
  }
  return false;
}

function matchesAdPageRules(pathname: string, metadata: JsonRecord, displayMode: string) {
  const rules = getPageRules(metadata);
  if (rules.exclude.some((rule) => matchesPattern(pathname, rule))) {
    return false;
  }

  if (rules.include.length) {
    return rules.include.some((rule) => matchesPattern(pathname, rule));
  }

  if (INTRUSIVE_MODES.has(displayMode)) {
    return false;
  }

  return getBoolean(metadata.globalEnabled, false);
}

function getDismissKey(ad: GuestDisplayAd) {
  return `pinklove_ad_dismissed_${ad.id}`;
}

function getCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function isDismissed(ad: GuestDisplayAd) {
  const key = getDismissKey(ad);
  return window.sessionStorage.getItem(key) === "1" || Boolean(getCookie(key));
}

function dismissAd(ad: GuestDisplayAd) {
  const key = getDismissKey(ad);
  const placement = ad.placementMetadata;
  const mode = getText(placement.dismissMode, "session");
  const ttlHours = Math.max(0, getNumber(placement.dismissTtlHours, 24));

  window.sessionStorage.setItem(key, "1");

  if (mode === "session") {
    return;
  }

  const maxAge = mode === "forever"
    ? 60 * 60 * 24 * 180
    : Math.max(60, Math.round(ttlHours * 60 * 60));
  document.cookie = `${key}=1; path=/; max-age=${maxAge}; samesite=lax`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isMobile;
}

function isDeviceEligible(ad: GuestDisplayAd, isMobile: boolean) {
  const rule = getText(ad.placementMetadata.deviceRules, "all");
  if (rule === "mobile") return isMobile;
  if (rule === "desktop") return !isMobile;
  return true;
}

function getDisplayMode(ad: GuestDisplayAd) {
  const mode = getText(ad.placementMetadata.displayMode);
  if (mode) return mode;
  if (ad.placementType === "popup") return "modal";
  if (ad.placementType === "floating") return "floating";
  if (ad.placementType === "announcement") return "top_bar";
  return "inline_banner";
}

function getPriority(ad: GuestDisplayAd) {
  return getNumber(ad.campaignMetadata.priority, 0);
}

function AdContent({ ad, compact = false }: { ad: GuestDisplayAd; compact?: boolean }) {
  const imageUrl = ad.mobileImageUrl || ad.imageUrl;
  const badge = getText(ad.creativeMetadata.badgeLabel) || (getBoolean(ad.campaignMetadata.isSponsored, true) ? "Sponsored" : "");
  const cta = ad.ctaLabel || "Xem ngay";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <div className="hidden h-16 w-20 shrink-0 overflow-hidden rounded-md bg-rose-50 sm:block">
            <img src={imageUrl} alt={ad.altText || ad.headline || ad.name} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {badge ? <div className="mb-1 w-fit rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-rose-700">{badge}</div> : null}
          {ad.headline ? <h2 className="line-clamp-1 text-sm font-semibold text-stone-950">{ad.headline}</h2> : null}
          {ad.body ? <p className="line-clamp-1 text-xs leading-5 text-stone-600">{ad.body}</p> : null}
          {ad.targetUrl ? <span className="mt-1 inline-flex text-xs font-semibold text-rose-600">{cta}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-xl bg-white md:grid-cols-[0.82fr_1.18fr]">
      <div className="relative aspect-[16/9] overflow-hidden bg-rose-50 md:aspect-[4/3]">
        {imageUrl ? (
          <img src={imageUrl} alt={ad.altText || ad.headline || ad.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-rose-50 text-rose-600">
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">PinkLove</span>
          </div>
        )}
        {badge ? (
          <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase text-rose-700 shadow-sm backdrop-blur">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">PinkLove</p>
          {ad.headline ? <h2 className="text-lg font-bold leading-tight text-stone-950 md:text-xl">{ad.headline}</h2> : null}
          {ad.body ? <p className="text-sm leading-5 text-stone-600">{ad.body}</p> : null}
        </div>
        {ad.targetUrl ? (
          <span className="inline-flex w-fit items-center justify-center rounded-md bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700">
            {cta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TrackedAdLink({ ad, children, className }: { ad: GuestDisplayAd; children: React.ReactNode; className?: string }) {
  const pathname = usePathname() || "/";
  const mode = getDisplayMode(ad);
  const href = ad.targetUrl || "#";

  return (
    <AdEventTracker
      className={className}
      impression={{ kind: "ad", id: ad.id, targetType: "placement", targetId: ad.placementKey, metadata: { pathname, displayMode: mode } }}
      click={{ kind: "ad", id: ad.id, targetType: "placement", targetId: ad.placementKey, metadata: { pathname, displayMode: mode } }}
    >
      <a href={href} className="block">
        {children}
      </a>
    </AdEventTracker>
  );
}

export function GuestAdDisplayHostClient({ ads }: GuestAdDisplayHostClientProps) {
  const pathname = usePathname() || "/";
  const isMobile = useIsMobile();
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => new Set());
  const [readyIds, setReadyIds] = useState<Set<string>>(() => new Set());

  const eligibleAds = useMemo(() => {
    return ads.filter((ad) => {
      const mode = getDisplayMode(ad);
      return matchesAdPageRules(pathname, ad.placementMetadata, mode) && isDeviceEligible(ad, isMobile);
    });
  }, [ads, isMobile, pathname]);

  useEffect(() => {
    const timers = eligibleAds.map((ad) => {
      const delay = Math.max(0, getNumber(ad.placementMetadata.showDelayMs, 0));
      if (delay === 0) {
        setReadyIds((current) => new Set(current).add(ad.id));
        return undefined;
      }
      return window.setTimeout(() => {
        setReadyIds((current) => new Set(current).add(ad.id));
      }, delay);
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) window.clearTimeout(timer);
      });
    };
  }, [eligibleAds]);

  const visibleAds = eligibleAds.filter((ad) => readyIds.has(ad.id) && !dismissedKeys.has(getDismissKey(ad)) && !isDismissed(ad));
  const topBars = visibleAds.filter((ad) => getDisplayMode(ad) === "top_bar");
  const bottomBars = visibleAds.filter((ad) => getDisplayMode(ad) === "bottom_bar");
  const overlays = visibleAds
    .filter((ad) => INTRUSIVE_MODES.has(getDisplayMode(ad)))
    .sort((a, b) => getPriority(b) - getPriority(a));
  const overlay = overlays[0];

  function close(ad: GuestDisplayAd) {
    dismissAd(ad);
    setDismissedKeys((current) => new Set(current).add(getDismissKey(ad)));
  }

  return (
    <>
      {topBars.map((ad) => (
        <div key={ad.id} className="fixed inset-x-0 top-0 z-50 border-b border-rose-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <TrackedAdLink ad={ad} className="min-w-0 flex-1">
              <AdContent ad={ad} compact />
            </TrackedAdLink>
            <button type="button" className="rounded-md p-1 text-stone-500 hover:bg-stone-100" aria-label="Close ad" onClick={() => close(ad)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {overlay && getDisplayMode(overlay) === "modal" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/30 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            {getBoolean(overlay.campaignMetadata.showCloseButton, true) ? (
              <button type="button" className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/95 text-stone-600 shadow-sm transition hover:bg-stone-100 hover:text-stone-950" aria-label="Close ad" onClick={() => close(overlay)}>
                <X className="h-4.5 w-4.5" />
              </button>
            ) : null}
            <TrackedAdLink ad={overlay}>
              <AdContent ad={overlay} />
            </TrackedAdLink>
          </div>
        </div>
      ) : null}

      {overlay && getDisplayMode(overlay) === "floating" ? (
        <div className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-rose-100 bg-white p-3 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          {getBoolean(overlay.campaignMetadata.showCloseButton, true) ? (
            <button type="button" className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-stone-600 shadow-sm hover:bg-stone-100" aria-label="Close ad" onClick={() => close(overlay)}>
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <TrackedAdLink ad={overlay}>
            <AdContent ad={overlay} compact />
          </TrackedAdLink>
        </div>
      ) : null}

      {bottomBars.map((ad) => (
        <div key={ad.id} className="fixed inset-x-0 bottom-0 z-50 border-t border-rose-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <TrackedAdLink ad={ad} className="min-w-0 flex-1">
              <AdContent ad={ad} compact />
            </TrackedAdLink>
            <button type="button" className="rounded-md p-1 text-stone-500 hover:bg-stone-100" aria-label="Close ad" onClick={() => close(ad)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
