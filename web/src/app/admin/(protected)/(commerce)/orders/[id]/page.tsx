import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrderById } from "@/features/commerce/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{order.customerName} • {order.customerEmail}</p>
        </div>
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.ORDERS}>Quay lại orders</Link>} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm trong đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.productType} • {item.fulfillmentType} • SL {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin giao hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Người nhận:</span> {order.shippingName || "Chưa có"}</p>
              <p><span className="font-medium">Điện thoại:</span> {order.shippingPhone || "Chưa có"}</p>
              <p><span className="font-medium">Địa chỉ:</span> {[order.shippingLine1, order.shippingLine2, order.shippingWard, order.shippingDistrict, order.shippingCity].filter(Boolean).join(", ") || "Không yêu cầu vận chuyển"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={ROUTES.API.ADMIN.ORDERS.UPDATE} method="POST" className="space-y-4">
                <input type="hidden" name="orderId" value={order.id} />
                <div className="space-y-2">
                  <label className="font-medium">Trạng thái đơn</label>
                  <select name="status" defaultValue={order.status} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {["pending_payment", "paid", "processing", "ready_to_ship", "shipped", "completed", "cancelled", "refunded"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Trạng thái thanh toán</label>
                  <select name="paymentStatus" defaultValue={order.paymentStatus} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {["unpaid", "pending", "paid", "failed", "refunded"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Fulfillment</label>
                  <select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {["not_required", "pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium">Ghi chú</label>
                  <textarea name="notes" defaultValue={order.notes} className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <Button type="submit" className="w-full">Lưu trạng thái đơn</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(order.subtotalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phí ship</span>
                <span>{formatCurrency(order.shippingAmount)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Tổng cộng</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
