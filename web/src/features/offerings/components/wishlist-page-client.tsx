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
    <GuestShell className="pb-16 pt-32 lg:pt-36">
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-400">Wishlist</p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">
            Danh sach yêu thích
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
                <GuestLinkButton href={ROUTES.TEMPLATES}>Xem thiệp mẫu sẵn</GuestLinkButton>
                <GuestLinkButton href={ROUTES.BUILDER} variant="secondary">Xem builder starter</GuestLinkButton>
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
                                {item.excerpt || "Sản phẩm này đã được lưu vào wishlist của bạn."}
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
                              aria-label={`Xóa ${item.name} khỏi wishlist`}
                              onClick={async (event) => {
                                event.stopPropagation();
                                const result = await removeOffering(item);
                                if (result?.removed) {
                                  setSelectedOfferingIds((current) => current.filter((id) => id !== item.id));
                                  toast.success("Da xoa khỏi wishlist.");
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
  );
}
