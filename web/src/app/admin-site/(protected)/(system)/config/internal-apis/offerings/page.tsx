import { InternalOfferingImportApiForm } from "@/features/admin/components/settings/internal-offering-import-api-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminInternalOfferingApiPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">API import sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý endpoint import/upsert sản phẩm dùng cho các kết nối nội bộ. Từ đây có thể bật tắt API, đổi token và giới hạn loại sản phẩm được phép import.
        </p>
      </div>
      <InternalOfferingImportApiForm settings={settings.internalApis.offeringsImport} />
    </section>
  );
}
