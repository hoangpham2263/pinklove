import { PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import type { SystemSettings } from "@/lib/system-settings";

type EcommerceSettingsFormProps = {
  settings: SystemSettings;
};

export function EcommerceSettingsForm({ settings }: EcommerceSettingsFormProps) {
  return (
    <>
      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Checkout" value={settings.ecommerce.enabled ? "On" : "Off"} icon={ShoppingCart} />
        <AdminOverviewCard title="Shipping" value={settings.ecommerce.supportShipping ? "On" : "Off"} icon={Truck} />
        <AdminOverviewCard title="Shipping" value={settings.ecommerce.shippingAccounts.filter((account) => account.enabled).length} icon={PackageCheck} />
      </AdminOverviewGrid>

      <form action={ROUTES.API.ADMIN.CONFIG.UPDATE} method="POST" className="space-y-5">
        <input type="hidden" name="section" value="ecommerce" />

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Tiền tệ</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="font-medium">Tiền tệ</label>
              <input name="currency" defaultValue={settings.ecommerce.currency} className="h-10 w-full rounded-md border bg-white px-3" />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Ký hiệu tiền tệ</label>
              <input
                name="currencySymbol"
                defaultValue={settings.ecommerce.currencySymbol}
                className="h-10 w-full rounded-md border bg-white px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Dấu phân cách hàng nghìn</label>
              <select
                name="thousandSeparator"
                defaultValue={settings.ecommerce.thousandSeparator}
                className="h-10 w-full rounded-md border bg-white px-3"
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
                className="h-10 w-full rounded-md border bg-white px-3"
              >
                <option value=",">,</option>
                <option value=".">.</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Vận chuyển</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="font-medium">Trạng thái vận chuyển</label>
              <label className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3">
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

        <input type="hidden" name="enabled" value={settings.ecommerce.enabled ? "on" : ""} />
        <input
          type="hidden"
          name="autoApproveMockPayments"
          value={settings.ecommerce.autoApproveMockPayments ? "on" : ""}
        />

        <div className="flex justify-end">
          <AdminSubmitButton>Lưu cấu hình checkout</AdminSubmitButton>
        </div>
      </form>
    </>
  );
}
