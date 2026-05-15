import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodGuide } from "@/features/ecommerce/components/payment-method-guide";
import { getOrderByNumberForUser } from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { getPaymentMethodLabel } from "@/lib/payment-methods";
import { ROUTES } from "@/lib/routes";
import { getPaymentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

export default async function OrderPaymentPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { orderNumber } = await params;
  const [order, settings] = await Promise.all([
    getOrderByNumberForUser(user.id, orderNumber),
    getSystemSettings(),
  ]);

  if (!order) {
    notFound();
  }

  if (order.paymentStatus === "paid") {
    redirect(`${ROUTES.PAYMENT.SUCCESS}?orderNumber=${encodeURIComponent(order.orderNumber)}`);
  }

  const primaryPayment = order.payments[0];

  return (
    <section className="mt-20 mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Mã đơn</p>
              <p className="mt-1 font-semibold">{order.orderNumber}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <p className="mt-1 font-semibold">{getPaymentStatusLabel(order.paymentStatus)}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="mt-1 font-semibold">{formatCurrency(order.totalAmount, settings.ecommerce)}</p>
            </div>
          </div>

          {primaryPayment ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
                <p className="mt-1 font-semibold">{getPaymentMethodLabel(primaryPayment.method, settings.ecommerce)}</p>
              </div>
              <PaymentMethodGuide
                method={primaryPayment.method}
                settings={settings.ecommerce}
                amount={order.totalAmount}
                orderNumber={order.orderNumber}
                requiresShipping={order.fulfillmentStatus !== "not_required"}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Hoàn tất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Sau khi chuyển khoản hoặc hoàn tất thanh toán theo hướng dẫn, chọn đã thanh toán để theo dõi trạng thái đơn.
          </p>
          <div className="flex flex-col gap-3">
            <form action="/api/customer/payments/manual" method="POST">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <input type="hidden" name="action" value="confirm" />
              <Button type="submit" className="w-full">Tôi đã thanh toán</Button>
            </form>
            <form action="/api/customer/payments/manual" method="POST">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <input type="hidden" name="action" value="cancel" />
              <Button type="submit" variant="outline" className="w-full">Hủy thanh toán</Button>
            </form>
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.ORDER(order.id)}>Xem chi tiết đơn</Link>} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
