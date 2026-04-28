"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

type ProductCardImageProps = {
  src: string;
  alt: string;
  className?: string;
  isHovered?: boolean;
};

function ProductCardImage({ src, alt, className, isHovered }: ProductCardImageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [overflowY, setOverflowY] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !imageRatio) {
      return;
    }

    const updateOverflow = () => {
      const frameWidth = frame.clientWidth;
      const frameHeight = frame.clientHeight;
      if (!frameWidth || !frameHeight) {
        setOverflowY(0);
        return;
      }

      const renderedHeight = frameWidth / imageRatio;
      setOverflowY(Math.max(renderedHeight - frameHeight, 0));
    };

    updateOverflow();

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [imageRatio]);

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={900}
        height={1800}
        sizes="240px"
        onLoad={(event) => {
          const image = event.currentTarget;
          if (image.naturalWidth && image.naturalHeight) {
            setImageRatio(image.naturalWidth / image.naturalHeight);
          }
        }}
        className={cn(
          "h-auto w-full max-w-none will-change-transform transition-transform duration-1600 ease-[cubic-bezier(0.22,1,0.36,1)]",
          className
        )}
        style={{
          transform: `translateY(-${isHovered ? overflowY : 0}px)`,
        }}
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
  const [isHovered, setIsHovered] = useState(false);
  const wishlistProduct = createWishlistProductSnapshot(product);
  const href = getProductPath(product);

  return (
    <article
      className={cn(
        "group relative aspect-2/3 overflow-hidden rounded-md border border-[#efe8ea] bg-white shadow-[0_18px_40px_rgba(35,31,39,0.08)] transition-transform duration-300 ease-out hover:-translate-y-1",
        className
      )}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsHovered(true)}
      onBlurCapture={() => setIsHovered(false)}
    >
      <Link
        href={href}
        aria-label={`Xem chi tiet ${product.name}`}
        className="absolute inset-0 z-10 block rounded-md"
      />

      <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#fff7fb_0%,#f8eef7_100%)]">
        {product.thumbnailUrl ? (
          <ProductCardImage
            src={product.thumbnailUrl}
            alt={product.name}
            className={imageClassName}
            isHovered={isHovered}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            Preview
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-t from-[#231f27]/88 via-[#231f27]/38 to-[#231f27]/12 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="flex h-full flex-col justify-between p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/16 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <Heart className="size-3.5" />
                  {formatMetricValue(wishlistCount)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/16 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <Eye className="size-3.5" />
                  {formatMetricValue(viewCount)}
                </span>
              </div>
              <div className="pointer-events-auto relative z-30">
                <WishlistToggleButton product={wishlistProduct} />
              </div>
            </div>

            <div className="space-y-2 text-white">
              <h3 className="text-lg font-semibold leading-tight lg:text-xl">
                {product.name}
              </h3>
              <p className="text-base font-medium text-white/90">
                {product.price.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
