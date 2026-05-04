import { ChatInboxClient } from "@/features/chat/components/chat-inbox-client";
import {
  buildChatViewerContext,
  getChatConversationDetailForViewer,
  listChatAssignableAccounts,
  listChatConversationsForViewer,
} from "@/features/chat/server/service";
import { isAdminRole, type UserRole } from "@/lib/roles";
import { getSystemSettings } from "@/lib/system-settings";

type ChatInboxPageContentProps = {
  currentUser: {
    id: string;
    username: string;
    role: UserRole;
  };
  mode: "admin" | "customer";
  className: string;
};

export async function ChatInboxPageContent({
  currentUser,
  mode,
  className,
}: ChatInboxPageContentProps) {
  const context = await buildChatViewerContext(currentUser.role);
  const [conversations, assignableAccounts, settings] = await Promise.all([
    listChatConversationsForViewer(currentUser.id, context),
    isAdminRole(currentUser.role) ? listChatAssignableAccounts(currentUser.id) : Promise.resolve([]),
    isAdminRole(currentUser.role) ? getSystemSettings() : Promise.resolve(null),
  ]);
  const initialConversation = conversations[0]
    ? await getChatConversationDetailForViewer(currentUser.id, conversations[0].id, context)
    : null;

  return (
    <section className={className}>
      <div className="min-h-0 flex-1 overflow-hidden p-4 md:p-5">
        <ChatInboxClient
          currentUser={currentUser}
          initialConversations={conversations}
          initialConversation={initialConversation}
          assignableAccounts={assignableAccounts}
          chatSettings={settings?.branding}
          mode={mode}
        />
      </div>
    </section>
  );
}
