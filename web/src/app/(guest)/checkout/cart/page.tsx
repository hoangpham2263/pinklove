import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listCartItems } from "@/features/commerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default async function CheckoutCartPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const items = await listCartItems(user.id);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Giỏ hàng</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kiểm tra lại sản phẩm trước khi sang bước checkout.
          </p>
        </div>
        <Button variant="outline" render={<Link href={ROUTES.TEMPLATES}>Tiếp tục xem sản phẩm</Link>} />
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Giỏ hàng đang trống</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chưa có sản phẩm nào trong giỏ. Hãy thêm template hoặc builder starter trước khi checkout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" render={<Link href={ROUTES.TEMPLATES}>Xem template</Link>} />
              <Button render={<Link href={ROUTES.BUILDER}>Xem builder</Link>} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.productType === "coded_template" ? "Template code sẵn" : "Builder starter"} • {item.fulfillmentType}
                    </p>
                    <p className="mt-2 text-sm">{formatCurrency(item.price)} / sản phẩm</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <form action={ROUTES.API.CUSTOMER.CART.UPDATE} method="POST" className="flex items-center gap-2">
                      <input type="hidden" name="productId" value={item.productId} />
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        defaultValue={item.quantity}
                        className="h-10 w-20 rounded-md border bg-background px-3 text-sm"
                      />
                      <Button type="submit" variant="outline">Cập nhật</Button>
                    </form>

                    <form action={ROUTES.API.CUSTOMER.CART.REMOVE} method="POST">
                      <input type="hidden" name="productId" value={item.productId} />
                      <Button type="submit" variant="destructive">Xóa</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Số sản phẩm</span>
                <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <Button className="w-full" render={<Link href={ROUTES.CHECKOUT.INDEX}>Tiến hành checkout</Link>} />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
