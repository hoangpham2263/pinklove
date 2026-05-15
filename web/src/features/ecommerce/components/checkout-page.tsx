import Link from "next/link";

import { AddressBookManager } from "@/components/common/address-book-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUserAddress, type UserAddress } from "@/features/account/address";
import { CheckoutSubmitButton } from "@/features/ecommerce/components/checkout-submit-button";
import type { CartItem } from "@/features/ecommerce/types";
import { formatCurrency } from "@/lib/currency";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { ROUTES } from "@/lib/routes";
import type { SystemSettings } from "@/lib/system-settings";
import { Banknote, CreditCard, QrCode, WalletCards } from "lucide-react";

type CheckoutPageProps = {
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  customerEmail: string;
  addresses?: UserAddress[];
  settings: SystemSettings;
};

function PaymentMethodMark({ provider, type }: { provider: string; type: string }) {
  const Icon =
    provider === "manual_bank_transfer" || provider === "pay2s"
      ? QrCode
      : provider === "cash" || type === "offline"
        ? Banknote
        : provider === "vnpay"
          ? CreditCard
          : WalletCards;

  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-foreground">
      <Icon className="size-6" />
    </span>
  );
}

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
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Không có sản phẩm để checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Danh sach yeu thich dang trong. Hay luu san pham truoc khi tao don hang.
            </p>
            <Button render={<Link href={ROUTES.WISHLIST}>Quay lai yeu thich</Link>} />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mt-20 mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {requiresShipping ? (
          <AddressBookManager
            addresses={addresses}
            actionUrl={ROUTES.API.ACCOUNT.ADDRESSES}
            returnTo={ROUTES.CHECKOUT.INDEX}
            createHref={`${ROUTES.CUSTOMER.CONFIG_ADDRESS_NEW}?returnTo=${checkoutReturnTo}`}
            getViewHref={(addressId) => `${ROUTES.CUSTOMER.CONFIG_ADDRESS(addressId)}?returnTo=${checkoutReturnTo}`}
            getEditHref={(addressId) => `${ROUTES.CUSTOMER.CONFIG_ADDRESS_EDIT(addressId)}?returnTo=${checkoutReturnTo}`}
            title="Địa chỉ giao hàng"
            description="Thêm, xem hoặc sửa địa chỉ ở trang quản lý chung. Checkout chỉ dùng địa chỉ đã lưu để tránh nhập trùng ở từng đơn."
          />
        ) : null}

        <form id="checkout-form" action={ROUTES.API.CUSTOMER.CHECKOUT} method="POST" className="space-y-6">
          {items.map((item) => (
            <input key={item.productId} type="hidden" name="selectedProductIds" value={item.productId} />
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-medium">Họ tên</label>
                <input
                  type="text"
                  name="customerName"
                  defaultValue={customerName}
                  required
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Số điện thoại</label>
                <input
                  type="text"
                  name="customerPhone"
                  defaultValue={customerPhone}
                  required={requiresShipping}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-medium">Email</label>
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
            <Card>
              <CardHeader>
                <CardTitle>Chọn địa chỉ giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {addresses.length > 0 ? (
                  <div className="grid gap-3">
                    {addresses.map((address, index) => (
                      <label key={address.id} className="flex items-start gap-3 rounded-md border p-4">
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
                    Chưa có địa chỉ giao hàng. Hãy thêm địa chỉ ở khối phía trên trước khi tạo đơn.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Ghi chú</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea name="notes" className="min-h-24 w-full rounded-md border bg-background px-3 py-2" />
            </CardContent>
          </Card>
        </form>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Xác nhận đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">SL: {item.quantity}</p>
                </div>
                <div className="text-right font-medium">{formatCurrency(item.price * item.quantity, settings.ecommerce)}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t pt-4">
            <p className="font-medium">Phương thức thanh toán</p>
            {paymentMethods.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có phương thức thanh toán nào đang bật trong admin.
              </div>
            ) : null}
            <div className="space-y-3">
              {paymentMethods.map((method, index) => (
                <label key={method.code} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition hover:bg-muted/30">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.code}
                    required
                    defaultChecked={index === 0}
                    form="checkout-form"
                    className="mt-0"
                  />
                  <PaymentMethodMark provider={method.provider} type={method.type} />
                  <span className="min-w-0 font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatCurrency(subtotal, settings.ecommerce)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>{formatCurrency(shippingAmount, settings.ecommerce)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Tổng cộng</span>
              <span>{formatCurrency(totalAmount, settings.ecommerce)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <CheckoutSubmitButton
              formId="checkout-form"
              disabled={paymentMethods.length === 0 || (requiresShipping && addresses.length === 0)}
            />
            <Button
              variant="outline"
              className="w-full"
              render={<Link href={ROUTES.WISHLIST}>Quay lai yeu thich</Link>}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
