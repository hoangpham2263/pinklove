import { CalendarClock } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { DatabasePage } from "@/components/common/database-table";
import { ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderInput, ProviderSelect } from "@/features/provider-orders/components/provider-form";
import { listBookingsForProvider } from "@/features/bookings/server/service";
import { getProviderByUserId } from "@/features/providers/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderBookingsPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listBookingsForProvider(provider.id) : [];

  return (
    <>
      <DatabasePage
        title="Bookings"
        description="Theo dõi các yêu cầu đặt dịch vụ có gắn với provider của bạn."
        rows={rows}
        icon={CalendarClock}
        metricLabel="Bookings"
        columns={[
          { key: "booking_number", label: "Booking" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "latest_payment_status", label: "Payment" },
          { key: "scheduled_at", label: "Scheduled" },
          { key: "total_amount", label: "Total" },
          { key: "latest_status_note", label: "Latest update" },
        ]}
      />
      <section className="mx-5 mb-7.5 rounded-md border bg-background p-5 md:mx-7.5">
        <h2 className="text-base font-semibold">Cập nhật trạng thái</h2>
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <NativeForm key={row.id} action={ROUTES.API.PROVIDER.BOOKINGS_STATUS} method="POST" className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_11rem_1fr_auto]">
              <input type="hidden" name="bookingId" value={row.id} />
              <div className="text-sm">
                <p className="font-medium">{row.booking_number}</p>
                <p className="text-muted-foreground">{row.customer} · {row.status}</p>
              </div>
              <ProviderSelect name="status" defaultValue={row.status}>
                {["requested", "confirmed", "completed", "cancelled"].map((status) => <option key={status}>{status}</option>)}
              </ProviderSelect>
              <ProviderInput name="note" placeholder="Ghi chú cho khách/Admin" />
              <ProviderSubmitButton type="submit">Lưu</ProviderSubmitButton>
            </NativeForm>
          ))}
        </div>
      </section>
    </>
  );
}
