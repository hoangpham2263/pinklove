import { createBooking } from "@/features/bookings/server/service";
import { getOfferingById } from "@/features/offerings/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  const formData = await request.formData();
  const returnTo = String(formData.get("returnTo") ?? ROUTES.CUSTOMER.ORDERS).trim() || ROUTES.CUSTOMER.ORDERS;

  if (!user) {
    return respondError(request, {
      status: 401,
      error: "unauthorized",
      message: "Please login first.",
      location: `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(returnTo)}`,
    });
  }

  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const providerId = String(formData.get("providerId") ?? "").trim();
  const providerType = String(formData.get("providerType") ?? "").trim();
  const providerTimeSlotId = String(formData.get("providerTimeSlotId") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const quantity = Math.max(1, Number(formData.get("quantity") ?? "1"));

  if (!offeringId) {
    return respondError(request, {
      error: "missing_offering",
      message: "Thiếu dịch vụ để tạo booking.",
      location: returnTo,
    });
  }

  const offering = await getOfferingById(offeringId);
  if (!offering || offering.status !== "published") {
    return respondError(request, {
      error: "offering_not_found",
      message: "Không tìm thấy dịch vụ khả dụng.",
      location: returnTo,
    });
  }

  const booking = await createBooking({
    userId: user.id,
    scheduledAt: scheduledAt || null,
    providerTimeSlotId: providerTimeSlotId || null,
    actorUserId: user.id,
    items: [
      {
        offeringId: offering.id,
        providerId: providerId || offering.ownerProviderId || null,
        providerType: providerType || offering.ownerProviderType || null,
        title: offering.name,
        quantity,
        unitPrice: offering.price,
        metadata: {
          offeringSlug: offering.slug,
          fulfillmentType: offering.fulfillmentType,
        },
      },
    ],
    metadata: {
      source: "customer_booking_create_api",
      returnTo,
    },
  });

  return respondSuccess(request, {
    location: returnTo,
    message: "Đã tạo yêu cầu booking.",
    data: {
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      status: booking.status,
    },
  });
}
