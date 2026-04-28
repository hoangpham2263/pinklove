import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import type { SystemSettings } from "@/lib/system-settings";

type EcommerceSettingsFormProps = {
  settings: SystemSettings;
};

export function EcommerceSettingsForm({ settings }: EcommerceSettingsFormProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Checkout</CardTitle>
          </CardHeader>
          <CardContent>{settings.ecommerce.enabled ? "On" : "Off"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipping</CardTitle>
          </CardHeader>
          <CardContent>{settings.ecommerce.supportShipping ? "On" : "Off"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Carrier Account</CardTitle>
          </CardHeader>
          <CardContent>{settings.ecommerce.shippingAccount.enabled ? settings.ecommerce.shippingAccount.provider || "Configured" : "Off"}</CardContent>
        </Card>
      </div>

      <form action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-5">
        <input type="hidden" name="section" value="ecommerce" />

        <Card>
          <CardHeader>
            <CardTitle>Tiền tệ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="font-medium">Tiền tệ</label>
              <input name="currency" defaultValue={settings.ecommerce.currency} className="h-10 w-full rounded-md border bg-background px-3" />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Ký hiệu tiền tệ</label>
              <input
                name="currencySymbol"
                defaultValue={settings.ecommerce.currencySymbol}
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Dấu phân cách hàng nghìn</label>
              <select
                name="thousandSeparator"
                defaultValue={settings.ecommerce.thousandSeparator}
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value=".">.</option>
                <option value=",">,</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Dấu thập phân</label>
              <select
                name="decimalSeparator"
                defaultValue={settings.ecommerce.decimalSeparator}
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value=",">,</option>
                <option value=".">.</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vận chuyển</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="font-medium">Phí vận chuyển cố định</label>
              <input
                name="flatShippingFee"
                type="number"
                min="0"
                defaultValue={settings.ecommerce.flatShippingFee}
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Ngưỡng miễn phí ship</label>
              <input
                name="freeShippingThreshold"
                type="number"
                min="0"
                defaultValue={settings.ecommerce.freeShippingThreshold}
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Trạng thái vận chuyển</label>
              <label className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3">
                <span className="text-sm text-muted-foreground">
                  {settings.ecommerce.supportShipping ? "Đang bật" : "Đang tắt"}
                </span>
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    name="supportShipping"
                    defaultChecked={settings.ecommerce.supportShipping}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition peer-checked:bg-primary" />
                  <span className="absolute left-1 size-4 rounded-full bg-background shadow-sm transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tài khoản vận chuyển hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="font-medium">Kích hoạt</label>
              <label className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3">
                <span className="text-sm text-muted-foreground">
                  {settings.ecommerce.shippingAccount.enabled ? "Đang bật" : "Đang tắt"}
                </span>
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    name="shippingAccountEnabled"
                    defaultChecked={settings.ecommerce.shippingAccount.enabled}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition peer-checked:bg-primary" />
                  <span className="absolute left-1 size-4 rounded-full bg-background shadow-sm transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Đơn vị vận chuyển</label>
              <input
                name="shippingAccountProvider"
                defaultValue={settings.ecommerce.shippingAccount.provider}
                placeholder="GHN, GHTK, Viettel Post..."
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Tên tài khoản</label>
              <input
                name="shippingAccountLabel"
                defaultValue={settings.ecommerce.shippingAccount.accountLabel}
                placeholder="PinkLove Fulfillment"
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Shop ID / Merchant ID</label>
              <input
                name="shippingAccountShopId"
                defaultValue={settings.ecommerce.shippingAccount.shopId}
                placeholder="shop_12345"
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="font-medium">API Token / Key</label>
              <input
                name="shippingAccountToken"
                defaultValue={settings.ecommerce.shippingAccount.token}
                placeholder="token hoặc secret key"
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Carrier Pickup Address ID</label>
              <input
                name="shippingAccountPickupAddressId"
                defaultValue={settings.ecommerce.shippingAccount.pickupAddressId}
                placeholder="ID địa chỉ lấy hàng trên hệ thống carrier"
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground lg:col-span-4">
              Tài khoản này dùng chung cho toàn hệ thống khi admin tạo vận đơn. Địa chỉ thực tế của user/vendor được quản lý bằng sổ địa chỉ chung; trường ID này chỉ là mã mapping bên carrier nếu carrier yêu cầu.
            </div>
          </CardContent>
        </Card>

        <input type="hidden" name="enabled" value={settings.ecommerce.enabled ? "on" : ""} />
        <input
          type="hidden"
          name="autoApproveMockPayments"
          value={settings.ecommerce.autoApproveMockPayments ? "on" : ""}
        />

        <div className="flex justify-end">
          <Button type="submit">Lưu cấu hình checkout</Button>
        </div>
      </form>
    </>
  );
}
