"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { WishlistToggleButton } from "@/features/products/components/wishlist-toggle-button";
import type { Product } from "@/features/products/types";
import { createWishlistProductSnapshot } from "@/features/products/wishlist";
import { getProductPath } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

type LoopProductCardProps = {
  product: Product;
  className?: string;
  imageClassName?: string;
  wishlistCount?: number;
  viewCount?: number;
};

function formatMetricValue(value?: number) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "--";
}

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

type ProductCardImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function ProductCardImage({ src, alt, className }: ProductCardImageProps) {
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

export function LoopProductCard({
  product,
  className,
  imageClassName,
  wishlistCount,
  viewCount,
}: LoopProductCardProps) {
  const wishlistProduct = createWishlistProductSnapshot(product);
  const href = getProductPath(product);
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
        aria-label={`Xem chi tiet ${product.name}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        {product.thumbnailUrl ? (
          <ProductCardImage
            src={product.thumbnailUrl}
            alt={product.name}
            className={imageClassName}
          />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-[linear-gradient(180deg,#fff7fb_0%,#f8eef7_100%)] text-stone-400">
            Preview
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2 p-4 lg:p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-stone-950 lg:text-lg">
            {product.name}
          </h3>
          {product.excerpt ? (
            <p className="line-clamp-2 text-sm leading-6 text-stone-500">
              {product.excerpt}
            </p>
          ) : null}
          <p className="mt-auto text-base font-semibold text-rose-600 lg:text-lg">
            {formatPrice(product.price)}
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
        <WishlistToggleButton product={wishlistProduct} />
      </div>
    </article>
  );
}
