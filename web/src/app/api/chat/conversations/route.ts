import { NextResponse } from "next/server";

import {
  createChatConversation,
  createOrGetSupportConversation,
  listChatConversationsForUser,
  ChatError,
} from "@/features/chat/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const conversations = await listChatConversationsForUser(user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    mode?: string;
    title?: string;
    participantUserIds?: string[];
  };

  try {
    const conversationId =
      body.mode === "support"
        ? await createOrGetSupportConversation(user.id)
        : await createChatConversation({
            actorUserId: user.id,
            actorRole: user.role,
            title: body.title,
            participantUserIds: Array.isArray(body.participantUserIds) ? body.participantUserIds : [],
          });

    return NextResponse.json({ conversationId });
  } catch (error) {
    if (error instanceof ChatError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NO_ADMIN_AVAILABLE" ? 409 : 400;
      return NextResponse.json({ error: error.code, message: error.message }, { status });
    }

    throw error;
  }
}
