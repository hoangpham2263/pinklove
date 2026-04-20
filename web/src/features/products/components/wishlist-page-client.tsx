"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ReceiptText, Trash2 } from "lucide-react";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestPanelHeader,
  GuestPanelTitle,
  GuestShell,
} from "@/app/(guest)/_components/guest-ui";
import { useWishlist } from "@/features/products/use-wishlist";
import { getWishlistProductHref } from "@/features/products/wishlist";
import type { Product } from "@/features/products/types";
import type { PublicPermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";

type WishlistPageClientProps = {
  products: Array<Pick<Product, "id" | "slug" | "productType" | "name" | "excerpt" | "thumbnailUrl" | "price">>;
  permalinkConfig: PublicPermalinkConfig;
};

export function WishlistPageClient({ products, permalinkConfig }: WishlistPageClientProps) {
  const { count, isWishlisted, removeProduct } = useWishlist();
  const items = products
    .filter((product) => isWishlisted(product.id))
    .map((product) => ({
      ...product,
      href: getWishlistProductHref(product, permalinkConfig),
    }));

  return (
    <GuestShell className="pb-16 pt-32 lg:pt-36">
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Wishlist</p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">
            San pham ban da luu
          </h1>
          <p className="text-sm leading-8 text-stone-600 md:text-base lg:text-lg">
            Day la danh sach yeu thich dong vai tro nhu gio hang: ban luu san pham o day roi tien hanh thanh toan tu cung mot noi.
          </p>
        </div>

        {items.length === 0 ? (
          <GuestPanel>
            <GuestPanelBody className="flex flex-col items-center gap-5 py-12 text-center">
              <div className="inline-flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Heart className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-stone-950">Wishlist dang trong</h2>
                <p className="max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                  {count > 0
                    ? "Cac san pham da luu hien khong con kha dung cong khai. Ban co the quay lai catalog de luu lai mau khac."
                    : "Khi thay tim o the san pham hoac trang chi tiet, danh sach yeu thich se hien o day."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <GuestLinkButton href={ROUTES.TEMPLATES}>Xem thiep mau san</GuestLinkButton>
                <GuestLinkButton href={ROUTES.BUILDER} variant="secondary">Xem builder starter</GuestLinkButton>
              </div>
            </GuestPanelBody>
          </GuestPanel>
        ) : (
          <>
            <GuestPanel>
              <GuestPanelBody className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Tong quan</p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {count} san pham san sang de dat mua
                  </p>
                </div>
                <GuestLinkButton href={ROUTES.CHECKOUT.INDEX} variant="secondary" className="gap-2">
                  <ReceiptText className="size-4" />
                  <span>Tien hanh thanh toan</span>
                </GuestLinkButton>
              </GuestPanelBody>
            </GuestPanel>

            <div className="grid gap-5 lg:grid-cols-2">
              {items.map((item) => (
                <GuestPanel key={item.slug} className="overflow-hidden">
                  <GuestPanelHeader className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                        {item.productType === "builder_template"
                          ? "Tu tao thiep"
                          : item.productType === "general_product"
                            ? "San pham"
                            : "Thiep mau san"}
                      </p>
                      <GuestPanelTitle>{item.name}</GuestPanelTitle>
                    </div>
                    <button
                      type="button"
                      className="inline-flex size-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:border-rose-200 hover:text-rose-500"
                      aria-label={`Xoa ${item.name} khoi wishlist`}
                      onClick={async () => {
                        const result = await removeProduct(item);
                        if (result?.removed) {
                          toast.success("Da xoa khoi wishlist.");
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </GuestPanelHeader>
                  <GuestPanelBody className="space-y-4">
                    {item.thumbnailUrl ? (
                      <div className="relative overflow-hidden rounded-xl border border-stone-100 bg-stone-50 lg:rounded-2xl">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.name}
                          width={1200}
                          height={900}
                          className="aspect-16/10 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-16/10 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400 lg:rounded-2xl">
                        Preview
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm leading-7 text-stone-600">
                        {item.excerpt || "San pham nay da duoc luu vao wishlist cua ban."}
                      </p>
                      <p className="text-lg font-semibold text-stone-950">
                        {item.price.toLocaleString("vi-VN")}d
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={item.href}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 lg:rounded-2xl"
                      >
                        Xem chi tiet
                      </Link>
                      <Link
                        href={ROUTES.CHECKOUT.INDEX}
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 lg:rounded-2xl"
                      >
                        Thanh toan tu yeu thich
                      </Link>
                    </div>
                  </GuestPanelBody>
                </GuestPanel>
              ))}
            </div>
          </>
        )}
      </div>
    </GuestShell>
  );
}
