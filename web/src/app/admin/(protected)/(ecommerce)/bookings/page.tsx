import { CalendarClock } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminDatabasePage } from "@/features/admin/components/admin-database-page";
import { listBookingsForAdmin } from "@/features/bookings/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const rows = await listBookingsForAdmin();

  return (
    <>
      <AdminDatabasePage
        title="Bookings"
        description="Giám sát yêu cầu đặt dịch vụ, provider liên quan, trạng thái thanh toán và log trạng thái mới nhất."
        rows={rows}
        icon={CalendarClock}
        metricLabel="Bookings"
        columns={[
          { key: "booking_number", label: "Booking" },
          { key: "customer", label: "Customer" },
          { key: "providers", label: "Providers" },
          { key: "status", label: "Status" },
          { key: "latest_payment_status", label: "Payment" },
          { key: "scheduled_at", label: "Scheduled" },
          { key: "total_amount", label: "Total" },
          { key: "item_count", label: "Items" },
          { key: "latest_status_note", label: "Latest log" },
          { key: "latest_status_at", label: "Log time" },
        ]}
      />
      <section className="mx-5 mb-7.5 rounded-md border bg-background p-5 md:mx-7.5">
        <h2 className="text-base font-semibold">Cập nhật trạng thái booking</h2>
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <NativeForm key={row.id} action={ROUTES.API.ADMIN.BOOKINGS.STATUS} method="POST" className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_11rem_1fr_auto]">
              <input type="hidden" name="bookingId" value={row.id} />
              <div className="text-sm">
                <p className="font-medium">{row.booking_number}</p>
                <p className="text-muted-foreground">{row.customer} · {row.status}</p>
              </div>
              <select name="status" defaultValue={row.status} className="h-9 rounded-md border bg-background px-3 text-sm">
                {["draft", "requested", "confirmed", "completed", "cancelled"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <input name="note" placeholder="Ghi chú log" className="h-9 rounded-md border bg-background px-3 text-sm" />
              <AdminSubmitButton>Lưu</AdminSubmitButton>
            </NativeForm>
          ))}
        </div>
      </section>
    </>
  );
}
