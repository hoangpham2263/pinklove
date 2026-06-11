import { createProviderReview } from "@/features/providers/server/marketplace";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAppUser } from "@/lib/auth";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const providerId = String(formData.get("providerId") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const content = String(formData.get("content") ?? "").trim();

  const eligible = await query<{ id: string }>(
    `
      SELECT provider.id
      FROM providers provider
      INNER JOIN booking_items item ON item.provider_id = provider.id
      INNER JOIN bookings booking ON booking.id = item.booking_id
      WHERE provider.id = $1
        AND booking.user_id = $2
        AND booking.status IN ('confirmed', 'completed')
      LIMIT 1
    `,
    [providerId, user.id]
  );

  if (!eligible.rows[0]) {
    return respondError(request, {
      status: 403,
      error: "review_not_allowed",
      message: "Bạn chỉ có thể đánh giá provider đã có booking xác nhận/hoàn tất.",
      location: ROUTES.CUSTOMER.BOOKINGS,
    });
  }

  await createProviderReview({
    providerId,
    userId: user.id,
    rating,
    content,
    status: "pending",
  });

  return respondSuccess(request, { location: ROUTES.CUSTOMER.BOOKINGS, message: "Đã gửi đánh giá." });
}
