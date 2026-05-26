import {
  deleteProviderAvailabilityRule,
  ensureBookingCalendar,
  getProviderAvailabilityServiceScope,
  saveProviderAvailability,
  updateProviderAvailabilityRule,
} from "@/features/providers/server/availability";
import {
  PROVIDER_AVAILABILITY_KIND_VALUES,
  type ProviderAvailabilityKind,
} from "@/features/providers/config/availability";
import { getProviderByUserId } from "@/features/providers/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

const AVAILABILITY_KINDS = new Set<ProviderAvailabilityKind>(PROVIDER_AVAILABILITY_KIND_VALUES);
const AVAILABILITY_STATUSES = new Set(["available", "unavailable", "blocked"]);

function parsePositiveInteger(value: FormDataEntryValue | null, fallback: number) {
  const numberValue = Number(value ?? fallback);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(1, Math.trunc(numberValue));
}

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
    if (!ruleId) {
      return respondError(request, {
        error: "invalid_rule_id",
        message: "Không tìm thấy khung lịch để xóa.",
        location: ROUTES.PROVIDER.AVAILABILITY,
      });
    }
    const deleted = await deleteProviderAvailabilityRule(provider.id, ruleId);
    if (!deleted) {
      return respondError(request, {
        error: "rule_not_found",
        message: "Khung lịch không tồn tại hoặc không thuộc provider này.",
        location: ROUTES.PROVIDER.AVAILABILITY,
      });
    }
    return respondSuccess(request, {
      location: ROUTES.PROVIDER.AVAILABILITY,
      message: "Đã xóa khung lịch.",
    });
  }

  if (intent !== "save" && intent !== "update") {
    return respondError(request, {
      error: "invalid_intent",
      message: "Tác vụ lịch không hợp lệ.",
      location: ROUTES.PROVIDER.AVAILABILITY,
    });
  }

  const dayOfWeek = Number(formData.get("dayOfWeek") ?? "0");
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const capacity = parsePositiveInteger(formData.get("capacity"), 1);
  const rawStatus = String(formData.get("status") ?? "available");
  const status = (AVAILABILITY_STATUSES.has(rawStatus) ? rawStatus : "available") as "available" | "unavailable" | "blocked";
  const providerServiceId = String(formData.get("providerServiceId") ?? "").trim();
  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const rawAvailabilityKind = String(formData.get("availabilityKind") ?? "general").trim() as ProviderAvailabilityKind;
  const availabilityKind = AVAILABILITY_KINDS.has(rawAvailabilityKind) ? rawAvailabilityKind : "general";

  if (!providerServiceId && !offeringId) {
    return respondError(request, {
      error: "service_required",
      message: "Vui lòng yêu cầu hoặc chọn dịch vụ trước khi khai báo lịch.",
      location: ROUTES.PROVIDER.AVAILABILITY,
    });
  }

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !startsAt || !endsAt || startsAt >= endsAt) {
    return respondError(request, {
      error: "invalid_availability",
      message: "Khung giờ không hợp lệ.",
      location: ROUTES.PROVIDER.AVAILABILITY,
    });
  }

  const serviceScope = await getProviderAvailabilityServiceScope({
    providerId: provider.id,
    providerServiceId: providerServiceId || undefined,
    offeringId: offeringId || undefined,
  });

  if (!serviceScope) {
    return respondError(request, {
      error: "invalid_service_scope",
      message: "Dịch vụ được chọn không thuộc provider này.",
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

    const updated = await updateProviderAvailabilityRule({
      providerId: provider.id,
      ruleId,
      providerServiceId: serviceScope.providerServiceId,
      offeringId: serviceScope.offeringId,
      availabilityKind,
      dayOfWeek,
      startsAt,
      endsAt,
      durationMinutes: serviceScope.durationMinutes,
      capacity,
      status,
    });

    if (!updated) {
      return respondError(request, {
        error: "rule_not_found",
        message: "Khung lịch không tồn tại hoặc không thuộc provider này.",
        location: ROUTES.PROVIDER.AVAILABILITY,
      });
    }

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
    providerServiceId: serviceScope.providerServiceId ?? undefined,
    offeringId: serviceScope.offeringId ?? undefined,
    availabilityKind,
    dayOfWeek,
    startsAt,
    endsAt,
    durationMinutes: serviceScope.durationMinutes,
    capacity,
    status,
  });

  return respondSuccess(request, {
    location: ROUTES.PROVIDER.AVAILABILITY,
    message: "Đã lưu lịch khả dụng.",
  });
}
