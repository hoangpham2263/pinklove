import { NativeForm } from "@/components/common/native-form";
import { ProviderDeleteButton, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderDataSection } from "@/features/provider-orders/components/provider-data-section";
import { ProviderField, ProviderInput, ProviderSelect } from "@/features/provider-orders/components/provider-form";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { getProviderByUserId } from "@/features/providers/server/service";
import { listProviderPricing } from "@/features/providers/server/workspace";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderPricingPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listProviderPricing(provider.id) : [];

  return (
    <ProviderPage>
      <ProviderPageHeader title="Pricing" description="Quản lý bảng giá provider theo offering và price type." />
      <ProviderSectionCard title="Thêm hoặc cập nhật giá">
        <NativeForm action={ROUTES.API.PROVIDER.PRICING} method="POST" className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="intent" value="save" />
          <ProviderField label="Offering ID" className="md:col-span-1">
            <ProviderInput name="offeringId" placeholder="Optional" />
          </ProviderField>
          <ProviderField label="Loại giá">
            <ProviderSelect name="priceType">
              {["base", "starting_at", "package", "hourly", "custom"].map((item) => <option key={item}>{item}</option>)}
            </ProviderSelect>
          </ProviderField>
          <ProviderField label="Số tiền">
            <ProviderInput name="amount" type="number" min="0" placeholder="Amount" required />
          </ProviderField>
          <ProviderField label="Ghi chú">
            <ProviderInput name="note" placeholder="Note" />
          </ProviderField>
          <ProviderSubmitButton type="submit" className="self-end">Lưu giá</ProviderSubmitButton>
        </NativeForm>
      </ProviderSectionCard>

      <ProviderDataSection
        title="Pricing rows"
        description="Quản lý bảng giá provider theo offering và price type."
        rows={rows}
        columns={[
          { key: "offering", label: "Offering" },
          { key: "price_type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "updated_at", label: "Updated" },
        ]}
        emptyMessage="Chưa có dòng giá."
      />

      <ProviderSectionCard title="Xóa dòng giá">
        {rows.length ? (
          <div className="flex flex-wrap gap-2">
            {rows.map((row) => (
            <NativeForm key={String(row.id)} action={ROUTES.API.PROVIDER.PRICING} method="POST">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="pricingId" value={String(row.id)} />
              <ProviderDeleteButton type="submit">Xóa {String(row.price_type)}</ProviderDeleteButton>
            </NativeForm>
            ))}
          </div>
        ) : (
          <ProviderEmptyState>Chưa có dòng giá để xóa.</ProviderEmptyState>
        )}
      </ProviderSectionCard>
    </ProviderPage>
  );
}
