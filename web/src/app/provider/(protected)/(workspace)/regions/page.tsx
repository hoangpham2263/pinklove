import { MapPin } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabasePage } from "@/components/common/database-table";
import { Button } from "@/components/ui/button";
import { getProviderByUserId } from "@/features/providers/server/service";
import { listAvailableRegions, listProviderRegions } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderRegionsPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listProviderRegions(provider.id) : [];
  const availableRegions = await listAvailableRegions();

  return (
    <>
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <div className="rounded-md border bg-background p-5">
          <h1 className="text-2xl font-semibold">Regions</h1>
          <NativeForm action={ROUTES.API.PROVIDER.REGIONS} method="POST" className="mt-4 grid gap-3 md:grid-cols-4">
            <select name="regionId" className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Tạo khu vực mới</option>
              {availableRegions.map((region) => <option key={String(region.id)} value={String(region.id)}>{String(region.name)}</option>)}
            </select>
            <input name="regionName" placeholder="Tên khu vực mới" className="h-9 rounded-md border bg-background px-3 text-sm" />
            <select name="serviceMode" className="h-9 rounded-md border bg-background px-3 text-sm">
              {["available", "travel", "remote", "unavailable"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <Button type="submit" size="lg">Lưu khu vực</Button>
          </NativeForm>
        </div>
      </section>
      <DatabasePage
        title="Configured regions"
        description="Khu vực phục vụ đã cấu hình cho provider."
        rows={rows}
        icon={MapPin}
        metricLabel="Regions"
        columns={[
          { key: "name", label: "Region" },
          { key: "region_type", label: "Type" },
          { key: "service_mode", label: "Service mode" },
          { key: "created_at", label: "Added" },
        ]}
      />
      <section className="mx-5 mb-7.5 rounded-md border bg-background p-5 md:mx-7.5">
        <h2 className="text-base font-semibold">Xóa khu vực</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {rows.map((row) => (
            <NativeForm key={String(row.id)} action={ROUTES.API.PROVIDER.REGIONS} method="POST">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="regionId" value={String(row.id)} />
              <Button type="submit" variant="outline" size="lg">Xóa {String(row.name)}</Button>
            </NativeForm>
          ))}
        </div>
      </section>
    </>
  );
}
