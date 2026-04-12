import { NextResponse } from "next/server";

import { createVendorPortalRealtimeStream } from "@/features/vendor-orders/realtime";
import { getCurrentUserFromRequest, isVendorRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isVendorRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return new Response(createVendorPortalRealtimeStream(user.id), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
