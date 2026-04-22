import { NextResponse } from "next/server";

import {
  buildChatViewerContext,
  createChatConversation,
  createSupportRequestConversation,
  listChatConversationsForViewer,
  ChatError,
} from "@/features/chat/server/service";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canAccessUserPortal } from "@/lib/roles";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const conversations = await listChatConversationsForViewer(user.id, await buildChatViewerContext(user.role));
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
    category?: string;
    participantUserIds?: string[];
  };

  try {
    const conversationId =
      body.mode === "support_request"
        ? canAccessUserPortal(user.role)
          ? await createSupportRequestConversation({
              requesterUserId: user.id,
              category:
                body.category === "bug_report" ||
                body.category === "order_support" ||
                body.category === "billing" ||
                body.category === "affiliate_support" ||
                body.category === "vendor_support" ||
                body.category === "other"
                  ? body.category
                  : "general",
              title: body.title,
            })
          : (() => {
              throw new ChatError("FORBIDDEN", "Only user-portal accounts can create support requests.");
            })()
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
