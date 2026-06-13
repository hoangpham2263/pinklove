import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerOrdersTable } from "@/features/customer/components/customer-orders-table";
import { listOrdersForUser } from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
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
        <CustomerOrdersTable orders={orders} currencySettings={settings.ecommerce} />
      )}
    </section>
  );
}
