"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/features/offerings/use-wishlist";
import type { WishlistOfferingInput } from "@/features/offerings/wishlist";
import { cn } from "@/lib/utils";

type WishlistToggleButtonProps = {
  offering: WishlistOfferingInput;
  variant?: "icon" | "button";
  className?: string;
};

export function WishlistToggleButton({
  offering,
  variant = "icon",
  className,
}: WishlistToggleButtonProps) {
  const { isWishlisted, toggleOffering } = useWishlist();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wished = isWishlisted(offering.id);

  return (
    <button
      type="button"
      aria-label={wished ? `Bỏ ${offering.name} khỏi wishlist` : `Thêm ${offering.name} vào wishlist`}
      aria-pressed={wished}
      disabled={isSubmitting}
      className={cn(
        variant === "icon"
          ? [
            "inline-flex size-11 items-center justify-center rounded-full border transition",
            wished
              ? "border-rose-200 bg-white text-rose-500 shadow-[0_12px_30px_rgba(244,63,94,0.18)]"
              : "border-white/70 bg-white/92 text-stone-700 shadow-[0_12px_30px_rgba(15,23,42,0.16)] backdrop-blur hover:text-rose-500",
          ]
          : [
            "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold transition lg:rounded-2xl",
            wished
              ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "border-stone-300 bg-white text-stone-900 hover:bg-stone-50",
          ],
        className
      )}
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsSubmitting(true);

        try {
          const result = await toggleOffering(offering);
          if (!result) {
            return;
          }

          toast.success(result.added ? "Da them vao wishlist." : "Da xoa khoi wishlist.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Khong the cap nhat wishlist.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Heart className={cn("size-5", wished && "fill-current")} />
      {variant === "button" ? (
        <span>{wished ? "Da luu yeu thich" : "Them vao wishlist"}</span>
      ) : null}
    </button>
  );
}
