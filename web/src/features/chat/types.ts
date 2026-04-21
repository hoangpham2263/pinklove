import type { UserRole } from "@/lib/roles";

export type ChatConversationKind = "direct" | "group" | "support";

export type ChatParticipant = {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderUsername: string;
  senderDisplayName: string;
  body: string;
  createdAt: string;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  kind: ChatConversationKind;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
};

export type ChatConversationDetail = ChatConversationSummary & {
  messages: ChatMessage[];
};

export type ChatAssignableAccount = ChatParticipant;
