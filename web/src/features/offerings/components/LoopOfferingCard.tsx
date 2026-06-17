"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Eye, Heart } from "lucide-react";
import { WishlistToggleButton } from "@/features/offerings/components/wishlist-toggle-button";
import { getOfferingTypeLabel, type Offering } from "@/features/offerings/types";
import { createWishlistOfferingSnapshot } from "@/features/offerings/wishlist";
import { formatVnd } from "@/lib/currency";
import { getOfferingPath } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

type LoopOfferingCardProps = {
  offering: Offering;
  className?: string;
  imageClassName?: string;
  wishlistCount?: number;
  viewCount?: number;
};

function formatMetricValue(value?: number) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "--";
}

function getFulfillmentLabel(value: Offering["fulfillmentType"]) {
  switch (value) {
    case "service":
      return "Đặt lịch";
    case "physical":
      return "Giao hàng";
    case "digital":
      return "Online";
    default:
      return "Sản phẩm";
  }
}

type OfferingCardImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function OfferingCardImage({ src, alt, className }: OfferingCardImageProps) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#fff7fb_0%,#f8eef7_100%)]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
        className={cn(
          "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]",
          className
        )}
      />
    </div>
  );
}

export function LoopOfferingCard({
  offering,
  className,
  imageClassName,
  wishlistCount,
  viewCount,
}: LoopOfferingCardProps) {
  const wishlistOffering = createWishlistOfferingSnapshot(offering);
  const href = getOfferingPath(offering);
  const hasMetrics = typeof wishlistCount === "number" || typeof viewCount === "number";
  const isService = offering.fulfillmentType === "service";
  const typeLabel = getOfferingTypeLabel(offering.offeringType);
  const fulfillmentLabel = getFulfillmentLabel(offering.fulfillmentType);

  return (
    <article
      className={cn(
        "group relative flex min-h-full flex-col overflow-hidden rounded-[26px] border border-[#efe3ea] bg-white shadow-[0_14px_34px_rgba(35,31,39,0.07)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#ff6ff5] hover:shadow-[0_24px_54px_rgba(217,77,206,0.15)]",
        className
      )}
    >
      <Link
        href={href}
        aria-label={`Xem chi tiet ${offering.name}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        <div className="relative p-2.5 pb-0">
          {offering.thumbnailUrl ? (
            <OfferingCardImage
              src={offering.thumbnailUrl}
              alt={offering.name}
              className={imageClassName}
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#fff7fb_0%,#f8eef7_100%)] text-stone-400">
              Preview
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-2.5 bottom-0 top-2.5 rounded-[22px] bg-linear-to-t from-stone-950/58 via-stone-950/8 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />

          <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100%-5rem)] rounded-full border border-white/50 bg-white/85 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-[0_10px_24px_rgba(35,31,39,0.12)] backdrop-blur">
            <span className="line-clamp-1">{typeLabel}</span>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-5 right-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              {fulfillmentLabel}
            </p>
            <p className="mt-1 text-lg font-semibold text-white drop-shadow-sm">
              {formatVnd(offering.price)}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-stone-950 lg:text-lg">
            {offering.name}
          </h3>
          {offering.excerpt ? (
            <p className="line-clamp-2 text-sm leading-6 text-stone-500">
              {offering.excerpt}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            {hasMetrics ? (
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-500">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="size-3.5" />
                  {formatMetricValue(wishlistCount)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3.5" />
                  {formatMetricValue(viewCount)}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                {isService ? "Dịch vụ cưới" : "Sản phẩm cưới"}
              </span>
            )}
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-950 shadow-[0_10px_20px_rgba(35,31,39,0.08)] transition group-hover:border-[#b529aa] group-hover:bg-[#b529aa] group-hover:text-white">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute right-5 top-5 z-20">
        <WishlistToggleButton offering={wishlistOffering} />
      </div>
    </article>
  );
}
