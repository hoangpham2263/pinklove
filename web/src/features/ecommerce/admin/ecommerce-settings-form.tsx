import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemSettings } from "@/lib/system-settings";
import { ROUTES } from "@/lib/routes";

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
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>{settings.ecommerce.paymentMethods.filter((item) => item.enabled).length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cash</CardTitle>
          </CardHeader>
          <CardContent>{settings.ecommerce.allowCod ? "On" : "Off"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipping</CardTitle>
          </CardHeader>
          <CardContent>{settings.ecommerce.supportShipping ? "On" : "Off"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình ecommerce</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-5">
            <input type="hidden" name="section" value="ecommerce" />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="enabled" defaultChecked={settings.ecommerce.enabled} className="mt-1" />
                <div>
                  <p className="font-medium">Bật checkout</p>
                  <p className="text-muted-foreground">Cho phép tạo order từ danh sách yêu thích đã đồng bộ ngầm.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input
                  type="checkbox"
                  name="allowBankTransfer"
                  defaultChecked={settings.ecommerce.allowBankTransfer}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Cho phép chuyển khoản QR</p>
                  <p className="text-muted-foreground">Hiển thị phương thức quét QR/chuyển khoản trong checkout.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="allowCod" defaultChecked={settings.ecommerce.allowCod} className="mt-1" />
                <div>
                  <p className="font-medium">Cho phép tiền mặt</p>
                  <p className="text-muted-foreground">Dùng cho thanh toán trực tiếp hoặc khi bàn giao.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input
                  type="checkbox"
                  name="autoApproveMockPayments"
                  defaultChecked={settings.ecommerce.autoApproveMockPayments}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Auto approve mock payment</p>
                  <p className="text-muted-foreground">Dùng cho dev/test để đơn chuyển paid ngay.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input
                  type="checkbox"
                  name="supportShipping"
                  defaultChecked={settings.ecommerce.supportShipping}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Bật vận chuyển</p>
                  <p className="text-muted-foreground">Cho phép tính phí ship và sinh shipment.</p>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="font-medium">Tên ngân hàng</label>
                <input
                  name="bankName"
                  defaultValue={settings.ecommerce.bankName}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Mã ngân hàng VietQR</label>
                <input
                  name="bankQrBankId"
                  defaultValue={settings.ecommerce.bankQrBankId}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Số tài khoản</label>
                <input
                  name="bankAccountNumber"
                  defaultValue={settings.ecommerce.bankAccountNumber}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Chủ tài khoản</label>
                <input
                  name="bankAccountName"
                  defaultValue={settings.ecommerce.bankAccountName}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Hướng dẫn chuyển khoản QR</label>
              <textarea
                name="bankTransferInstructions"
                defaultValue={settings.ecommerce.bankTransferInstructions}
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Hướng dẫn thanh toán tiền mặt</label>
              <textarea
                name="cashPaymentInstructions"
                defaultValue={settings.ecommerce.cashPaymentInstructions}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Danh sách phương thức thanh toán</label>
              <textarea
                name="paymentMethodsJson"
                defaultValue={JSON.stringify(settings.ecommerce.paymentMethods, null, 2)}
                className="min-h-72 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
              />
              <p className="text-sm text-muted-foreground">
                Quản lý toàn bộ phương thức thanh toán ở đây. Có thể thêm nhiều cách thanh toán mới bằng JSON với các key:
                `code`, `label`, `description`, `instructions`, `enabled`, `provider`, `type`, `requiresShipping`.
              </p>
            </div>

            <Button type="submit">Lưu cấu hình ecommerce</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
