import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { CurrencyInput } from "@/components/common/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import type { ShippingAccountSettings } from "@/lib/system-settings";

type ShippingConnectionEditorFormProps = {
  connection?: ShippingAccountSettings;
};

export function ShippingConnectionEditorForm({ connection }: ShippingConnectionEditorFormProps) {
  const isEditing = Boolean(connection);

  return (
    <form action={ROUTES.API.ADMIN.CONFIG.SHIPPING_SAVE} method="POST" className="space-y-5">
      <input type="hidden" name="originalCode" value={connection?.code ?? ""} />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{isEditing ? "Sửa kết nối vận chuyển" : "Thêm kết nối vận chuyển"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="font-medium">Mã nội bộ</label>
            <input
              name="code"
              defaultValue={connection?.code ?? ""}
              placeholder="ghn_main"
              className="h-10 w-full rounded-md border bg-white px-3"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Đơn vị vận chuyển</label>
            <input
              name="provider"
              defaultValue={connection?.provider ?? ""}
              placeholder="GHN, GHTK, Viettel Post..."
              className="h-10 w-full rounded-md border bg-white px-3"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Tên hiển thị</label>
            <input
              name="accountLabel"
              defaultValue={connection?.accountLabel ?? ""}
              placeholder="GHN HCM Main"
              className="h-10 w-full rounded-md border bg-white px-3"
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Shop ID / Merchant ID</label>
            <input
              name="shopId"
              defaultValue={connection?.shopId ?? ""}
              placeholder="shop_12345"
              className="h-10 w-full rounded-md border bg-white px-3"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="font-medium">API Token / Key</label>
            <input
              name="token"
              defaultValue={connection?.token ?? ""}
              placeholder="token hoặc secret key"
              className="h-10 w-full rounded-md border bg-white px-3"
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Carrier Pickup Address ID</label>
            <input
              name="pickupAddressId"
              defaultValue={connection?.pickupAddressId ?? ""}
              placeholder="ID địa chỉ lấy hàng bên carrier"
              className="h-10 w-full rounded-md border bg-white px-3"
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Trạng thái</label>
            <label className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3">
              <span className="text-sm text-muted-foreground">{connection?.enabled ? "Đang bật" : "Đang tắt"}</span>
              <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                <input type="checkbox" name="enabled" defaultChecked={connection?.enabled ?? true} className="peer sr-only" />
                <span className="absolute inset-0 rounded-full bg-muted transition peer-checked:bg-primary" />
                <span className="absolute left-1 size-4 rounded-full bg-background shadow-sm transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="font-medium">Phí vận chuyển cố định</label>
            <CurrencyInput
              name="flatShippingFee"
              defaultValue={connection?.flatShippingFee ?? 30000}
              className="h-10 w-full rounded-md border bg-white px-3"
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium">Ngưỡng miễn phí ship</label>
            <CurrencyInput
              name="freeShippingThreshold"
              defaultValue={connection?.freeShippingThreshold ?? 1500000}
              className="h-10 w-full rounded-md border bg-white px-3"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <AdminSubmitButton>{isEditing ? "Lưu kết nối" : "Thêm kết nối"}</AdminSubmitButton>
      </div>
    </form>
  );
}
