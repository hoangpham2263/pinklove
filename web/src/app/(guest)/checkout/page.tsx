import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listCartItems } from "@/features/commerce/server/service";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default async function CheckoutPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [items, profile, settings] = await Promise.all([
    listCartItems(user.id),
    getUserProfile(user.id),
    getSystemSettings(),
  ]);

  if (items.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Không có sản phẩm để checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi tạo đơn hàng.
            </p>
            <Button render={<Link href={ROUTES.CHECKOUT.CART}>Quay lại giỏ hàng</Link>} />
          </CardContent>
        </Card>
      </section>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiresShipping = settings.commerce.supportShipping && items.some((item) => item.fulfillmentType === "physical");
  const shippingAmount =
    requiresShipping && subtotal < settings.commerce.freeShippingThreshold
      ? settings.commerce.flatShippingFee
      : 0;
  const totalAmount = subtotal + shippingAmount;

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
                defaultValue={profile.displayName || profile.fullName || user.username}
                required
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Số điện thoại</label>
              <input
                type="text"
                name="customerPhone"
                defaultValue={profile.phone}
                required={requiresShipping}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="font-medium">Email</label>
              <input
                type="email"
                name="customerEmail"
                defaultValue={`${user.username}@pinklove.local`}
                required
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
                <input type="text" name="shippingName" defaultValue={profile.displayName || profile.fullName} required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Số điện thoại nhận hàng</label>
                <input type="text" name="shippingPhone" defaultValue={profile.phone} required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-medium">Địa chỉ dòng 1</label>
                <input type="text" name="shippingLine1" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-medium">Địa chỉ dòng 2</label>
                <input type="text" name="shippingLine2" className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Phường / xã</label>
                <input type="text" name="shippingWard" className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Quận / huyện</label>
                <input type="text" name="shippingDistrict" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Tỉnh / thành phố</label>
                <input type="text" name="shippingCity" required className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Mã bưu chính</label>
                <input type="text" name="shippingPostalCode" className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 rounded-md border p-4">
              <input type="radio" name="paymentMethod" value="mock_online" defaultChecked className="mt-1" />
              <div>
                <p className="font-medium">Thanh toán online mô phỏng</p>
                <p className="text-sm text-muted-foreground">Phục vụ dev/test, tự động chuyển đơn sang trạng thái đã thanh toán nếu cấu hình cho phép.</p>
              </div>
            </label>
            {settings.commerce.allowBankTransfer ? (
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="radio" name="paymentMethod" value="bank_transfer" className="mt-1" />
                <div>
                  <p className="font-medium">Chuyển khoản</p>
                  <p className="text-sm text-muted-foreground">{settings.commerce.bankTransferInstructions}</p>
                </div>
              </label>
            ) : null}
            {settings.commerce.allowCod && requiresShipping ? (
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="radio" name="paymentMethod" value="cod" className="mt-1" />
                <div>
                  <p className="font-medium">Thanh toán khi nhận hàng</p>
                  <p className="text-sm text-muted-foreground">Phù hợp với đơn có vận chuyển.</p>
                </div>
              </label>
            ) : null}
            <div className="space-y-2">
              <label className="font-medium">Ghi chú</label>
              <textarea name="notes" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
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
                  <p className="text-sm text-muted-foreground">SL: {item.quantity}</p>
                </div>
                <div className="text-right text-sm font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>{formatCurrency(shippingAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Tổng cộng</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button type="submit" form="checkout-form" className="w-full">
              Tạo đơn hàng
            </Button>
            <Button variant="outline" className="w-full" render={<Link href={ROUTES.CHECKOUT.CART}>Quay lại giỏ hàng</Link>} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
