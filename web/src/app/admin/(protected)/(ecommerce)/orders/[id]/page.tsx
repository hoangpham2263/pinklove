import { notFound } from "next/navigation";
import { PageToast } from "@/components/common/page-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOrderStatePanel } from "@/features/ecommerce/admin/admin-order-state-panel";
import { getOrderById } from "@/features/ecommerce/server/service";
import { AdminVendorAssignmentPanel } from "@/features/vendor-orders/components/admin-vendor-assignment-panel";
import { getVendorAssignmentByOrderId } from "@/features/vendor-orders/server/service";
import { listApprovedSupplierOptionsForProducts } from "@/features/vendor-product-submissions/server/service";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { USER_ROLES } from "@/lib/roles";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

function formatShippingAddress(order: Awaited<ReturnType<typeof getOrderById>>) {
  if (!order) return "";
  return [order.shippingLine1, order.shippingWard, order.shippingDistrict, order.shippingCity].filter(Boolean).join(", ");
}

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

  const shippingAddress = formatShippingAddress(order);
  const approvedSupplierOptions = await listApprovedSupplierOptionsForProducts(
    order.items.map((item) => item.productId ?? "")
  );
  const vendorOptions =
    approvedSupplierOptions.length > 0
      ? approvedSupplierOptions
      : vendors.map((vendor) => ({
          id: vendor.id,
          label: vendor.displayName || vendor.fullName || vendor.username,
        }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.saved ? <PageToast message="Đã cập nhật trạng thái đơn hàng." variant="success" cleanupKeys={["saved"]} /> : null}
      {query.vendorSaved ? <PageToast message="Đã lưu phân công vendor." variant="success" cleanupKeys={["vendorSaved"]} /> : null}
      {query.error === "invalid_vendor" ? <PageToast message="Vendor được chọn không hợp lệ." variant="error" /> : null}

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
              <p className="text-sm text-muted-foreground">
                {order.customerName}
                {order.customerEmail ? ` • ${order.customerEmail}` : ""}
                {order.customerPhone ? ` • ${order.customerPhone}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{getOrderStatusLabel(order.status)}</span>
              <span>{getPaymentStatusLabel(order.paymentStatus)}</span>
              <span>{getFulfillmentStatusLabel(order.fulfillmentStatus)}</span>
            </div>

            {order.notes ? (
              <p className="max-w-3xl text-sm text-muted-foreground">{order.notes}</p>
            ) : null}
          </div>

          <div className="grid gap-4 text-sm lg:min-w-[320px] lg:max-w-[360px]">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tổng tiền</p>
              <p className="text-lg font-semibold">{formatCurrency(order.totalAmount, settings.ecommerce)}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Người nhận</p>
              <p className="font-medium">{order.shippingName || order.customerName || "Chưa có thông tin"}</p>
              {order.shippingPhone ? <p className="text-muted-foreground">{order.shippingPhone}</p> : null}
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Địa chỉ giao hàng</p>
              <p className="text-muted-foreground">{shippingAddress || "Không yêu cầu vận chuyển"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm trong đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.productType} • {item.fulfillmentType} • SL {item.quantity}
                    </p>
                  </div>
                  <div className="shrink-0 font-semibold">{formatCurrency(item.lineTotal, settings.ecommerce)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <AdminVendorAssignmentPanel
            orderId={order.id}
            detailUrl={ROUTES.API.ADMIN.ORDERS.DETAIL_VENDOR_ASSIGNMENT(order.id)}
            initialDetail={vendorAssignment}
            vendorOptions={vendorOptions}
          />
        </div>

        <div className="space-y-5 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AdminOrderStatePanel
                orderId={order.id}
                detailUrl={ROUTES.API.ADMIN.ORDERS.DETAIL_STATE(order.id)}
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
        </div>
      </div>
    </section>
  );
}
