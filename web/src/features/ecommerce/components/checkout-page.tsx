import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodGuide } from "@/features/ecommerce/components/payment-method-guide";
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
  shippingName?: string;
  settings: SystemSettings;
};

export function CheckoutPageView({
  items,
  customerName,
  customerPhone,
  customerEmail,
  shippingName,
  settings,
}: CheckoutPageProps) {
  const requiresShipping =
    settings.ecommerce.supportShipping && items.some((item) => item.fulfillmentType === "physical");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAmount =
    requiresShipping && subtotal < settings.ecommerce.freeShippingThreshold
      ? settings.ecommerce.flatShippingFee
      : 0;
  const totalAmount = subtotal + shippingAmount;
  const paymentMethods = getEnabledPaymentMethods(settings.ecommerce, requiresShipping);

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
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form id="checkout-form" action={ROUTES.API.CUSTOMER.CHECKOUT} method="POST" className="space-y-6">
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
              <CardTitle>Thông tin giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-medium">Người nhận</label>
                <input
                  type="text"
                  name="shippingName"
                  defaultValue={shippingName}
                  required
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Số điện thoại nhận hàng</label>
                <input
                  type="text"
                  name="shippingPhone"
                  defaultValue={customerPhone}
                  required
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-medium">Địa chỉ dòng 1</label>
                <input type="text" name="shippingLine1" required className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-medium">Địa chỉ dòng 2</label>
                <input type="text" name="shippingLine2" className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Phường / xã</label>
                <input type="text" name="shippingWard" className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Quận / huyện</label>
                <input type="text" name="shippingDistrict" required className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Tỉnh / thành phố</label>
                <input type="text" name="shippingCity" required className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Mã bưu chính</label>
                <input type="text" name="shippingPostalCode" className="h-10 w-full rounded-md border bg-background px-3" />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có phương thức thanh toán nào đang bật trong admin.
              </div>
            ) : null}
            {paymentMethods.map((method, index) => (
              <label key={method.code} className="flex items-start gap-3 rounded-md border p-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.code}
                  defaultChecked={index === 0}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{method.label}</p>
                  <p className="text-muted-foreground">{method.description}</p>
                  <PaymentMethodGuide
                    method={method.code}
                    settings={settings.ecommerce}
                    amount={totalAmount}
                    requiresShipping={requiresShipping}
                    className="mt-3"
                  />
                </div>
              </label>
            ))}
            <div className="space-y-2">
              <label className="font-medium">Ghi chú</label>
              <textarea name="notes" className="min-h-24 w-full rounded-md border bg-background px-3 py-2" />
            </div>
          </CardContent>
        </Card>
      </form>

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
            <Button type="submit" form="checkout-form" className="w-full" disabled={paymentMethods.length === 0}>
              Tạo đơn hàng
            </Button>
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
