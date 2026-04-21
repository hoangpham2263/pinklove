import { ChatInboxClient } from "@/features/chat/components/chat-inbox-client";
import {
  getChatConversationDetail,
  listChatAssignableAccounts,
  listChatConversationsForUser,
} from "@/features/chat/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function AdminMessagesPage() {
  const admin = await requireAdmin();
  const [conversations, assignableAccounts] = await Promise.all([
    listChatConversationsForUser(admin.id),
    listChatAssignableAccounts(admin.id),
  ]);
  const initialConversation = conversations[0]
    ? await getChatConversationDetail(admin.id, conversations[0].id)
    : null;

  return (
    <section className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 px-4 pt-4 md:px-5 md:pt-5">
        <h1 className="text-2xl font-bold tracking-tight">Tin nhắn</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý trao đổi realtime với khách hàng, vendor, affiliate và nhóm nội bộ.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 md:px-5 md:pb-5">
        <ChatInboxClient
          currentUser={admin}
          initialConversations={conversations}
          initialConversation={initialConversation}
          assignableAccounts={assignableAccounts}
          mode="admin"
        />
      </div>
    </section>
  );
}
