import { saveRsvp } from "@/features/wedding-planning/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const weddingSiteId = String(formData.get("weddingSiteId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? ROUTES.HOME).trim() || ROUTES.HOME;
  const attendeeName = String(formData.get("attendeeName") ?? "").trim();

  if (!weddingSiteId || !attendeeName) {
    return respondError(request, {
      error: "rsvp_invalid",
      message: "Vui lòng nhập tên để gửi RSVP.",
      location: returnTo,
    });
  }

  const site = await query<{ id: string }>(
    "SELECT id FROM wedding_sites WHERE id = $1 AND status = 'published' LIMIT 1",
    [weddingSiteId]
  );
  if (!site.rows[0]) {
    return respondError(request, {
      status: 404,
      error: "site_not_found",
      message: "Không tìm thấy wedding site.",
      location: returnTo,
    });
  }

  await saveRsvp({
    weddingSiteId,
    attendeeName,
    attendeeCount: Number(formData.get("attendeeCount") ?? 1),
    responseStatus: String(formData.get("responseStatus") ?? "accepted"),
    mealChoice: String(formData.get("mealChoice") ?? "").trim(),
    specialRequests: String(formData.get("specialRequests") ?? "").trim(),
  });

  return respondSuccess(request, { location: `${returnTo}#rsvp`, message: "Đã gửi RSVP." });
}
