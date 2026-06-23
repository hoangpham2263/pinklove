import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUserAddress, type UserAddress } from "@/features/account/address";
import { CheckoutPaymentMethodPicker } from "@/features/ecommerce/components/checkout-payment-method-picker";
import { CheckoutSubmitButton } from "@/features/ecommerce/components/checkout-submit-button";
import { VatInvoiceRequestCard } from "@/features/ecommerce/components/checkout-vat-invoice-fields";
import type { CartItem } from "@/features/ecommerce/types";
import { formatCurrency } from "@/lib/currency";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { ROUTES } from "@/lib/routes";
import type { SystemSettings } from "@/lib/system-settings";

type CheckoutPageProps = {
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  customerEmail: string;
  addresses?: UserAddress[];
  settings: SystemSettings;
};

export function CheckoutPageView({
  items,
  customerName,
  customerPhone,
  customerEmail,
  addresses = [],
  settings,
}: CheckoutPageProps) {
  const requiresShipping =
    settings.ecommerce.supportShipping && items.some((item) => item.fulfillmentType === "physical");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAccount = settings.ecommerce.shippingAccounts.find((account) => account.enabled);
  const flatShippingFee = shippingAccount?.flatShippingFee ?? settings.ecommerce.flatShippingFee;
  const freeShippingThreshold = shippingAccount?.freeShippingThreshold ?? settings.ecommerce.freeShippingThreshold;
  const shippingAmount =
    requiresShipping && subtotal < freeShippingThreshold
      ? flatShippingFee
      : 0;
  const totalAmount = subtotal + shippingAmount;
  const paymentMethods = getEnabledPaymentMethods(settings.ecommerce, requiresShipping);
  const checkoutReturnTo = encodeURIComponent(ROUTES.CHECKOUT.INDEX);

  if (items.length === 0) {
    return (
      <main className="guest-soft-top-bg contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px]">
        <CheckoutBackgroundDecor />
      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
          <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Không có sản phẩm để checkout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Danh sách yêu thích đang trống.</p>
              <Button render={<Link href={ROUTES.WISHLIST}>Quay lại yêu thích</Link>} />
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="guest-soft-top-bg contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px]">
      <CheckoutBackgroundDecor />

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6 lg:py-14">
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">Checkout PinkLove</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl">Thanh toán</h1>
        </div>

        <div className="space-y-5">
          <NativeForm id="checkout-form" action={ROUTES.API.CUSTOMER.CHECKOUT} method="POST" className="space-y-5">
            {items.map((item) => (
              <input key={item.offeringId} type="hidden" name="selectedOfferingIds" value={item.offeringId} />
            ))}

            <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle>Thông tin khách hàng</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ tên</label>
                  <input
                    type="text"
                    name="customerName"
                    defaultValue={customerName}
                    required
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
                {!requiresShipping ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <input
                      type="text"
                      name="customerPhone"
                      defaultValue={customerPhone}
                      className="h-10 w-full rounded-md border bg-background px-3"
                    />
                  </div>
                ) : null}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    name="customerEmail"
                    defaultValue={customerEmail}
                    required
                    className="h-10 w-full rounded-md border bg-background px-3"
                  />
                </div>
              </CardContent>
            </Card>

            {requiresShipping ? (
              <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                  <CardTitle>Địa chỉ giao hàng</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 px-2.5"
                    render={
                      <Link href={`${ROUTES.CUSTOMER.CONFIG_ADDRESS_NEW}?returnTo=${checkoutReturnTo}`}>
                        <Plus className="h-3.5 w-3.5" />
                        Thêm
                      </Link>
                    }
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {addresses.length > 0 ? (
                    <div className="grid gap-2">
                      {addresses.map((address, index) => (
                        <label key={address.id} className="flex items-start gap-3 rounded-md border p-3 transition hover:bg-muted/30 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="addressId"
                            value={address.id}
                            required
                            defaultChecked={address.isDefault || (!addresses.some((item) => item.isDefault) && index === 0)}
                            className="mt-1"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{address.label || "Địa chỉ"}</p>
                              {address.isDefault ? (
                                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  Mặc định
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.recipientName} • {address.phone}
                            </p>
                            <p className="text-sm text-muted-foreground">{formatUserAddress(address)}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      Chưa có địa chỉ giao hàng.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea name="notes" placeholder="Ghi chú thêm cho đơn hàng" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </CardContent>
            </Card>

            {settings.ecommerce.enableVatInvoiceRequest ? <VatInvoiceRequestCard /> : null}
          </NativeForm>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle>Xác nhận đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-rose-100/80 bg-white/70 p-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-rose-100 bg-rose-50">
                        {item.thumbnailUrl ? (
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.offeringName}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 text-sm font-semibold text-rose-300">
                            PL
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium text-stone-900">{item.offeringName}</p>
                        <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm font-medium">{formatCurrency(item.price * item.quantity, settings.ecommerce)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-stone-900">Phương thức thanh toán</h3>
                {paymentMethods.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Chưa có phương thức thanh toán nào đang bật trong admin.
                  </div>
                ) : (
                  <CheckoutPaymentMethodPicker methods={paymentMethods} formId="checkout-form" />
                )}
              </div>
              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatCurrency(subtotal, settings.ecommerce)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>{formatCurrency(shippingAmount, settings.ecommerce)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(totalAmount, settings.ecommerce)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <CheckoutSubmitButton
              formId="checkout-form"
              disabled={paymentMethods.length === 0 || (requiresShipping && addresses.length === 0)}
            />
            <Button
              variant="outline"
              className="w-full bg-white/80 backdrop-blur"
              render={<Link href={ROUTES.WISHLIST}>Quay lại yêu thích</Link>}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function CheckoutBackgroundDecor() {
  return (
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
  );
}
