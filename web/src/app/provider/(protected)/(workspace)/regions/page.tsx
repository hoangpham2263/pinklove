import { MapPin } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabasePage } from "@/components/common/database-table";
import { ProviderDeleteButton, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderField, ProviderInput, ProviderSelect } from "@/features/provider-orders/components/provider-form";
import { ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
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
    <ProviderPage>
      <ProviderPageHeader title="Regions" description="Cấu hình khu vực phục vụ của provider." />
      <ProviderSectionCard title="Thêm hoặc cập nhật khu vực">
          <NativeForm action={ROUTES.API.PROVIDER.REGIONS} method="POST" className="grid gap-3 md:grid-cols-4">
            <ProviderField label="Khu vực">
            <ProviderSelect name="regionId">
              <option value="">Tạo khu vực mới</option>
              {availableRegions.map((region) => <option key={String(region.id)} value={String(region.id)}>{String(region.name)}</option>)}
            </ProviderSelect>
            </ProviderField>
            <ProviderField label="Tên khu vực mới">
              <ProviderInput name="regionName" placeholder="Tên khu vực mới" />
            </ProviderField>
            <ProviderField label="Service mode">
            <ProviderSelect name="serviceMode">
              {["available", "travel", "remote", "unavailable"].map((item) => <option key={item}>{item}</option>)}
            </ProviderSelect>
            </ProviderField>
            <ProviderSubmitButton type="submit" className="self-end">Lưu khu vực</ProviderSubmitButton>
          </NativeForm>
      </ProviderSectionCard>
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
              <ProviderDeleteButton type="submit">Xóa {String(row.name)}</ProviderDeleteButton>
            </NativeForm>
          ))}
        </div>
      </section>
    </ProviderPage>
  );
}
