import { deleteProviderAvailabilityRule, ensureBookingCalendar, saveProviderAvailability, updateProviderAvailabilityRule } from "@/features/providers/server/availability";
import { getProviderByUserId } from "@/features/providers/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const providerUser = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const provider = await getProviderByUserId(providerUser.id);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");

  if (!provider) {
    return respondError(request, {
      error: "provider_profile_missing",
      message: "Chưa có hồ sơ provider để lưu lịch.",
      location: ROUTES.PROVIDER.AVAILABILITY,
    });
  }

  if (intent === "delete") {
    const ruleId = String(formData.get("ruleId") ?? "").trim();
    if (ruleId) {
      await deleteProviderAvailabilityRule(provider.id, ruleId);
    }
    return respondSuccess(request, {
      location: ROUTES.PROVIDER.AVAILABILITY,
      message: "Đã xóa khung lịch.",
    });
  }

  const dayOfWeek = Number(formData.get("dayOfWeek") ?? "0");
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const capacity = Math.max(1, Number(formData.get("capacity") ?? "1"));
  const status = String(formData.get("status") ?? "available") as "available" | "unavailable" | "blocked";

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !startsAt || !endsAt || startsAt >= endsAt) {
    return respondError(request, {
      error: "invalid_availability",
      message: "Khung giờ không hợp lệ.",
      location: ROUTES.PROVIDER.AVAILABILITY,
    });
  }

  if (intent === "update") {
    const ruleId = String(formData.get("ruleId") ?? "").trim();
    if (!ruleId) {
      return respondError(request, {
        error: "invalid_rule_id",
        message: "Không tìm thấy khung lịch để cập nhật.",
        location: ROUTES.PROVIDER.AVAILABILITY,
      });
    }

    await updateProviderAvailabilityRule({
      providerId: provider.id,
      ruleId,
      dayOfWeek,
      startsAt,
      endsAt,
      capacity,
      status,
    });

    return respondSuccess(request, {
      location: ROUTES.PROVIDER.AVAILABILITY,
      message: "Đã cập nhật lịch khả dụng.",
    });
  }

  const calendarId = await ensureBookingCalendar({
    providerId: provider.id,
    name: `${provider.provider_type} schedule`,
  });

  await saveProviderAvailability({
    providerId: provider.id,
    calendarId,
    dayOfWeek,
    startsAt,
    endsAt,
    capacity,
    status,
  });

  return respondSuccess(request, {
    location: ROUTES.PROVIDER.AVAILABILITY,
    message: "Đã lưu lịch khả dụng.",
  });
}
