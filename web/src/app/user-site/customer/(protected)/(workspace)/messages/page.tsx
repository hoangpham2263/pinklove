import { ChatInboxPageContent } from "@/features/chat/components/chat-inbox-page-content";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerMessagesPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  return (
    <ChatInboxPageContent
      currentUser={user}
      mode="customer"
      className="flex h-[calc(100dvh-6.5rem)] min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden md:h-[calc(100dvh-3.5rem)]"
    />
  );
}
