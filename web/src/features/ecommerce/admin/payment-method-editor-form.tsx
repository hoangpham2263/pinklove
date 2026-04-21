import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";

type PaymentMethodEditorFormProps = {
  method?: EcommercePaymentMethodSettings;
};

export function PaymentMethodEditorForm({ method }: PaymentMethodEditorFormProps) {
  const isNew = !method;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "Thêm phương thức thanh toán" : `Sửa ${method.label}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={ROUTES.API.ADMIN.PAYMENT_METHODS.SAVE} method="POST" className="space-y-5">
          <input type="hidden" name="originalCode" value={method?.code ?? ""} />

          <label className="flex items-start gap-3 rounded-md border p-4">
            <input type="checkbox" name="enabled" defaultChecked={method?.enabled ?? true} className="mt-1" />
            <div>
              <p className="font-medium">Bật phương thức</p>
              <p className="text-muted-foreground">Phương thức đang bật sẽ xuất hiện ở checkout nếu phù hợp điều kiện đơn hàng.</p>
            </div>
          </label>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="font-medium">Code</label>
              <input
                name="code"
                defaultValue={method?.code ?? ""}
                placeholder="stripe_card"
                required
                className="h-10 w-full rounded-md border bg-background px-3"
              />
              <p className="text-xs text-muted-foreground">Không nên đổi code sau khi đã có order thật.</p>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Tên hiển thị</label>
              <input
                name="label"
                defaultValue={method?.label ?? ""}
                placeholder="Thẻ quốc tế"
                required
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Provider</label>
              <input
                name="provider"
                defaultValue={method?.provider ?? ""}
                placeholder="stripe"
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Kiểu xử lý</label>
              <select
                name="type"
                defaultValue={method?.type ?? "manual"}
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="manual">Manual / đối soát sau</option>
                <option value="offline">Offline / thu trực tiếp</option>
                <option value="redirect">Redirect gateway</option>
                <option value="embedded">Embedded gateway</option>
                <option value="mock">Mock / test nội bộ</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="space-y-2">
              <label className="font-medium">Điều kiện vận chuyển</label>
              <select
                name="requiresShipping"
                defaultValue={
                  method?.requiresShipping === true
                    ? "shipping"
                    : method?.requiresShipping === false
                      ? "no_shipping"
                      : "all"
                }
                className="h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="all">Mọi loại đơn</option>
                <option value="shipping">Chỉ đơn có giao hàng</option>
                <option value="no_shipping">Chỉ đơn không giao hàng</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-medium">Mô tả ngắn tại checkout</label>
              <input
                name="description"
                defaultValue={method?.description ?? ""}
                className="h-10 w-full rounded-md border bg-background px-3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Hướng dẫn sau khi chọn phương thức</label>
            <textarea
              name="instructions"
              defaultValue={method?.instructions ?? ""}
              className="min-h-32 w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <div>
              <h2 className="font-semibold">Thông tin nhận thanh toán</h2>
              <p className="text-sm text-muted-foreground">
                Dùng cho các phương thức cần thông tin tài khoản, QR hoặc đối soát thủ công. Có thể bỏ trống với gateway tự xử lý như Stripe/PayPal.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="font-medium">Tên ngân hàng</label>
                <input
                  name="bankName"
                  defaultValue={method?.bankName ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Mã ngân hàng VietQR</label>
                <input
                  name="bankQrBankId"
                  defaultValue={method?.bankQrBankId ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Số tài khoản</label>
                <input
                  name="bankAccountNumber"
                  defaultValue={method?.bankAccountNumber ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
              <div className="space-y-2">
                <label className="font-medium">Chủ tài khoản</label>
                <input
                  name="bankAccountName"
                  defaultValue={method?.bankAccountName ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">{isNew ? "Thêm phương thức" : "Lưu phương thức"}</Button>
            <Button variant="outline" render={<a href={ROUTES.ADMIN.CONFIG_PAYMENT_METHODS}>Quay lại Payment Methods</a>} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
