import { notFound } from "next/navigation";
import { CheckCircle2, ClipboardList, Clock3, SearchCheck } from "lucide-react";

import { VendorPortalCopyButton } from "@/features/admin/components/vendors/vendor-portal-copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDeleteButton, AdminLinkButton, AdminOutlineButton, AdminSecondaryButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
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

function getVendorAccountStatusLabel(status: string) {
  switch (status) {
    case "blocked":
      return "Đang block";
    case "banned":
      return "Đã ban";
    case "deleted":
      return "Đã xóa mềm";
    case "active":
    default:
      return "Đang hoạt động";
  }
}

function getVendorAccountStatusClassName(status: string) {
  switch (status) {
    case "blocked":
      return "bg-amber-100 text-amber-900";
    case "banned":
      return "bg-rose-100 text-rose-900";
    case "deleted":
      return "bg-zinc-200 text-zinc-700";
    case "active":
    default:
      return "bg-emerald-100 text-emerald-900";
  }
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
          <div>
            <h1 className="text-2xl font-semibold">{vendor.displayName || vendor.fullName || vendor.username}</h1>
            <p className="text-sm text-muted-foreground">
              Trang điều phối riêng cho vendor `{vendor.username}`. Admin có thể theo dõi toàn bộ đơn đã giao cho đối tác này từ một chỗ.
            </p>
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getVendorAccountStatusClassName(vendor.accountStatus)}`}>
                {getVendorAccountStatusLabel(vendor.accountStatus)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <AdminLinkButton href={`${ROUTES.ADMIN.USERS}/${vendor.id}?returnTo=${encodeURIComponent(ROUTES.ADMIN.VENDORS)}`}>Sửa tài khoản</AdminLinkButton>
          <AdminLinkButton href={`${ROUTES.ADMIN.VENDOR_OFFERINGS}?vendorId=${encodeURIComponent(vendor.id)}`}>Hồ sơ sản phẩm chờ duyệt</AdminLinkButton>
          {vendorPortalSlug ? (
            <>
              <VendorPortalCopyButton
                label="Xem thông tin"
                path={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}
                username={vendor.username}
                password="12313"
              />
              <AdminLinkButton href={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}>Portal Link</AdminLinkButton>
            </>
          ) : null}
        </div>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng phân công" value={stats.total} icon={ClipboardList} />
        <AdminOverviewCard title="Đang xử lý" value={stats.active} icon={Clock3} />
        <AdminOverviewCard title="Chờ review" value={stats.review} icon={SearchCheck} />
        <AdminOverviewCard title="Hoàn tất" value={stats.completed} icon={CheckCircle2} />
      </AdminOverviewGrid>

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
                <div className="flex flex-wrap gap-2">
                  <VendorPortalCopyButton
                    label="Xem và copy thông tin"
                    path={ROUTES.PARTNER.PORTAL(vendorPortalSlug)}
                    username={vendor.username}
                    password="12313"
                  />
                  <AdminLinkButton href={`${ROUTES.ADMIN.VENDOR_OFFERINGS}?vendorId=${encodeURIComponent(vendor.id)}`}>Review sản phẩm vendor</AdminLinkButton>
                </div>
              ) : null}
            </div>
            <p><span className="font-medium">Bio:</span> {vendor.bio || "Chưa có"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kiểm soát supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Khi `block`, `ban` hoặc `xóa mềm`, toàn bộ sản phẩm live thuộc supplier này sẽ bị hạ khỏi catalog và các hồ sơ vendor sẽ bị archive theo.
            </p>

            <form action={ROUTES.API.ADMIN.VENDORS.STATUS} method="POST" className="space-y-3">
              <input type="hidden" name="vendorId" value={vendor.id} />
              <input type="hidden" name="returnTo" value={ROUTES.ADMIN.VENDOR(vendor.id)} />
              <textarea
                name="reason"
                defaultValue={vendor.accountStatusReason}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Lý do block / ban / xóa mềm supplier"
              />
              <div className="grid gap-2">
                <AdminOutlineButton type="submit" name="nextStatus" value="active" className="justify-start">
                  Mở lại supplier
                </AdminOutlineButton>
                <AdminOutlineButton type="submit" name="nextStatus" value="blocked" className="justify-start">
                  Block supplier và ẩn catalog
                </AdminOutlineButton>
                <AdminDeleteButton type="submit" name="nextStatus" value="banned" className="justify-start">
                  Ban supplier
                </AdminDeleteButton>
                <AdminSecondaryButton type="submit" name="nextStatus" value="deleted" className="justify-start">
                  Xóa mềm supplier
                </AdminSecondaryButton>
              </div>
            </form>
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
                      {entry.order.customerName} • {entry.items.map((item) => `${item.offeringName} x${item.quantity}`).join(", ")}
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
                    <AdminLinkButton href={ROUTES.ADMIN.ORDER(entry.order.id)}>Xem order</AdminLinkButton>
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
