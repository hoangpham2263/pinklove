import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAllPayments } from "@/features/ecommerce/server/service";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const [payments, settings] = await Promise.all([listAllPayments(), getSystemSettings()]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">Quản lý các giao dịch thanh toán gắn với order.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.map((payment) => (
            <form key={payment.id} action={ROUTES.API.ADMIN.PAYMENTS.UPDATE} method="POST" className="rounded-md border p-4">
              <input type="hidden" name="paymentId" value={payment.id} />
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_auto] lg:items-end">
                <div>
                  <p className="font-medium">{payment.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {getPaymentMethodLabel(payment.method, settings.ecommerce)} • {formatCurrency(payment.amount, settings.ecommerce)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select name="status" defaultValue={payment.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {["pending", "paid", "failed", "refunded"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-medium">External ref</label>
                  <input type="text" name="externalRef" defaultValue={payment.externalRef} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <Button type="submit">Lưu</Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
