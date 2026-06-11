import {
  providerCanAccessBooking,
  updateBookingStatus,
  type BookingStatus,
} from "@/features/bookings/server/service";
import { getProviderByUserId } from "@/features/providers/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const VALID_STATUSES: BookingStatus[] = ["requested", "confirmed", "completed", "cancelled"];

export async function POST(request: Request) {
  const user = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(user.id);
  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as BookingStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!provider || !bookingId || !VALID_STATUSES.includes(status)) {
    return respondError(request, {
      error: "invalid_booking_status",
      message: "Trạng thái booking không hợp lệ.",
      location: ROUTES.PROVIDER.BOOKINGS,
    });
  }

  if (!(await providerCanAccessBooking(provider.id, bookingId))) {
    return respondError(request, {
      status: 403,
      error: "booking_forbidden",
      message: "Booking không thuộc provider này.",
      location: ROUTES.PROVIDER.BOOKINGS,
    });
  }

  await updateBookingStatus({ bookingId, nextStatus: status, actorUserId: user.id, note });
  return respondSuccess(request, { location: ROUTES.PROVIDER.BOOKINGS, message: "Đã cập nhật booking." });
}
