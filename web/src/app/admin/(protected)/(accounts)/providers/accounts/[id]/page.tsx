import { notFound } from "next/navigation";
import { CheckCircle2, ClipboardList, Clock3, SearchCheck } from "lucide-react";

import { ProviderPortalCopyButton } from "@/features/admin/components/provider-account-management/provider-portal-copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDeleteButton, AdminLinkButton, AdminOutlineButton, AdminSecondaryButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { countProviderAssignmentsForProvider, listProviderOrderSummariesForProvider } from "@/features/provider-orders/server/service";
import { ensureProviderPortalSlug, getUserAccount, requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { getPaymentStatusLabel, getProviderAssignmentStatusLabel } from "@/lib/status-labels";
import { getSystemSettings } from "@/lib/system-settings";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProviderAccountStatusLabel(status: string) {
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

function getProviderAccountStatusClassName(status: string) {
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

type AdminProviderAccountDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProviderAccountDetailPage({ params }: AdminProviderAccountDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const provider = await getUserAccount(id);

  if (!provider || provider.role !== USER_ROLES.PROVIDER) {
    notFound();
  }

  const providerPortalSlug = provider.providerPortalSlug || (await ensureProviderPortalSlug(provider.id));

  const [stats, assignments, settings] = await Promise.all([
    countProviderAssignmentsForProvider(provider.id),
    listProviderOrderSummariesForProvider(provider.id),
    getSystemSettings(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-semibold">{provider.displayName || provider.fullName || provider.username}</h1>
            <p className="text-sm text-muted-foreground">
              Trang điều phối riêng cho provider `{provider.username}`. Admin có thể theo dõi toàn bộ đơn đã giao cho đối tác này từ một chỗ.
            </p>
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getProviderAccountStatusClassName(provider.accountStatus)}`}>
                {getProviderAccountStatusLabel(provider.accountStatus)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <AdminLinkButton href={`${ROUTES.ADMIN.USERS}/${provider.id}?returnTo=${encodeURIComponent(ROUTES.ADMIN.PROVIDER_ACCOUNTS)}`}>Sửa tài khoản</AdminLinkButton>
          <AdminLinkButton href={`${ROUTES.ADMIN.PROVIDER_OFFERINGS}?providerId=${encodeURIComponent(provider.id)}`}>Yêu cầu sản phẩm chờ duyệt</AdminLinkButton>
          {providerPortalSlug ? (
            <>
              <ProviderPortalCopyButton
                label="Xem thông tin"
                path={ROUTES.PROVIDER.ROOT}
                username={provider.username}
              />
              <AdminLinkButton href={ROUTES.PROVIDER.ROOT}>Portal Link</AdminLinkButton>
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
            <CardTitle>Thông tin provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Username:</span> {provider.username}</p>
            <p><span className="font-medium">Display name:</span> {provider.displayName || "Chưa có"}</p>
            <p><span className="font-medium">Họ tên:</span> {provider.fullName || "Chưa có"}</p>
            <p><span className="font-medium">Điện thoại:</span> {provider.phone || "Chưa có"}</p>
            <div className="space-y-2">
              <p><span className="font-medium">Portal link:</span> {providerPortalSlug ? ROUTES.PROVIDER.ROOT : "Chưa có"}</p>
              {providerPortalSlug ? (
                <div className="flex flex-wrap gap-2">
                  <ProviderPortalCopyButton
                    label="Xem và copy thông tin"
                    path={ROUTES.PROVIDER.ROOT}
                    username={provider.username}
                  />
                  <AdminLinkButton href={`${ROUTES.ADMIN.PROVIDER_OFFERINGS}?providerId=${encodeURIComponent(provider.id)}`}>Review sản phẩm provider</AdminLinkButton>
                </div>
              ) : null}
            </div>
            <p><span className="font-medium">Bio:</span> {provider.bio || "Chưa có"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kiểm soát supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Khi `block`, `ban` hoặc `xóa mềm`, toàn bộ sản phẩm live thuộc supplier này sẽ bị hạ khỏi catalog và các hồ sơ provider sẽ bị archive theo.
            </p>

            <form action={ROUTES.API.ADMIN.PROVIDER_ACCOUNTS.STATUS} method="POST" className="space-y-3">
              <input type="hidden" name="providerId" value={provider.id} />
              <input type="hidden" name="returnTo" value={ROUTES.ADMIN.PROVIDER_ACCOUNT(provider.id)} />
              <textarea
                name="reason"
                defaultValue={provider.accountStatusReason}
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
                Provider này chưa được gán đơn nào.
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
                      Trạng thái provider: {getProviderAssignmentStatusLabel(entry.assignment.status)} • Thanh toán: {getPaymentStatusLabel(entry.order.paymentStatus)}
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
