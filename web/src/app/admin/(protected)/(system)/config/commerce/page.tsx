import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminCommerceConnectionsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Commerce</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý checkout, thanh toán mô phỏng, chuyển khoản và cấu hình vận chuyển dùng chung cho toàn hệ thống.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Checkout</CardTitle>
          </CardHeader>
          <CardContent>{settings.commerce.enabled ? "On" : "Off"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bank Transfer</CardTitle>
          </CardHeader>
          <CardContent>{settings.commerce.allowBankTransfer ? "On" : "Off"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">COD</CardTitle>
          </CardHeader>
          <CardContent>{settings.commerce.allowCod ? "On" : "Off"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipping</CardTitle>
          </CardHeader>
          <CardContent>{settings.commerce.supportShipping ? "On" : "Off"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình commerce</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-5">
            <input type="hidden" name="section" value="commerce" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="enabled" defaultChecked={settings.commerce.enabled} className="mt-1" />
                <div>
                  <p className="font-medium">Bật checkout</p>
                  <p className="text-sm text-muted-foreground">Cho phép tạo order từ cart.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="allowBankTransfer" defaultChecked={settings.commerce.allowBankTransfer} className="mt-1" />
                <div>
                  <p className="font-medium">Cho phép chuyển khoản</p>
                  <p className="text-sm text-muted-foreground">Hiển thị phương thức chuyển khoản trong checkout.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="allowCod" defaultChecked={settings.commerce.allowCod} className="mt-1" />
                <div>
                  <p className="font-medium">Cho phép COD</p>
                  <p className="text-sm text-muted-foreground">Áp dụng cho đơn cần vận chuyển.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="autoApproveMockPayments" defaultChecked={settings.commerce.autoApproveMockPayments} className="mt-1" />
                <div>
                  <p className="font-medium">Auto approve mock payment</p>
                  <p className="text-sm text-muted-foreground">Dùng cho dev/test để đơn chuyển paid ngay.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-4">
                <input type="checkbox" name="supportShipping" defaultChecked={settings.commerce.supportShipping} className="mt-1" />
                <div>
                  <p className="font-medium">Bật vận chuyển</p>
                  <p className="text-sm text-muted-foreground">Cho phép tính phí ship và sinh shipment.</p>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="font-medium">Tiền tệ</label>
                <input name="currency" defaultValue={settings.commerce.currency} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Phí vận chuyển cố định</label>
                <input name="flatShippingFee" type="number" min="0" defaultValue={settings.commerce.flatShippingFee} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Ngưỡng miễn phí ship</label>
                <input name="freeShippingThreshold" type="number" min="0" defaultValue={settings.commerce.freeShippingThreshold} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium">Hướng dẫn chuyển khoản</label>
              <textarea name="bankTransferInstructions" defaultValue={settings.commerce.bankTransferInstructions} className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>

            <Button type="submit">Lưu cấu hình commerce</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
