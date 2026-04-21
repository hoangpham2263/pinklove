import { ChatInboxClient } from "@/features/chat/components/chat-inbox-client";
import {
  getChatConversationDetail,
  listChatConversationsForUser,
} from "@/features/chat/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerMessagesPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const conversations = await listChatConversationsForUser(user.id);
  const initialConversation = conversations[0]
    ? await getChatConversationDetail(user.id, conversations[0].id)
    : null;

  return (
    <section className="flex h-[calc(100dvh-6.5rem)] min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden md:h-[calc(100dvh-3.5rem)]">
      <div className="shrink-0 px-4 pt-4 md:px-5 md:pt-5">
        <h1 className="text-2xl font-bold tracking-tight">Tin nhắn</h1>
        <p className="text-sm text-muted-foreground">
          Trao đổi realtime với admin và các nhóm bạn được mời tham gia.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 md:px-5 md:pb-5">
        <ChatInboxClient
          currentUser={user}
          initialConversations={conversations}
          initialConversation={initialConversation}
          mode="customer"
        />
      </div>
    </section>
  );
}
