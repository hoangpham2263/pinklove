import { NextResponse } from "next/server";

import { getVendorAssignmentRealtimeState, createVendorAssignmentRealtimeStream } from "@/features/vendor-orders/realtime";
import { getCurrentUserFromRequest, isAdminRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const state = await getVendorAssignmentRealtimeState(id);
  if (!state) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new Response(createVendorAssignmentRealtimeStream(id), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
