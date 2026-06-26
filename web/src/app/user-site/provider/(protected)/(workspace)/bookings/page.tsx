import { CalendarClock, CheckCircle2, Clock3, ClipboardList } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { ProviderDataSection } from "@/features/provider-orders/components/provider-data-section";
import { ProviderInput, ProviderSelect } from "@/features/provider-orders/components/provider-form";
import { ProviderOverviewCard, ProviderOverviewGrid } from "@/features/provider-orders/components/provider-overview-card";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { listBookingsForProvider } from "@/features/bookings/server/service";
import { getProviderByUserId } from "@/features/providers/server/service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderBookingsPage() {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const rows = provider ? await listBookingsForProvider(provider.id) : [];
  const requestedCount = rows.filter((row) => row.status === "requested").length;
  const confirmedCount = rows.filter((row) => row.status === "confirmed").length;
  const completedCount = rows.filter((row) => row.status === "completed").length;

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Bookings"
        description="Theo dõi các yêu cầu đặt dịch vụ, slot lịch khách đã giữ và trạng thái xử lý của provider."
      />

      <ProviderOverviewGrid>
        <ProviderOverviewCard title="Tổng booking" value={rows.length} icon={ClipboardList} />
        <ProviderOverviewCard title="Chờ xử lý" value={requestedCount} icon={Clock3} />
        <ProviderOverviewCard title="Đã xác nhận" value={confirmedCount} icon={CalendarClock} />
        <ProviderOverviewCard title="Hoàn tất" value={completedCount} icon={CheckCircle2} />
      </ProviderOverviewGrid>

      {!provider ? <ProviderEmptyState>Chưa có hồ sơ provider.</ProviderEmptyState> : null}

      <ProviderDataSection
        title="Danh sách booking"
        description="Booking dịch vụ được gán cho provider."
        rows={rows}
        columns={[
          { key: "booking_number", label: "Booking" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "latest_payment_status", label: "Payment" },
          { key: "scheduled_at", label: "Scheduled" },
          { key: "total_amount", label: "Total" },
          { key: "latest_status_note", label: "Latest update" },
        ]}
        emptyMessage="Chưa có booking."
      />

      <ProviderSectionCard title="Cập nhật trạng thái" description="Ghi chú sẽ được lưu vào log booking.">
        <div className="grid gap-3">
          {rows.length ? rows.map((row) => (
            <NativeForm key={row.id} action={ROUTES.API.PROVIDER.BOOKINGS_STATUS} method="POST" className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(12rem,1fr)_12rem_minmax(14rem,1.2fr)_auto] md:items-center">
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
          )) : (
            <ProviderEmptyState>Chưa có booking để cập nhật.</ProviderEmptyState>
          )}
        </div>
      </ProviderSectionCard>
    </ProviderPage>
  );
}
