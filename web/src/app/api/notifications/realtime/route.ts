import { NextResponse } from "next/server";

import { createNotificationRealtimeStream } from "@/features/notifications/realtime";
import { publishDueScheduledNotifications } from "@/features/notifications/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await publishDueScheduledNotifications();

  return new Response(createNotificationRealtimeStream(user.id, user.role), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
