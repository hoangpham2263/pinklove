import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán chưa hoàn tất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Giao dịch bị hủy hoặc chưa thành công. Đơn hàng vẫn được giữ ở trạng thái chờ thanh toán để bạn có thể thử lại.
          </p>
          <div className="rounded-md border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Mã đơn</p>
            <p className="mt-1">{orderNumber || "-"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href={ROUTES.CHECKOUT.INDEX}>Thanh toán lại</Link>} />
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.ORDERS}>Tất cả đơn hàng</Link>} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
