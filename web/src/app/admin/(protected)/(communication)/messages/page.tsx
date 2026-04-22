import { ChatInboxPageContent } from "@/features/chat/components/chat-inbox-page-content";
import { requireAdmin } from "@/lib/auth";

export default async function AdminMessagesPage() {
  const admin = await requireAdmin();
  return (
    <ChatInboxPageContent
      currentUser={admin}
      mode="admin"
      className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden"
    />
  );
}
