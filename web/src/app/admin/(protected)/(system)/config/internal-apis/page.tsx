import { CheckCircle2, Code2, FileCode2 } from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const INTERNAL_API_SECTIONS = [
  {
    title: "Import & Đồng bộ",
    icon: "settings" as const,
    items: [
      {
        title: "API import sản phẩm",
        description: "Quản lý endpoint, token và phạm vi import sản phẩm từ hệ thống nội bộ hoặc bên thứ ba.",
        href: ROUTES.ADMIN.CONFIG_INTERNAL_API_OFFERINGS,
      },
    ],
  },
] as const;

export default async function AdminInternalApisPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API nội bộ</h1>
          <p className="text-muted-foreground">Khu quản lý tập trung cho các API nội bộ dùng để import và đồng bộ dữ liệu.</p>
        </div>
      </div>

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng API" value={1} icon={FileCode2} />
        <AdminOverviewCard title="API đang bật" value={settings.internalApis.offeringsImport.enabled ? 1 : 0} icon={CheckCircle2} />
        <AdminOverviewCard title="API đầu tiên" description="Hiện tại đang cấu hình trước cho import sản phẩm." icon={Code2} />
      </AdminOverviewGrid>

      <ConfigSectionsHub sections={[...INTERNAL_API_SECTIONS]} />
    </section>
  );
}
