import { NextResponse } from "next/server";

import { ChatError, updateChatTypingState } from "@/features/chat/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { isTyping?: boolean };

  try {
    await updateChatTypingState({
      actorUserId: user.id,
      conversationId: id,
      isTyping: Boolean(body.isTyping),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ChatError) {
      const status = error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: error.code, message: error.message }, { status });
    }
    throw error;
  }
}
