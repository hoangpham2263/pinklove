import { NextResponse } from "next/server";

import { createProviderAssignmentRealtimeStreamForProvider } from "@/features/provider-orders/realtime";
import { getProviderOrderDetailForProvider } from "@/features/provider-orders/server/service";
import { getCurrentUserFromRequest, isProviderRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isProviderRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getProviderOrderDetailForProvider(user.id, id);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new Response(createProviderAssignmentRealtimeStreamForProvider(user.id, id), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
