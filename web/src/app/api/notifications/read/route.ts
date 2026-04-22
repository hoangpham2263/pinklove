import { NextResponse } from "next/server";

import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { notificationId?: string; all?: boolean };

  if (body.all) {
    await markAllNotificationsRead(user.id, user.role);
    return NextResponse.json({ ok: true });
  }

  if (!body.notificationId) {
    return NextResponse.json({ error: "missing_notification_id" }, { status: 400 });
  }

  await markNotificationRead(user.id, body.notificationId);
  return NextResponse.json({ ok: true });
}
