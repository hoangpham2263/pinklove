import { NextResponse } from "next/server";

import { createVendorAssignmentRealtimeStreamForVendor } from "@/features/vendor-orders/realtime";
import { getVendorOrderDetailForVendor } from "@/features/vendor-orders/server/service";
import { getCurrentUserFromRequest, isVendorRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isVendorRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getVendorOrderDetailForVendor(user.id, id);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new Response(createVendorAssignmentRealtimeStreamForVendor(user.id, id), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
