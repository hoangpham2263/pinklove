import { NextResponse } from "next/server";

import { addChatParticipants, ChatError } from "@/features/chat/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { participantUserIds?: string[] };

  try {
    await addChatParticipants({
      actorUserId: user.id,
      actorRole: user.role,
      conversationId: id,
      participantUserIds: Array.isArray(body.participantUserIds) ? body.participantUserIds : [],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ChatError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.code, message: error.message }, { status });
    }

    throw error;
  }
}
