import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { VENDOR_LEAD_STATUSES, listVendorLeadsForProvider } from "@/features/providers/server/leads";
import { getProviderByUserId } from "@/features/providers/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const inputClass = "h-9 rounded-md border bg-background px-3 text-sm";
const buttonClass = "inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground";

export default async function ProviderLeadsPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const leads = provider ? await listVendorLeadsForProvider(provider.id) : [];

  return (
    <ProviderPage>
      <ProviderPageHeader title="Khách hàng tiềm năng" description="Quản lý Lead → Quote → Booking tách biệt với đơn hàng ecommerce." />
      {!provider ? <ProviderEmptyState>Chưa có hồ sơ provider.</ProviderEmptyState> : null}
      {leads.map((lead) => (
        <ProviderSectionCard
          key={lead.id}
          title={lead.customer_name || "Khách hàng"}
          description={`${lead.offering_name || "Yêu cầu chung"} · ${lead.event_date || "Chưa có ngày sự kiện"}`}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-2 text-sm">
              <p>{lead.message}</p>
              <p className="text-muted-foreground">Ngân sách: {Number(lead.budget).toLocaleString("vi-VN")} VND</p>
              {lead.quote_amount ? <p className="font-medium">Báo giá gần nhất: {Number(lead.quote_amount).toLocaleString("vi-VN")} VND · {lead.quote_status}</p> : null}
            </div>
            <div className="space-y-3">
              <NativeForm action={ROUTES.API.PROVIDER.LEADS} method="POST" className="flex gap-2">
                <input type="hidden" name="intent" value="update_status" /><input type="hidden" name="leadId" value={lead.id} />
                <select name="status" defaultValue={lead.status} className={`${inputClass} min-w-0 flex-1`}>{VENDOR_LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                <button className={buttonClass}>Cập nhật</button>
              </NativeForm>
              <NativeForm action={ROUTES.API.PROVIDER.LEADS} method="POST" className="grid gap-2">
                <input type="hidden" name="intent" value="create_quote" /><input type="hidden" name="leadId" value={lead.id} />
                <Input name="amount" type="number" min="0" placeholder="Số tiền báo giá" required />
                <Input name="message" placeholder="Ghi chú báo giá" />
                <button className={buttonClass}>Gửi báo giá</button>
              </NativeForm>
            </div>
          </div>
        </ProviderSectionCard>
      ))}
      {provider && leads.length === 0 ? <ProviderEmptyState>Chưa có lead nào.</ProviderEmptyState> : null}
    </ProviderPage>
  );
}
