import { notFound } from "next/navigation";

import { ProviderAccountEditForm } from "@/features/admin/components/provider-account-management/provider-account-edit-form";
import { ProviderPortalInfoCard } from "@/features/admin/components/provider-account-management/provider-portal-info-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AdminLinkButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { listProviderOrderSummariesForProvider } from "@/features/provider-orders/server/service";
import { ensureProviderPortalSlug, getUserAccount, requireAdminPermission } from "@/lib/auth";
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

type AdminProviderAccountDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProviderAccountDetailPage({ params }: AdminProviderAccountDetailPageProps) {
  await requireAdminPermission("accounts.manage");
  const { id } = await params;
  const provider = await getUserAccount(id);

  if (!provider || provider.role !== USER_ROLES.PROVIDER) {
    notFound();
  }

  const providerPortalSlug = provider.providerPortalSlug || (await ensureProviderPortalSlug(provider.id));

  const [assignments, settings] = await Promise.all([
    listProviderOrderSummariesForProvider(provider.id),
    getSystemSettings(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Chỉnh sửa provider: {provider.displayName || provider.fullName || provider.username}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-9">
          <ProviderAccountEditForm provider={provider} />

          {providerPortalSlug ? (
            <ProviderPortalInfoCard path={ROUTES.PROVIDER.ROOT} username={provider.username} />
          ) : null}

          <Card className="min-w-0 overflow-visible rounded-lg gap-0">
            <CardHeader className="border-b gap-0 pb-0">
              <CardTitle>Đơn hàng của đối tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {assignments.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Provider này chưa được gán đơn nào.
                </div>
              ) : (
                assignments.map((entry) => (
                  <div key={entry.assignment.id} className="grid gap-3 rounded-md border p-4 lg:grid-cols-[minmax(0,1fr)_220px_200px] lg:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{entry.order.orderNumber}</p>
                        {entry.order.metadata.requestVatInvoice ? (
                          <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            VAT
                          </span>
                        ) : null}
                      </div>
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

        <div className="min-w-0 lg:col-span-3">
          <div className="space-y-6 lg:sticky lg:top-6">
            <Card className="min-w-0 rounded-lg">
              <CardHeader>
                <CardTitle>Kiểm soát supplier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="font-medium">Trạng thái supplier</label>
                    <select
                      form="provider-update-form"
                      name="nextStatus"
                      defaultValue={provider.accountStatus}
                      className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="blocked">Block supplier và ẩn catalog</option>
                      <option value="banned">Ban supplier</option>
                      <option value="deleted">Xóa mềm supplier</option>
                    </select>
                  </div>
                  <Textarea
                    form="provider-update-form"
                    name="reason"
                    defaultValue={provider.accountStatusReason}
                    placeholder="Lý do block / ban / xóa mềm supplier"
                  />
                  <AdminSubmitButton form="provider-update-form" className="w-full rounded-md">Lưu provider</AdminSubmitButton>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <AdminLinkButton
                    className="w-full rounded-md"
                    href={`${ROUTES.ADMIN.PROVIDER_OFFERINGS}?providerId=${encodeURIComponent(provider.id)}`}
                  >
                    Yêu cầu dịch vụ/sản phẩm
                  </AdminLinkButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
