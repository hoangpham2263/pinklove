import { NextResponse } from "next/server";

import { listPublicNotifications, publishDueScheduledNotifications } from "@/features/notifications/server/service";

export const runtime = "nodejs";

export async function GET() {
  await publishDueScheduledNotifications();
  const notifications = await listPublicNotifications(20);
  return NextResponse.json({ notifications });
}
