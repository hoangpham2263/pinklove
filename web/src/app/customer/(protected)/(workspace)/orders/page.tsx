import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerTableActionButton, CustomerTableActions } from "@/features/customer/ui/customer-table-actions";
import { listOrdersForUser } from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

export default async function CustomerOrdersPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [orders, settings] = await Promise.all([listOrdersForUser(user.id), getSystemSettings()]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Đơn hàng của tôi</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi thanh toán, giao hàng và quyền sử dụng sản phẩm sau mua.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có đơn hàng nào</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn chưa tạo đơn nào. Có thể bắt đầu từ template hoặc builder starter.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" render={<Link href={ROUTES.TEMPLATES}>Xem template</Link>} />
              <Button render={<Link href={ROUTES.BUILDER}>Xem builder</Link>} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{order.orderNumber}</p>
                    {order.metadata.requestVatInvoice ? (
                      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        VAT
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {order.items.map((item) => item.offeringName).join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Đơn: {getOrderStatusLabel(order.status)} • Thanh toán: {getPaymentStatusLabel(order.paymentStatus)} • Giao hàng: {getFulfillmentStatusLabel(order.fulfillmentStatus)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <p className="font-semibold">{formatCurrency(order.totalAmount, settings.ecommerce)}</p>
                  <CustomerTableActions>
                    <CustomerTableActionButton action="view" label="Xem đơn" href={ROUTES.CUSTOMER.ORDER(order.id)} />
                  </CustomerTableActions>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
