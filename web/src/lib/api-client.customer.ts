"use client";

import { apiFetch } from "@/lib/api";
import { postForm, type MutationResult } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { ChatConversationDetail, ChatConversationSummary, ChatConversationUserPriority, ChatMessageVisibility } from "@/features/chat/types";
import type { NotificationSummary, UserNotification } from "@/features/notifications/types";

export type NotificationPayload = {
  notifications: UserNotification[];
  summary: NotificationSummary;
};

type ChatConversationPatch = {
  ownerUserId?: string;
  status?: string;
  tags?: string[];
  isPinned?: boolean;
  userPriority?: ChatConversationUserPriority;
  isHidden?: boolean;
  markUnread?: boolean;
};

async function parseChatError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  return data?.message ?? fallback;
}

async function submitForm(action: string, formData: FormData): Promise<MutationResult> {
  return postForm(action, formData);
}

async function updateCustomerProfile(formData: FormData) {
  return submitForm(ROUTES.API.CUSTOMER.PROFILE, formData);
}

async function applyAffiliate(formData: FormData) {
  return submitForm(ROUTES.API.CUSTOMER.AFFILIATE.APPLY, formData);
}

async function updateInvitation(formData: FormData) {
  return submitForm(ROUTES.API.CUSTOMER.INVITATIONS.UPDATE, formData);
}

async function updateWishlist(formData: FormData) {
  return submitForm(ROUTES.API.CUSTOMER.WISHLIST, formData);
}

async function fetchNotifications(): Promise<NotificationPayload> {
  const response = await apiFetch(ROUTES.API.NOTIFICATIONS.INDEX, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("NOTIFICATIONS_LOAD_FAILED");
  }

  return (await response.json()) as NotificationPayload;
}

async function markNotificationRead(notificationId?: string) {
  const response = await apiFetch(ROUTES.API.NOTIFICATIONS.READ, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificationId ? { notificationId } : { all: true }),
  });

  if (!response.ok) {
    throw new Error("NOTIFICATION_MARK_READ_FAILED");
  }
}

async function fetchChatConversations() {
  const response = await apiFetch(ROUTES.API.CHAT.CONVERSATIONS, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("LOAD_CONVERSATIONS_FAILED");
  }

  const data = (await response.json()) as { conversations?: ChatConversationSummary[] };
  return data.conversations ?? [];
}

async function fetchChatConversation(conversationId: string) {
  const response = await apiFetch(ROUTES.API.CHAT.CONVERSATION(conversationId), {
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("LOAD_CONVERSATION_FAILED");
  }

  const data = (await response.json()) as { conversation?: ChatConversationDetail };
  return data.conversation ?? null;
}

async function sendChatTyping(conversationId: string, isTyping: boolean) {
  await apiFetch(ROUTES.API.CHAT.TYPING(conversationId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isTyping }),
  });
}

async function sendChatMessage(
  conversationId: string,
  payload: {
    body: string;
    attachmentUrl: string;
    replyToMessageId: string;
    visibility: ChatMessageVisibility;
  }
) {
  const response = await apiFetch(ROUTES.API.CHAT.MESSAGES(conversationId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseChatError(response, "Không thể gửi tin nhắn."));
  }
}

async function deleteChatMessage(conversationId: string, messageId: string) {
  const response = await apiFetch(ROUTES.API.CHAT.MESSAGES(conversationId), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId }),
  });

  if (!response.ok) {
    throw new Error(await parseChatError(response, "Không thể xóa tin nhắn."));
  }
}

async function updateChatMessage(conversationId: string, payload: { messageId: string; isPinned: boolean }) {
  const response = await apiFetch(ROUTES.API.CHAT.MESSAGES(conversationId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseChatError(response, "Không thể cập nhật đánh dấu tin nhắn."));
  }
}

async function createChatConversation(payload: { title?: string; participantUserIds?: string[]; mode?: "support_request"; category?: string }) {
  const response = await apiFetch(ROUTES.API.CHAT.CONVERSATIONS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseChatError(response, "Không thể mở hội thoại hỗ trợ."));
  }

  return (await response.json()) as { conversationId: string };
}

async function updateChatConversation(conversationId: string, patch: ChatConversationPatch) {
  const response = await apiFetch(ROUTES.API.CHAT.CONVERSATION(conversationId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  const data = (await response.json().catch(() => null)) as { message?: string; conversation?: ChatConversationDetail | null } | null;
  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật hội thoại.");
  }

  return data?.conversation ?? null;
}

export const customerApi = {
  updateCustomerProfile,
  applyAffiliate,
  updateInvitation,
  updateWishlist,
  fetchNotifications,
  markNotificationRead,
  fetchChatConversations,
  fetchChatConversation,
  sendChatTyping,
  sendChatMessage,
  deleteChatMessage,
  updateChatMessage,
  createChatConversation,
  updateChatConversation,
};

export const customerApiActions = {
  updateCustomerProfile: ROUTES.API.CUSTOMER.PROFILE,
  applyAffiliate: ROUTES.API.CUSTOMER.AFFILIATE.APPLY,
  updateInvitation: ROUTES.API.CUSTOMER.INVITATIONS.UPDATE,
  updateWishlist: ROUTES.API.CUSTOMER.WISHLIST,
} as const;
