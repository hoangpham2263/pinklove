import { NextResponse } from "next/server";

import {
  buildChatViewerContext,
  getChatConversationDetailForViewer,
  ChatError,
  updateChatConversationMeta,
  updateChatConversationUserState,
} from "@/features/chat/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getChatConversationDetailForViewer(user.id, id, await buildChatViewerContext(user.role));
  if (!conversation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    ownerUserId?: string;
    status?: string;
    tags?: string[];
    isPinned?: boolean;
    userPriority?: string;
    isHidden?: boolean;
    markUnread?: boolean;
  };

  try {
    const hasUserStatePayload =
      typeof body.isPinned === "boolean" ||
      typeof body.isHidden === "boolean" ||
      typeof body.markUnread === "boolean" ||
      typeof body.userPriority === "string";

    if (hasUserStatePayload) {
      await updateChatConversationUserState({
        actorUserId: user.id,
        conversationId: id,
        isPinned: typeof body.isPinned === "boolean" ? body.isPinned : undefined,
        isHidden: typeof body.isHidden === "boolean" ? body.isHidden : undefined,
        markUnread: Boolean(body.markUnread),
        priority:
          body.userPriority === "low" ||
          body.userPriority === "normal" ||
          body.userPriority === "high" ||
          body.userPriority === "urgent" ||
          body.userPriority === "none"
            ? body.userPriority
            : undefined,
      });
      return NextResponse.json({ ok: true });
    }

    await updateChatConversationMeta({
      actorUserId: user.id,
      actorRole: user.role,
      conversationId: id,
      ownerUserId: String(body.ownerUserId ?? ""),
      status:
        body.status === "closed" || body.status === "resolved" || body.status === "pending" || body.status === "open"
          ? body.status
          : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map((item) => String(item)) : undefined,
    });
    const conversation = await getChatConversationDetailForViewer(
      user.id,
      id,
      await buildChatViewerContext(user.role)
    );
    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof ChatError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.code, message: error.message }, { status });
    }
    throw error;
  }
}
