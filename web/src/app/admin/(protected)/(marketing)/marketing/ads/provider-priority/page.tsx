import { Store } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabaseTable } from "@/components/common/database-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDialogCreateTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import { AdminAdsPageShell } from "@/features/ads/admin/admin-ads-page-shell";
import {
  listPlacementOptions,
  listProviderOptions,
  listProviderPromotionPlanOptions,
  listProviderPromotionPlans,
  listProviderPromotionsForAdmin,
} from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminProviderPriorityPage() {
  await requireAdmin();
  const [promotions, plans, placements, providers, planOptions] = await Promise.all([
    listProviderPromotionsForAdmin(),
    listProviderPromotionPlans(),
    listPlacementOptions(),
    listProviderOptions(),
    listProviderPromotionPlanOptions(),
  ]);

  return (
    <AdminAdsPageShell
      title="Sponsored Providers"
      description="Ưu tiên provider/xưởng top hoặc đối tác trả phí trong danh sách hiển thị. Không dùng chung với booking dịch vụ."
      metrics={[
        { title: "Promotions", value: promotions.length, icon: Store },
        { title: "Active", value: promotions.filter((row) => row.status === "active").length },
        { title: "Plans", value: plans.length },
        { title: "Bookings", value: promotions.reduce((total, row) => total + Number(row.bookings ?? 0), 0) },
      ]}
      actions={
        <>
          <Dialog>
            <AdminDialogCreateTrigger>Tạo gói ưu tiên</AdminDialogCreateTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Tạo gói ưu tiên</DialogTitle>
                <DialogDescription>Admin cấu hình gói, placement, giá và trọng số ưu tiên.</DialogDescription>
              </DialogHeader>
              <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.PROVIDER_PLANS} method="POST" className="grid gap-4 md:grid-cols-2">
                <AdminField label="Key" required>
                  <AdminInput name="key" placeholder="featured_provider_30" required />
                </AdminField>
                <AdminField label="Tên gói" required>
                  <AdminInput name="name" required />
                </AdminField>
                <AdminField label="Placement">
                  <AdminSelect name="placementId">
                    <option value="">Không cố định</option>
                    {placements.map((placement) => <option key={placement.id} value={placement.id}>{placement.label}</option>)}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Price">
                  <AdminInput name="price" type="number" min="0" step="1000" defaultValue="0" />
                </AdminField>
                <AdminField label="Duration days">
                  <AdminInput name="durationDays" type="number" min="1" defaultValue="30" />
                </AdminField>
                <AdminField label="Priority weight">
                  <AdminInput name="priorityWeight" type="number" min="0" defaultValue="100" />
                </AdminField>
                <AdminField label="Active">
                  <AdminSelect name="isActive" defaultValue="true">
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Mô tả" className="md:col-span-2">
                  <AdminTextarea name="description" rows={3} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminSubmitButton>Lưu gói</AdminSubmitButton>
                </div>
              </NativeForm>
            </DialogContent>
          </Dialog>

          <Dialog>
            <AdminDialogCreateTrigger>Tạo ưu tiên provider</AdminDialogCreateTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Tạo ưu tiên provider</DialogTitle>
                <DialogDescription>Admin kiểm soát provider, placement, payment và trạng thái publish.</DialogDescription>
              </DialogHeader>
              <NativeForm action={ROUTES.API.ADMIN.MARKETING.ADS.PROVIDER_PROMOTIONS} method="POST" className="grid gap-4 md:grid-cols-2">
                <AdminField label="Provider" required>
                  <AdminSelect name="providerId" required>
                    <option value="">Chọn provider</option>
                    {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Tiêu đề" required>
                  <AdminInput name="title" placeholder="Featured provider" required />
                </AdminField>
                <AdminField label="Gói">
                  <AdminSelect name="planId">
                    <option value="">Không gắn gói</option>
                    {planOptions.map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Placement">
                  <AdminSelect name="placementId">
                    <option value="">Theo gói / không cố định</option>
                    {placements.map((placement) => <option key={placement.id} value={placement.id}>{placement.label}</option>)}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Target type">
                  <AdminSelect name="targetType" defaultValue="provider">
                    <option value="provider">provider</option>
                    <option value="offering">offering</option>
                    <option value="category">category</option>
                    <option value="search">search</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Target ID">
                  <AdminInput name="targetId" placeholder="optional" />
                </AdminField>
                <AdminField label="Status">
                  <AdminSelect name="status" defaultValue="pending">
                    <option value="draft">draft</option>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="expired">expired</option>
                    <option value="rejected">rejected</option>
                    <option value="archived">archived</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Payment">
                  <AdminSelect name="paymentStatus" defaultValue="unpaid">
                    <option value="unpaid">unpaid</option>
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                    <option value="waived">waived</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Priority weight">
                  <AdminInput name="priorityWeight" type="number" min="0" defaultValue="100" />
                </AdminField>
                <AdminField label="Price">
                  <AdminInput name="price" type="number" min="0" step="1000" defaultValue="0" />
                </AdminField>
                <AdminField label="Start">
                  <AdminInput name="startsAt" type="datetime-local" />
                </AdminField>
                <AdminField label="End">
                  <AdminInput name="endsAt" type="datetime-local" />
                </AdminField>
                <AdminField label="Admin notes" className="md:col-span-2">
                  <AdminTextarea name="adminNotes" rows={3} />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminSubmitButton>Tạo ưu tiên</AdminSubmitButton>
                </div>
              </NativeForm>
            </DialogContent>
          </Dialog>
        </>
      }
      tableTitle="Provider Promotions"
      tableDescription="Ưu tiên provider/xưởng top đang được quản lý."
      rows={promotions}
      columns={[
        { key: "title", label: "Title" },
        { key: "provider", label: "Provider" },
        { key: "plan", label: "Plan" },
        { key: "placement", label: "Placement" },
        { key: "target_type", label: "Target" },
        { key: "status", label: "Status" },
        { key: "payment_status", label: "Payment" },
        { key: "priority_weight", label: "Weight" },
        { key: "impressions", label: "Views" },
        { key: "clicks", label: "Clicks" },
        { key: "leads", label: "Leads" },
        { key: "bookings", label: "Bookings" },
      ]}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Provider Promotion Plans</h2>
          <p className="text-sm text-muted-foreground">Gói ưu tiên dùng để tạo Sponsored Providers.</p>
        </div>
        <DatabaseTable
          rows={plans}
          columns={[
            { key: "key", label: "Key" },
            { key: "name", label: "Plan" },
            { key: "placement", label: "Placement" },
            { key: "price", label: "Price" },
            { key: "duration_days", label: "Days" },
            { key: "priority_weight", label: "Weight" },
            { key: "is_active", label: "Active" },
          ]}
        />
      </div>
    </AdminAdsPageShell>
  );
}
