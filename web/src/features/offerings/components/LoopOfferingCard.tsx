"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
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

type OfferingCardImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function OfferingCardImage({ src, alt, className }: OfferingCardImageProps) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[linear-gradient(180deg,#fff7fb_0%,#f8eef7_100%)]">
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

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-[#efe8ea] bg-white shadow-[0_18px_40px_rgba(35,31,39,0.08)] transition-transform duration-300 ease-out hover:-translate-y-1",
        className
      )}
    >
      <Link
        href={href}
        aria-label={`Xem chi tiet ${offering.name}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        {offering.thumbnailUrl ? (
          <OfferingCardImage
            src={offering.thumbnailUrl}
            alt={offering.name}
            className={imageClassName}
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-[linear-gradient(180deg,#fff7fb_0%,#f8eef7_100%)] text-stone-400">
            Preview
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-fit rounded-sm bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">
              {getOfferingTypeLabel(offering.offeringType)}
            </span>
            {offering.fulfillmentType === "service" ? (
              <span className="w-fit rounded-sm bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">Đặt lịch</span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-stone-950 lg:text-lg">
            {offering.name}
          </h3>
          {offering.excerpt ? (
            <p className="line-clamp-2 text-sm leading-6 text-stone-500">
              {offering.excerpt}
            </p>
          ) : null}
          <p className="mt-auto text-base font-semibold text-rose-600 lg:text-lg">
            {formatVnd(offering.price)}
          </p>
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
          ) : null}
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-20">
        <WishlistToggleButton offering={wishlistOffering} />
      </div>
    </article>
  );
}
