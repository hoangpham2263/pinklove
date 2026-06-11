import { ChartNoAxesCombined } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listConversionGoals } from "@/features/admin/server/operations";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminAnalyticsGoalsPage() {
  await requireAdmin();
  const rows = await listConversionGoals();

  return (
    <>
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <div className="rounded-md border bg-background p-5">
          <h1 className="text-2xl font-semibold">Analytics Goals</h1>
          <NativeForm action={ROUTES.API.ADMIN.ANALYTICS_GOALS} method="POST" className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
            <input name="key" placeholder="goal_key" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <input name="label" placeholder="Label" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <input name="targetType" placeholder="Target type" className="h-9 rounded-md border bg-background px-3 text-sm" required />
            <label className="flex h-9 items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
            <AdminSubmitButton>Lưu</AdminSubmitButton>
          </NativeForm>
        </div>
      </section>
      <AdminDatabasePage
        title="Analytics Goals"
        description="Quản lý và theo dõi các mục tiêu conversion đang dùng trong hệ thống."
        rows={rows}
        icon={ChartNoAxesCombined}
        metricLabel="Goals"
        columns={[
          { key: "key", label: "Key" },
          { key: "label", label: "Label" },
          { key: "target_type", label: "Target type" },
          { key: "is_active", label: "Active" },
          { key: "conversions", label: "Conversions" },
          { key: "updated_at", label: "Updated" },
        ]}
      />
    </>
  );
}
