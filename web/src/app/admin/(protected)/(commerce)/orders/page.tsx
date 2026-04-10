import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAllOrders } from "@/features/commerce/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await listAllOrders();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">Quản lý toàn bộ đơn hàng, trạng thái thanh toán và fulfillment.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Tổng đơn</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{orders.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Đã thanh toán</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{orders.filter((order) => order.paymentStatus === "paid").length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cần vận chuyển</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{orders.filter((order) => order.fulfillmentStatus !== "not_required").length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customerName} • {order.items.map((item) => item.productName).join(", ")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đơn: {order.status} • Payment: {order.paymentStatus} • Fulfillment: {order.fulfillmentStatus}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                <Button variant="outline" render={<Link href={ROUTES.ADMIN.ORDER(order.id)}>Chi tiết</Link>} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
