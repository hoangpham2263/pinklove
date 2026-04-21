import { NextResponse } from "next/server";

import { createChatConversationRealtimeStream, getChatConversationRealtimeState } from "@/features/chat/realtime";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const state = await getChatConversationRealtimeState(user.id, id);
  if (!state) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new Response(createChatConversationRealtimeStream(user.id, id), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
