import { CalendarClock, CheckCircle2, Clock3, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeForm } from "@/components/common/native-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminInput, AdminSelect } from "@/features/admin/components/admin-form";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { type BookingListRow, listBookingsForAdmin } from "@/features/bookings/server/service";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const BOOKING_STATUSES: BookingListRow["status"][] = ["draft", "requested", "confirmed", "completed", "cancelled"];

function formatDateTime(value: string | null) {
  if (!value) return "Chưa lên lịch";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClassName(status: string) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "confirmed") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "requested") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-border bg-background text-foreground";
}

export default async function AdminBookingsPage() {
  await requireAdmin();
  const [rows, settings] = await Promise.all([listBookingsForAdmin(), getSystemSettings()]);
  const requestedCount = rows.filter((row) => row.status === "requested").length;
  const confirmedCount = rows.filter((row) => row.status === "confirmed").length;
  const completedCount = rows.filter((row) => row.status === "completed").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="rounded-md border bg-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-foreground">
          Giám sát yêu cầu đặt dịch vụ, provider liên quan, lịch hẹn, thanh toán và log trạng thái mới nhất.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng booking" value={rows.length} icon={ClipboardList} />
        <AdminOverviewCard title="Chờ xử lý" value={requestedCount} icon={Clock3} />
        <AdminOverviewCard title="Đã xác nhận" value={confirmedCount} icon={CalendarClock} />
        <AdminOverviewCard title="Hoàn tất" value={completedCount} icon={CheckCircle2} />
      </AdminOverviewGrid>

      <section className="rounded-md border bg-background">
        <div className="border-b p-5">
          <h2 className="text-base font-semibold">Danh sách booking</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Latest log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-40 font-medium">{row.booking_number}</TableCell>
                    <TableCell className="min-w-40">{row.customer}</TableCell>
                    <TableCell className="min-w-48">{row.providers || "Chưa gán provider"}</TableCell>
                    <TableCell>
                      <Badge className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusClassName(row.status)}`}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.latest_payment_status || "Chưa thanh toán"}</TableCell>
                    <TableCell className="min-w-44">{formatDateTime(row.scheduled_at)}</TableCell>
                    <TableCell className="min-w-32 font-medium">{formatCurrency(row.total_amount, settings.ecommerce)}</TableCell>
                    <TableCell>{row.item_count}</TableCell>
                    <TableCell className="min-w-56">
                      <span>{row.latest_status_note || "Chưa có log"}</span>
                      <span className="block text-xs text-foreground">{formatDateTime(row.latest_status_at)}</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Chưa có booking.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="rounded-md border bg-background p-5">
        <div>
          <h2 className="text-base font-semibold">Cập nhật trạng thái booking</h2>
          <p className="mt-1 text-sm text-foreground">Chọn trạng thái mới và ghi chú nội bộ để lưu vào log booking.</p>
        </div>
        <div className="mt-4 grid gap-3">
          {rows.length ? rows.map((row) => (
            <NativeForm
              key={row.id}
              action={ROUTES.API.ADMIN.BOOKINGS.STATUS}
              method="POST"
              className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(12rem,1fr)_12rem_minmax(14rem,1.2fr)_auto] md:items-center"
            >
              <input type="hidden" name="bookingId" value={row.id} />
              <div className="text-sm">
                <p className="font-medium">{row.booking_number}</p>
                <p className="text-foreground">{row.customer} · {row.status}</p>
              </div>
              <AdminSelect name="status" defaultValue={row.status} className="h-9 rounded-md text-sm">
                {BOOKING_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </AdminSelect>
              <AdminInput name="note" placeholder="Ghi chú log" className="h-9 text-sm" />
              <AdminSubmitButton>Lưu</AdminSubmitButton>
            </NativeForm>
          )) : (
            <p className="rounded-md border p-4 text-sm">Chưa có booking để cập nhật.</p>
          )}
        </div>
      </section>
    </section>
  );
}
