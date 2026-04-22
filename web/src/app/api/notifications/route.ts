import { NextResponse } from "next/server";

import {
  getNotificationSummaryForUser,
  listNotificationsForUser,
  publishDueScheduledNotifications,
} from "@/features/notifications/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await publishDueScheduledNotifications();

  const [notifications, summary] = await Promise.all([
    listNotificationsForUser(user.id, user.role),
    getNotificationSummaryForUser(user.id, user.role),
  ]);

  return NextResponse.json({ notifications, summary });
}
