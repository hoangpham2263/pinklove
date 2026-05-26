import { NextResponse } from "next/server";

import { dismissAllNotificationsForUser, dismissNotificationForUser } from "@/features/notifications/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { all?: boolean; notificationId?: string };
  if (body.all) {
    await dismissAllNotificationsForUser(user.id, user.role);
    return NextResponse.json({ ok: true });
  }

  const notificationId = body.notificationId?.trim();

  if (!notificationId) {
    return NextResponse.json({ error: "missing_notification_id" }, { status: 400 });
  }

  await dismissNotificationForUser(user.id, notificationId);
  return NextResponse.json({ ok: true });
}
