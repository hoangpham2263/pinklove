import { EcommerceSettingsForm } from "@/features/ecommerce/admin/ecommerce-settings-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminEcommerceConnectionsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Ecommerce</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý checkout, thanh toán mô phỏng, chuyển khoản và cấu hình vận chuyển dùng chung cho toàn hệ thống.
        </p>
      </div>
      <EcommerceSettingsForm settings={settings} />
    </section>
  );
}
