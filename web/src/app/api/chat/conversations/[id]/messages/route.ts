import { NextResponse } from "next/server";

import {
  deleteChatMessage,
  sendChatMessage,
  ChatError,
  updateChatMessageUserState,
} from "@/features/chat/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    body?: string;
    attachmentUrl?: string;
    replyToMessageId?: string;
    visibility?: string;
  };

  try {
    await sendChatMessage({
      actorUserId: user.id,
      actorRole: user.role,
      conversationId: id,
      body: String(body.body ?? ""),
      attachmentUrl: String(body.attachmentUrl ?? ""),
      replyToMessageId: String(body.replyToMessageId ?? ""),
      visibility: body.visibility === "internal" ? "internal" : "all",
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    messageId?: string;
  };

  try {
    await deleteChatMessage({
      actorUserId: user.id,
      actorRole: user.role,
      conversationId: id,
      messageId: String(body.messageId ?? ""),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ChatError) {
      const status =
        error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.code, message: error.message }, { status });
    }

    throw error;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    messageId?: string;
    isPinned?: boolean;
  };

  try {
    await updateChatMessageUserState({
      actorUserId: user.id,
      conversationId: id,
      messageId: String(body.messageId ?? ""),
      isPinned: Boolean(body.isPinned),
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
