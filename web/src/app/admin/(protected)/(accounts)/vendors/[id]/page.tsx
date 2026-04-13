import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { VendorPortalCopyButton } from "@/features/admin/components/vendors/vendor-portal-copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countVendorAssignmentsForVendor, listVendorOrderSummariesForVendor } from "@/features/vendor-orders/server/service";
import { ensureVendorPortalSlug, getUserAccount, requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { getPaymentStatusLabel, getVendorAssignmentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type AdminVendorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminVendorDetailPage({ params }: AdminVendorDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const vendor = await getUserAccount(id);

  if (!vendor || vendor.role !== USER_ROLES.VENDOR) {
    notFound();
  }

  const vendorPortalSlug = vendor.vendorPortalSlug || (await ensureVendorPortalSlug(vendor.id));

  const [stats, assignments, settings] = await Promise.all([
    countVendorAssignmentsForVendor(vendor.id),
    listVendorOrderSummariesForVendor(vendor.id),
    getSystemSettings(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href={ROUTES.ADMIN.VENDORS}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Quay lại vendors
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{vendor.displayName || vendor.fullName || vendor.username}</h1>
            <p className="text-sm text-muted-foreground">
              Trang điều phối riêng cho vendor `{vendor.username}`. Admin có thể theo dõi toàn bộ đơn đã giao cho đối tác này từ một chỗ.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            render={<Link href={`${ROUTES.ADMIN.USERS}/${vendor.id}?returnTo=${encodeURIComponent(ROUTES.ADMIN.VENDORS)}`}>Sửa tài khoản</Link>}
          />
          {vendorPortalSlug ? (
            <>
              <VendorPortalCopyButton
                label="Xem thông tin"
                path={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}
                username={vendor.username}
                password="12313"
              />
              <Button variant="outline" render={<Link href={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}>Portal Link</Link>} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Tổng phân công</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Đang xử lý</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.active}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Chờ review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.review}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Hoàn tất</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{stats.completed}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Username:</span> {vendor.username}</p>
            <p><span className="font-medium">Display name:</span> {vendor.displayName || "Chưa có"}</p>
            <p><span className="font-medium">Họ tên:</span> {vendor.fullName || "Chưa có"}</p>
            <p><span className="font-medium">Điện thoại:</span> {vendor.phone || "Chưa có"}</p>
            <div className="space-y-2">
              <p><span className="font-medium">Portal link:</span> {vendorPortalSlug ? ROUTES.PARTNER.PORTAL(vendorPortalSlug) : "Chưa có"}</p>
              {vendorPortalSlug ? (
                <VendorPortalCopyButton
                  label="Xem và copy thông tin"
                  path={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}
                  username={vendor.username}
                  password="12313"
                />
              ) : null}
            </div>
            <p><span className="font-medium">Bio:</span> {vendor.bio || "Chưa có"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Đơn hàng của đối tác</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {assignments.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Vendor này chưa được gán đơn nào.
              </div>
            ) : (
              assignments.map((entry) => (
                <div key={entry.assignment.id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[minmax(0,1fr)_220px_200px] lg:items-center">
                  <div className="space-y-1">
                    <p className="font-medium">{entry.order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.order.customerName} • {entry.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Trạng thái vendor: {getVendorAssignmentStatusLabel(entry.assignment.status)} • Thanh toán: {getPaymentStatusLabel(entry.order.paymentStatus)}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Giá trị: {formatCurrency(entry.order.totalAmount, settings.ecommerce)}</p>
                    <p>Cập nhật: {formatDateTime(entry.assignment.updatedAt)}</p>
                    <p>{entry.lastEvent?.message || "Chưa có activity"}</p>
                  </div>
                  <div className="flex justify-start lg:justify-end">
                    <Button variant="outline" render={<Link href={ROUTES.ADMIN.ORDER(entry.order.id)}>Xem order</Link>} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
