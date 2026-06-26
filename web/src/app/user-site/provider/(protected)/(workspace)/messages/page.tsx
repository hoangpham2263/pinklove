import { ChatInboxPageContent } from "@/features/chat/components/chat-inbox-page-content";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderMessagesPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);

  return (
    <ChatInboxPageContent
      currentUser={provider}
      mode="customer"
      className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden"
    />
  );
}
