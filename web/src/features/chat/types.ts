import type { UserRole } from "@/lib/roles";

export type ChatConversationKind = "direct" | "group" | "support";
export type ChatConversationStatus = "open" | "pending" | "resolved" | "closed";
export type ChatSupportRequestCategory =
  | "general"
  | "bug_report"
  | "order_support"
  | "billing"
  | "affiliate_support"
  | "provider_support"
  | "other";
export type ChatConversationPriority = "low" | "normal" | "high" | "urgent";
export type ChatMessageVisibility = "all" | "internal";
export type ChatAttachmentKind = "image" | "file";
export type ChatConversationUserPriority = "none" | "low" | "normal" | "high" | "urgent";

export type ChatParticipant = {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
};

export type ChatMessageReplyPreview = {
  id: string;
  senderUserId: string;
  body: string;
  senderDisplayName: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderUsername: string;
  senderDisplayName: string;
  body: string;
  visibility: ChatMessageVisibility;
  attachmentUrl: string;
  attachmentKind: ChatAttachmentKind | "";
  isPinned: boolean;
  replyTo?: ChatMessageReplyPreview;
  createdAt: string;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  kind: ChatConversationKind;
  status: ChatConversationStatus;
  category: ChatSupportRequestCategory | "";
  priority: ChatConversationPriority;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  isPinned: boolean;
  isMarkedUnread: boolean;
  userPriority: ChatConversationUserPriority;
  tags: string[];
  ownerUserId: string;
  ownerDisplayName: string;
  requesterUserId: string;
  requesterDisplayName: string;
  isLegacy: boolean;
  messageCount: number;
  typingDisplayNames: string[];
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
};

export type ChatConversationDetail = ChatConversationSummary & {
  messages: ChatMessage[];
  lastSeenByDisplayNames: string[];
};

export type ChatAssignableAccount = ChatParticipant;
