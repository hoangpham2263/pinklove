import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listOrdersForUser } from "@/features/commerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default async function CustomerOrdersPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const orders = await listOrdersForUser(user.id);

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
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.items.map((item) => item.productName).join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Đơn: {order.status} • Thanh toán: {order.paymentStatus} • Fulfillment: {order.fulfillmentStatus}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                  <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.ORDER(order.id)}>Xem đơn</Link>} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
