import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSubmitButton } from "@/features/customer/ui/customer-buttons";
import { CustomerField, CustomerInput, CustomerSelect, CustomerTextarea } from "@/features/customer/ui/customer-form";
import { listVendorLeadsForUser, listVendorLeadTargets } from "@/features/providers/server/leads";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerVendorLeadsPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [leads, targets] = await Promise.all([listVendorLeadsForUser(user.id), listVendorLeadTargets()]);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Yêu cầu nhà cung cấp</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gửi yêu cầu, nhận báo giá và chuyển báo giá được chấp nhận thành booking.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tạo yêu cầu</CardTitle></CardHeader>
        <CardContent>
          <NativeForm action={ROUTES.API.CUSTOMER.VENDOR_LEADS} method="POST" className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="intent" value="create_lead" />
            <CustomerField label="Nhà cung cấp hoặc dịch vụ">
            <CustomerSelect name="target" required>
              <option value="">Chọn nhà cung cấp hoặc dịch vụ</option>
              {targets.map((target) => (
                <option
                  key={`${target.provider_id}:${target.offering_id ?? "general"}`}
                  value={`${target.provider_id}|${target.offering_id ?? ""}`}
                >
                  {target.provider_name}{target.offering_name ? ` - ${target.offering_name}` : " - Yêu cầu chung"}
                </option>
              ))}
            </CustomerSelect>
            </CustomerField>
            <CustomerField label="Ngân sách dự kiến">
              <CustomerInput name="budget" type="number" min="0" placeholder="Ngân sách dự kiến" />
            </CustomerField>
            <CustomerField label="Ngày sự kiện">
              <CustomerInput name="eventDate" type="date" />
            </CustomerField>
            <div />
            <CustomerField label="Mô tả nhu cầu" className="md:col-span-2">
              <CustomerTextarea name="message" required className="min-h-24" placeholder="Mô tả nhu cầu" />
            </CustomerField>
            <div className="md:col-span-2"><CustomerSubmitButton>Gửi yêu cầu</CustomerSubmitButton></div>
          </NativeForm>
        </CardContent>
      </Card>

      <div className="divide-y rounded-md border bg-background">
        {leads.map((lead) => (
          <div key={lead.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{lead.provider_name}</p>
                <span className="rounded-md border px-2 py-0.5 text-xs">{lead.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{lead.offering_name || "Yêu cầu chung"} · {lead.message}</p>
              {lead.quote_amount ? <p className="mt-2 text-sm font-medium">Báo giá: {Number(lead.quote_amount).toLocaleString("vi-VN")} VND · {lead.quote_status}</p> : null}
            </div>
            {lead.quote_status === "sent" ? (
              <NativeForm action={ROUTES.API.CUSTOMER.VENDOR_LEADS} method="POST">
                <input type="hidden" name="intent" value="accept_quote" /><input type="hidden" name="leadId" value={lead.id} />
                <CustomerSubmitButton>Chấp nhận báo giá</CustomerSubmitButton>
              </NativeForm>
            ) : null}
          </div>
        ))}
        {leads.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Chưa có yêu cầu nào.</p> : null}
      </div>
    </section>
  );
}
