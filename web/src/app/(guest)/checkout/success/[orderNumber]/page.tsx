import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrderByNumberForUser } from "@/features/commerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { orderNumber } = await params;
  const order = await getOrderByNumberForUser(user.id, orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Đặt hàng thành công</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Mã đơn</p>
            <p className="mt-1 text-lg font-semibold">{order.orderNumber}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Trạng thái đơn</p>
              <p className="mt-1 font-semibold">{order.status}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Thanh toán</p>
              <p className="mt-1 font-semibold">{order.paymentStatus}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="mt-1 font-semibold">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href={ROUTES.CUSTOMER.ORDER(order.id)}>Xem chi tiết đơn</Link>} />
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.ORDERS}>Tất cả đơn hàng</Link>} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
