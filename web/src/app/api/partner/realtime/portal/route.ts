import { NextResponse } from "next/server";

import { createProviderPortalRealtimeStream } from "@/features/provider-orders/realtime";
import { getCurrentUserFromRequest, isProviderRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isProviderRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return new Response(createProviderPortalRealtimeStream(user.id), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
