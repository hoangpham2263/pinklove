"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import {
  GuestLinkButton,
  GuestPanel,
  GuestPanelBody,
  GuestShell,
} from "@/app/(guest)/_components/guest-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWishlist } from "@/features/offerings/use-wishlist";
import { getWishlistOfferingHref } from "@/features/offerings/wishlist";
import { getOfferingTypeLabel, type Offering } from "@/features/offerings/types";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import type { EcommerceSettings } from "@/lib/system-settings";
import { toast } from "sonner";

type WishlistPageClientProps = {
  offerings: Array<Pick<Offering, "id" | "slug" | "offeringType" | "fulfillmentType" | "name" | "excerpt" | "thumbnailUrl" | "price">>;
  ecommerceSettings: EcommerceSettings;
  customerName: string;
  customerPhone?: string;
  customerEmail: string;
};

export function WishlistPageClient({
  offerings,
  ecommerceSettings,
}: WishlistPageClientProps) {
  const { count, isWishlisted, removeOffering } = useWishlist();
  const items = offerings
    .filter((offering) => isWishlisted(offering.id))
    .map((offering) => ({
      ...offering,
      href: getWishlistOfferingHref(offering),
    }));
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([]);
  const visibleSelectedIds = useMemo(() => {
    const visibleIds = new Set(items.map((item) => item.id));
    return selectedOfferingIds.filter((id) => visibleIds.has(id));
  }, [items, selectedOfferingIds]);
  const selectedIdSet = useMemo(() => new Set(visibleSelectedIds), [visibleSelectedIds]);
  const selectedItems = items.filter((item) => selectedIdSet.has(item.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const allSelected = items.length > 0 && visibleSelectedIds.length === items.length;

  const toggleOfferingSelection = (offeringId: string) => {
    setSelectedOfferingIds((current) =>
      current.includes(offeringId)
        ? current.filter((id) => id !== offeringId)
        : [...current, offeringId]
    );
  };

  const toggleAllOfferings = () => {
    setSelectedOfferingIds(allSelected ? [] : items.map((item) => item.id));
  };

  return (
    <main className="guest-soft-top-bg contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <span className="contact-cloud-decor service-cloud-decor-one" />
        <span className="contact-cloud-decor service-cloud-decor-two" />
        <span className="contact-cloud-decor service-cloud-decor-three opacity-20" />
        <span className="contact-cloud-decor service-cloud-decor-four opacity-15" />
        <span className="contact-cloud-decor service-cloud-decor-five opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-six opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-seven opacity-15" />
        <span className="contact-cloud-decor service-cloud-decor-eight opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-nine opacity-10" />
        <span className="contact-cloud-decor service-cloud-decor-ten opacity-10" />
        <span className="cta-sparkle-float absolute left-[14%] top-[3%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.16)]">✦</span>
        <span className="cta-sparkle-float absolute left-[36%] top-[5%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent opacity-70 drop-shadow-[0_6px_14px_rgba(255,184,251,0.12)]">✦</span>
        <span className="cta-heart-pop absolute left-[20%] top-[14%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-65 drop-shadow-[0_8px_18px_rgba(217,77,206,0.14)]">♥</span>
        <span className="cta-sparkle-float absolute right-[28%] top-[8%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-75 drop-shadow-[0_6px_16px_rgba(255,111,245,0.14)]">✦</span>
        <span className="cta-heart-pop absolute right-[18%] top-[22%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent opacity-25 drop-shadow-[0_8px_18px_rgba(217,77,206,0.08)]">♥</span>
        <span className="cta-sparkle-float absolute right-[10%] top-[34%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent opacity-20 drop-shadow-[0_8px_20px_rgba(255,111,245,0.08)]">✦</span>
      </div>

      <section className="relative z-10 isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <span className="cta-sparkle-float absolute left-[8%] top-[18%] text-4xl text-[#ff6ff5]/75 drop-shadow-[0_6px_16px_rgba(255,111,245,0.2)]">✦</span>
          <span className="cta-heart-pop absolute left-[13%] bottom-[26%] text-3xl text-[#d94dce]/70 drop-shadow-[0_8px_18px_rgba(217,77,206,0.24)]">♥</span>
          <span className="cta-sparkle-float absolute right-[8%] top-[46%] text-4xl text-[#ff6ff5]/70 drop-shadow-[0_8px_20px_rgba(255,111,245,0.35)]">✦</span>
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-10 pt-16 lg:pb-12 lg:pt-24">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">Yêu thích PinkLove</p>
            <h1 className="text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl lg:text-6xl">
              Danh sách yêu thích
            </h1>
            <p className="mx-auto max-w-3xl text-sm font-medium leading-8 text-stone-700 md:text-base lg:text-lg">
              Lưu các mẫu thiệp, sản phẩm và dịch vụ cưới bạn quan tâm vào một nơi, sau đó chọn hạng mục phù hợp để tiếp tục thanh toán hoặc quay lại catalog.
            </p>
          </div>
        </div>
      </section>

      <GuestShell className="relative z-10 pb-16 pt-8 lg:pb-20 lg:pt-12">
        <div className="flex flex-col gap-8">
        {items.length === 0 ? (
          <GuestPanel>
            <GuestPanelBody className="flex flex-col items-center gap-5 py-12 text-center">
              <div className="inline-flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <Heart className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-stone-950">Danh sách yêu thích đang trống</h2>
                <p className="max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
                  {count > 0
                    ? "Các sản phẩm đã lưu hiện không còn khả dụng công khai. Bạn có thể quay lại catalog để lưu mẫu khác."
                    : "Khi thả tim ở thẻ sản phẩm hoặc trang chi tiết, danh sách yêu thích sẽ hiển thị ở đây."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <GuestLinkButton href={ROUTES.TEMPLATES}>Xem thiệp mẫu sẵn</GuestLinkButton>
                <GuestLinkButton href={ROUTES.BUILDER} variant="secondary">Tự tạo thiệp</GuestLinkButton>
              </div>
            </GuestPanelBody>
          </GuestPanel>
        ) : (
          <form action={ROUTES.CHECKOUT.INDEX} method="GET" className="grid gap-5 lg:grid-cols-12">
            {visibleSelectedIds.map((id) => (
              <input key={id} type="hidden" name="selectedOfferingIds" value={id} />
            ))}

            <GuestPanel className="overflow-hidden shadow-none lg:col-span-8">
              <GuestPanelBody className="p-0">
                <Table className="min-w-[760px] text-sm">
                  <TableHeader>
                    <TableRow className="bg-stone-50/80 hover:bg-stone-50/80">
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAllOfferings}
                          onClick={(event) => event.stopPropagation()}
                          aria-label="Chọn tất cả sản phẩm"
                          className="size-4 rounded border-stone-300 text-stone-950"
                        />
                      </TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="w-36">Loại</TableHead>
                      <TableHead className="w-32 text-right">Giá</TableHead>
                      <TableHead className="w-28 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        data-state={selectedIdSet.has(item.id) ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => toggleOfferingSelection(item.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIdSet.has(item.id)}
                            onChange={() => toggleOfferingSelection(item.id)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Chọn ${item.name} để thanh toán`}
                            className="size-4 rounded border-stone-300 text-stone-950"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-4">
                            <Link
                              href={item.href}
                              onClick={(event) => event.stopPropagation()}
                              className="relative size-16 shrink-0 overflow-hidden rounded-md border border-stone-100 bg-stone-50"
                            >
                              {item.thumbnailUrl ? (
                                <Image
                                  src={item.thumbnailUrl}
                                  alt={item.name}
                                  width={160}
                                  height={160}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span className="flex size-full items-center justify-center text-xs text-stone-400">Preview</span>
                              )}
                            </Link>
                            <div className="min-w-0">
                              <Link
                                href={item.href}
                                onClick={(event) => event.stopPropagation()}
                                className="font-semibold text-stone-950 transition hover:text-rose-500"
                              >
                                {item.name}
                              </Link>
                              <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">
                                {item.excerpt || "Sản phẩm này đã được lưu vào Yêu thích của bạn."}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-600">{getOfferingTypeLabel(item.offeringType)}</TableCell>
                        <TableCell className="text-right font-semibold text-stone-950">
                          {formatCurrency(item.price, ecommerceSettings)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="inline-flex size-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-rose-200 hover:text-rose-500"
                              aria-label={`Xóa ${item.name} khỏi Yêu thích`}
                              onClick={async (event) => {
                                event.stopPropagation();
                                const result = await removeOffering(item);
                                if (result?.removed) {
                                  setSelectedOfferingIds((current) => current.filter((id) => id !== item.id));
                                  toast.success("Đã xóa khỏi Yêu thích.");
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </GuestPanelBody>
            </GuestPanel>

            <GuestPanel className="h-fit shadow-none lg:col-span-4 lg:sticky lg:top-28">
              <GuestPanelBody className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Tong don</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-950">
                    {formatCurrency(subtotal, ecommerceSettings)}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {visibleSelectedIds.length}/{items.length} san pham duoc chon
                  </p>
                </div>

                <div className="space-y-3 border-t border-stone-100 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-stone-500">Tam tinh</span>
                    <span className="font-medium text-stone-950">{formatCurrency(subtotal, ecommerceSettings)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-stone-500">Van chuyen</span>
                    <span className="font-medium text-stone-950">Tinh o checkout</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={visibleSelectedIds.length === 0}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  <ShoppingBag className="size-4" />
                  <span>Tien hanh thanh toan</span>
                </button>
              </GuestPanelBody>
            </GuestPanel>
          </form>
        )}
        </div>
      </GuestShell>
    </main>
  );
}
