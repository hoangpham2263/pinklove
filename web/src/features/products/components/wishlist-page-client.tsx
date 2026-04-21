"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, ReceiptText, Trash2 } from "lucide-react";
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
import { useWishlist } from "@/features/products/use-wishlist";
import { getWishlistProductHref } from "@/features/products/wishlist";
import type { Product } from "@/features/products/types";
import { formatCurrency } from "@/lib/currency";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import type { PublicPermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import type { EcommerceSettings } from "@/lib/system-settings";
import { toast } from "sonner";

type WishlistPageClientProps = {
  products: Array<Pick<Product, "id" | "slug" | "productType" | "fulfillmentType" | "name" | "excerpt" | "thumbnailUrl" | "price">>;
  permalinkConfig: PublicPermalinkConfig;
  ecommerceSettings: EcommerceSettings;
  customerName: string;
  customerPhone?: string;
  customerEmail: string;
};

function getProductTypeLabel(productType: Product["productType"]) {
  switch (productType) {
    case "builder_template":
      return "Tu tao thiep";
    case "general_product":
      return "San pham";
    case "coded_template":
    default:
      return "Thiep mau san";
  }
}

export function WishlistPageClient({
  products,
  permalinkConfig,
  ecommerceSettings,
  customerName,
  customerPhone,
  customerEmail,
}: WishlistPageClientProps) {
  const { count, isWishlisted, removeProduct } = useWishlist();
  const items = products
    .filter((product) => isWishlisted(product.id))
    .map((product) => ({
      ...product,
      href: getWishlistProductHref(product, permalinkConfig),
    }));
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const visibleSelectedIds = useMemo(() => {
    const visibleIds = new Set(items.map((item) => item.id));
    return selectedProductIds.filter((id) => visibleIds.has(id));
  }, [items, selectedProductIds]);
  const selectedIdSet = useMemo(() => new Set(visibleSelectedIds), [visibleSelectedIds]);
  const selectedItems = items.filter((item) => selectedIdSet.has(item.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const requiresShipping =
    ecommerceSettings.supportShipping && selectedItems.some((item) => item.fulfillmentType === "physical");
  const shippingAmount =
    requiresShipping && subtotal < ecommerceSettings.freeShippingThreshold
      ? ecommerceSettings.flatShippingFee
      : 0;
  const totalAmount = subtotal + shippingAmount;
  const paymentMethods = getEnabledPaymentMethods(ecommerceSettings, requiresShipping);
  const allSelected = items.length > 0 && visibleSelectedIds.length === items.length;

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const toggleAllProducts = () => {
    setSelectedProductIds(allSelected ? [] : items.map((item) => item.id));
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
                <GuestLinkButton href={ROUTES.TEMPLATES}>Xem thiep mau san</GuestLinkButton>
                <GuestLinkButton href={ROUTES.BUILDER} variant="secondary">Xem builder starter</GuestLinkButton>
              </div>
            </GuestPanelBody>
          </GuestPanel>
        ) : (
          <form action={ROUTES.API.CUSTOMER.CHECKOUT} method="POST" className="grid gap-5 lg:grid-cols-12">
            <input type="hidden" name="customerName" value={customerName} />
            <input type="hidden" name="customerPhone" value={customerPhone ?? ""} />
            <input type="hidden" name="customerEmail" value={customerEmail} />
            {visibleSelectedIds.map((id) => (
              <input key={id} type="hidden" name="selectedProductIds" value={id} />
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
                          onChange={toggleAllProducts}
                          onClick={(event) => event.stopPropagation()}
                          aria-label="Chon tat ca san pham"
                          className="size-4 rounded border-stone-300 text-stone-950"
                        />
                      </TableHead>
                      <TableHead>San pham</TableHead>
                      <TableHead className="w-36">Loai</TableHead>
                      <TableHead className="w-32 text-right">Gia</TableHead>
                      <TableHead className="w-28 text-right">Thao tac</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow
                        key={item.id}
                        data-state={selectedIdSet.has(item.id) ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => toggleProductSelection(item.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIdSet.has(item.id)}
                            onChange={() => toggleProductSelection(item.id)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Chon ${item.name} de thanh toan`}
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
                                {item.excerpt || "San pham nay da duoc luu vao wishlist cua ban."}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-stone-600">{getProductTypeLabel(item.productType)}</TableCell>
                        <TableCell className="text-right font-semibold text-stone-950">
                          {formatCurrency(item.price, ecommerceSettings)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="inline-flex size-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:border-rose-200 hover:text-rose-500"
                              aria-label={`Xoa ${item.name} khoi wishlist`}
                              onClick={async (event) => {
                                event.stopPropagation();
                                const result = await removeProduct(item);
                                if (result?.removed) {
                                  setSelectedProductIds((current) => current.filter((id) => id !== item.id));
                                  toast.success("Da xoa khoi wishlist.");
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
                    {formatCurrency(totalAmount, ecommerceSettings)}
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
                    <span className="font-medium text-stone-950">{formatCurrency(shippingAmount, ecommerceSettings)}</span>
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-stone-950">Phuong thuc thanh toan</span>
                  <select
                    name="paymentMethod"
                    required
                    disabled={paymentMethods.length === 0 || visibleSelectedIds.length === 0}
                    className="h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-rose-300 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400"
                    defaultValue={paymentMethods[0]?.code ?? ""}
                  >
                    {paymentMethods.length === 0 ? (
                      <option value="">Chua co phuong thuc kha dung</option>
                    ) : (
                      paymentMethods.map((method) => (
                        <option key={method.code} value={method.code}>
                          {method.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-stone-950">Ghi chu</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-rose-300"
                  />
                </label>

                <button
                  type="submit"
                  disabled={paymentMethods.length === 0 || visibleSelectedIds.length === 0}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  <ReceiptText className="size-4" />
                  <span>Thanh toan</span>
                </button>
              </GuestPanelBody>
            </GuestPanel>
          </form>
        )}
      </div>
    </GuestShell>
  );
}
