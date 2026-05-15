import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrderById, getOrderByNumberForUser, getPaymentById } from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { getPay2sConfig, verifyPay2sRedirectSignature, type Pay2sParams } from "@/lib/pay2s";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

function toParams(searchParams: Record<string, string | string[] | undefined>): Pay2sParams {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pay2sParams = toParams(params);
  const paymentId = String(pay2sParams.orderId || pay2sParams.paymentId || "").trim();
  const orderNumber = String(pay2sParams.orderNumber || "").trim();
  const [settings, payment] = await Promise.all([
    getSystemSettings(),
    paymentId ? getPaymentById(paymentId) : Promise.resolve(null),
  ]);
  const order = payment
    ? await getOrderById(payment.orderId)
    : orderNumber
      ? await getOrderByNumberForUser((await requireAppUser(ROUTES.AUTH.LOGIN)).id, orderNumber)
      : null;
  const method = payment
    ? settings.ecommerce.paymentMethods.find((item) => item.code === payment.method && item.provider === "pay2s")
    : null;
  const config = method ? getPay2sConfig(method) : null;
  const hasGatewayResult = Boolean(pay2sParams.resultCode);
  const validSignature = config && hasGatewayResult
    ? verifyPay2sRedirectSignature(pay2sParams, config.accessKey, config.secretKey)
    : null;
  const isPaid = payment?.status === "paid";
  const isGatewaySuccess = String(pay2sParams.resultCode ?? "") === "0";

  if (hasGatewayResult && !isGatewaySuccess && validSignature !== false) {
    redirect(`${ROUTES.PAYMENT.FAILED}?orderNumber=${encodeURIComponent(order?.orderNumber || orderNumber)}&payment=pay2s`);
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10 mt-20">
      <Card>
        <CardHeader>
          <CardTitle>{isPaid || isGatewaySuccess ? "Thanh toán đã được ghi nhận" : "Đang xác nhận thanh toán"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Kết quả cuối cùng sẽ được cập nhật bằng IPN từ Pay2S. Nếu trạng thái chưa đổi ngay, vui lòng kiểm tra lại đơn hàng sau vài giây.
          </p>
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Mã đơn</p>
            <p className="mt-1">{order?.orderNumber || orderNumber || "-"}</p>
          </div>
          {validSignature === false ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Chữ ký redirect từ Pay2S không hợp lệ. Hệ thống sẽ chỉ cập nhật đơn khi IPN hợp lệ.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            {order ? <Button render={<Link href={ROUTES.CUSTOMER.ORDER(order.id)}>Xem chi tiết đơn</Link>} /> : null}
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.ORDERS}>Tất cả đơn hàng</Link>} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
