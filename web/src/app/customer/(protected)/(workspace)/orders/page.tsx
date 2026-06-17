import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
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
              Bạn chưa tạo đơn nào. Có thể bắt đầu từ template hoặc khu tạo thiệp trong tài khoản.
            </p>
            <div className="flex flex-wrap gap-3">
              <CustomerLinkButton href={ROUTES.TEMPLATES}>Xem template</CustomerLinkButton>
              <CustomerLinkButton href={ROUTES.CUSTOMER.INVITATIONS}>Tự tạo thiệp</CustomerLinkButton>
            </div>
          </CardContent>
        </Card>
      ) : (
        <CustomerOrdersTable orders={orders} currencySettings={settings.ecommerce} />
      )}
    </section>
  );
}
