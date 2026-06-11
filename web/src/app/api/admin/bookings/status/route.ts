import { updateBookingStatus, type BookingStatus } from "@/features/bookings/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const VALID_STATUSES: BookingStatus[] = ["draft", "requested", "confirmed", "completed", "cancelled"];

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as BookingStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!bookingId || !VALID_STATUSES.includes(status)) {
    return respondError(request, {
      error: "invalid_booking_status",
      message: "Trạng thái booking không hợp lệ.",
      location: ROUTES.ADMIN.BOOKINGS,
    });
  }

  await updateBookingStatus({ bookingId, nextStatus: status, actorUserId: admin.id, note });
  return respondSuccess(request, { location: ROUTES.ADMIN.BOOKINGS, message: "Đã cập nhật booking." });
}
