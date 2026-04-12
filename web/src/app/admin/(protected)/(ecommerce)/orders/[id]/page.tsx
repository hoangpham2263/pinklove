import Link from "next/link";
import { notFound } from "next/navigation";
import { PageToast } from "@/components/common/page-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminOrderStatePanel } from "@/features/ecommerce/admin/admin-order-state-panel";
import { getOrderById } from "@/features/ecommerce/server/service";
import { AdminVendorAssignmentPanel } from "@/features/vendor-orders/components/admin-vendor-assignment-panel";
import { getVendorAssignmentByOrderId } from "@/features/vendor-orders/server/service";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const [order, settings, vendors, vendorAssignment] = await Promise.all([
    getOrderById(id),
    getSystemSettings(),
    listAccountsByRole(USER_ROLES.VENDOR),
    getVendorAssignmentByOrderId(id),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.saved ? <PageToast message="Đã cập nhật trạng thái đơn hàng." variant="success" cleanupKeys={["saved"]} /> : null}
      {query.vendorSaved ? <PageToast message="Đã lưu phân công vendor." variant="success" cleanupKeys={["vendorSaved"]} /> : null}
      {query.error === "invalid_vendor" ? <PageToast message="Vendor được chọn không hợp lệ." variant="error" /> : null}

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
                  <div className="font-semibold">{formatCurrency(item.lineTotal, settings.ecommerce)}</div>
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

        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdminOrderStatePanel
                orderId={order.id}
                submitUrl={ROUTES.API.ADMIN.ORDERS.UPDATE}
                detailUrl={`/api/admin/orders/${order.id}/state`}
                initialOrder={{
                  id: order.id,
                  status: order.status,
                  paymentStatus: order.paymentStatus,
                  fulfillmentStatus: order.fulfillmentStatus,
                  notes: order.notes,
                  updatedAt: order.updatedAt,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phân công vendor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdminVendorAssignmentPanel
                orderId={order.id}
                submitUrl={ROUTES.API.ADMIN.ORDERS.VENDOR_ASSIGNMENT}
                detailUrl={`/api/admin/orders/${order.id}/vendor-assignment`}
                initialDetail={vendorAssignment}
                vendorOptions={vendors.map((vendor) => ({
                  id: vendor.id,
                  label: vendor.displayName || vendor.fullName || vendor.username,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(order.subtotalAmount, settings.ecommerce)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phí ship</span>
                <span>{formatCurrency(order.shippingAmount, settings.ecommerce)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Tổng cộng</span>
                <span>{formatCurrency(order.totalAmount, settings.ecommerce)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
