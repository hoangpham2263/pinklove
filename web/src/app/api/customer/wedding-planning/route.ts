import {
  WEDDING_TASK_CATEGORIES,
  WEDDING_TASK_STATUSES,
  WEDDING_TIMELINE_TYPES,
  assertWeddingSiteOwnership,
  assignGuestToTable,
  createGuestGroup,
  createWeddingGuest,
  createWeddingTable,
  createWeddingTask,
  createWeddingTimelineItem,
  saveRsvp,
  updateWeddingProject,
} from "@/features/wedding-planning/server/service";
import { respondError, respondSuccess } from "@/lib/action-response";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function POST(request: Request) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const formData = await request.formData();
  const intent = text(formData, "intent");
  const weddingSiteId = text(formData, "weddingSiteId");
  const location = `${ROUTES.CUSTOMER.WEDDING_PLANNING}?site=${encodeURIComponent(weddingSiteId)}`;

  if (!weddingSiteId || !(await assertWeddingSiteOwnership(user.id, weddingSiteId))) {
    return respondError(request, {
      error: "wedding_site_not_found",
      message: "Wedding site không tồn tại hoặc không thuộc tài khoản này.",
      location: ROUTES.CUSTOMER.WEDDING_PLANNING,
    });
  }

  if (intent === "update_project") {
    await updateWeddingProject({
      userId: user.id,
      weddingSiteId,
      projectStatus: text(formData, "projectStatus") || "active",
      budget: Number(formData.get("budget") ?? 0),
      eventDate: text(formData, "eventDate") || null,
      guestTarget: Number(formData.get("guestTarget") ?? 0),
    });
  } else if (intent === "create_group") {
    const name = text(formData, "name");
    if (!name) return respondError(request, { error: "name_required", message: "Tên nhóm là bắt buộc.", location });
    await createGuestGroup({ weddingSiteId, name });
  } else if (intent === "create_guest") {
    const fullName = text(formData, "fullName");
    if (!fullName) return respondError(request, { error: "name_required", message: "Tên khách mời là bắt buộc.", location });
    await createWeddingGuest({
      weddingSiteId,
      fullName,
      phone: text(formData, "phone"),
      email: text(formData, "email"),
      guestGroupId: text(formData, "guestGroupId") || null,
      note: text(formData, "note"),
    });
  } else if (intent === "save_rsvp") {
    await saveRsvp({
      weddingSiteId,
      guestId: text(formData, "guestId") || null,
      attendeeName: text(formData, "attendeeName"),
      attendeeCount: Number(formData.get("attendeeCount") ?? 1),
      responseStatus: text(formData, "responseStatus") || "pending",
      mealChoice: text(formData, "mealChoice"),
      specialRequests: text(formData, "specialRequests"),
      userId: user.id,
    });
  } else if (intent === "create_table") {
    await createWeddingTable({
      weddingSiteId,
      name: text(formData, "name"),
      capacity: Number(formData.get("capacity") ?? 0),
      notes: text(formData, "notes"),
    });
  } else if (intent === "assign_guest") {
    await assignGuestToTable({
      weddingSiteId,
      tableId: text(formData, "tableId"),
      guestId: text(formData, "guestId"),
      seatNumber: text(formData, "seatNumber"),
    });
  } else if (intent === "create_task") {
    const category = text(formData, "category");
    const status = text(formData, "status");
    await createWeddingTask({
      weddingSiteId,
      title: text(formData, "title"),
      description: text(formData, "description"),
      category: WEDDING_TASK_CATEGORIES.includes(category as never) ? category : "other",
      status: WEDDING_TASK_STATUSES.includes(status as never) ? status : "pending",
      priority: text(formData, "priority") || "normal",
      dueDate: text(formData, "dueDate") || null,
    });
  } else if (intent === "create_timeline") {
    const timelineType = text(formData, "timelineType");
    await createWeddingTimelineItem({
      weddingSiteId,
      title: text(formData, "title"),
      startsAt: text(formData, "startsAt") || null,
      endsAt: text(formData, "endsAt") || null,
      timelineType: WEDDING_TIMELINE_TYPES.includes(timelineType as never) ? timelineType : "custom",
      notes: text(formData, "notes"),
    });
  } else {
    return respondError(request, { error: "invalid_intent", message: "Tác vụ không hợp lệ.", location });
  }

  return respondSuccess(request, { location, message: "Đã cập nhật kế hoạch cưới." });
}
