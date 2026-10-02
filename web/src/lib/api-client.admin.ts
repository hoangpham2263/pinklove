"use client";

import { apiFetch, apiJson } from "@/lib/api";
import { postForm, type MutationResult } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import type { ChatConversationDetail, ChatConversationSummary, ChatConversationUserPriority, ChatMessageVisibility } from "@/features/chat/types";
import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";
import type { MediaAsset } from "@/features/media/types";
import type { ProviderOrderDetail } from "@/features/provider-orders/types";

export type AdminOrderStateSnapshot = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  notes: string;
  updatedAt: string;
};

export type MediaListPayload = {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
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

function mediaUrl(params?: Record<string, string | number>) {
  if (!params) {
    return ROUTES.API.MEDIA;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }

  return `${ROUTES.API.MEDIA}?${searchParams.toString()}`;
}

async function parseMediaError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  return data?.message ?? fallback;
}

async function parseChatError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  return data?.message ?? fallback;
}

async function submitForm(action: string, formData: FormData): Promise<MutationResult> {
  return postForm(action, formData);
}

async function updateGlobalFields(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.GLOBAL_FIELDS.UPDATE, formData);
}

async function updateOrderState(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.ORDERS.UPDATE, formData);
}

async function saveProviderAssignment(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.ORDERS.PROVIDER_ASSIGNMENT, formData);
}

async function createBlogCategory(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.BLOG.CATEGORIES.CREATE, formData);
}

async function updateBlogCategory(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.BLOG.CATEGORIES.UPDATE, formData);
}

async function deleteBlogCategory(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.BLOG.CATEGORIES.DELETE, formData);
}

async function createBlogPost(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.BLOG.CREATE, formData);
}

async function updateBlogPost(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.BLOG.UPDATE, formData);
}

async function deleteBlogPost(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.BLOG.DELETE, formData);
}

async function updateMenu(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.MENUS.UPDATE, formData);
}

async function updateAffiliateApplication(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.AFFILIATES.APPLICATIONS_UPDATE, formData);
}

async function updateProviderApplication(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.PROVIDER_APPLICATIONS.UPDATE, formData);
}

async function updateAffiliate(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.AFFILIATES.UPDATE, formData);
}

async function updateAffiliateConversion(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.AFFILIATES.CONVERSIONS_UPDATE, formData);
}

async function bulkUpdateAffiliates(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.AFFILIATES.BULK, formData);
}

async function createUser(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.USERS.CREATE, formData);
}

async function updateUser(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.USERS.UPDATE, formData);
}

async function deleteUser(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.USERS.DELETE, formData);
}

async function bulkUpdateUsers(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.USERS.BULK, formData);
}

async function saveInternalAccount(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.INTERNAL_ACCOUNTS.SAVE, formData);
}

async function removeInternalAccount(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.INTERNAL_ACCOUNTS.DELETE, formData);
}

async function saveAdminRole(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.ACCESS.ROLE_SAVE, formData);
}

async function deleteAdminRole(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.ACCESS.ROLE_DELETE, formData);
}

async function updateConfig(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.CONFIG.UPDATE, formData);
}

async function sendTestEmail(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.EMAIL.TEST, formData);
}

async function createNotification(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.NOTIFICATIONS.CREATE, formData);
}

async function updateNotification(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.NOTIFICATIONS.UPDATE, formData);
}

async function deleteNotification(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.NOTIFICATIONS.DELETE, formData);
}

async function bulkUpdateNotifications(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.NOTIFICATIONS.BULK, formData);
}

async function updatePage(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.PAGES.UPDATE, formData);
}

async function bulkUpdatePages(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.PAGES.BULK, formData);
}

async function createOffering(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.CREATE, formData);
}

async function updateOffering(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.UPDATE, formData);
}

async function createLandingPage(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.LANDING_PAGES.CREATE, formData);
}

async function updateLandingPage(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.LANDING_PAGES.UPDATE, formData);
}

async function deleteLandingPage(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.LANDING_PAGES.DELETE, formData);
}

async function deleteOffering(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.DELETE, formData);
}

async function bulkUpdateOfferings(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.BULK, formData);
}

async function createOfferingCategory(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.CREATE, formData);
}

async function updateOfferingCategory(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.UPDATE, formData);
}

async function deleteOfferingCategory(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.DELETE, formData);
}

async function bulkUpdateOfferingCategories(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.BULK, formData);
}

async function saveOfferingType(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.TYPES.SAVE, formData);
}

async function saveOfferingBundle(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.BUNDLES_SAVE, formData);
}

async function deleteOfferingBundle(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.OFFERINGS.BUNDLES_DELETE, formData);
}

async function savePaymentMethod(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.PAYMENT_METHODS.SAVE, formData);
}

async function deletePaymentMethod(formData: FormData) {
  return submitForm(ROUTES.API.ADMIN.PAYMENT_METHODS.DELETE, formData);
}

async function fetchAdminOrderState(url: string) {
  const data = await apiJson<{ order?: AdminOrderStateSnapshot }>(url, {
    cache: "no-store",
  });

  if (!data.order) {
    throw new Error("LOAD_FAILED");
  }

  return data.order;
}

async function listMedia(params: { page?: number; limit?: number } = {}) {
  const response = await apiFetch(mediaUrl(params));
  if (!response.ok) {
    throw new Error(await parseMediaError(response, "Không thể tải thư viện media."));
  }

  return (await response.json()) as MediaListPayload;
}

async function getMediaByUrl(url: string) {
  const response = await apiFetch(mediaUrl({ url }));
  if (!response.ok) {
    throw new Error(await parseMediaError(response, "Không thể tải thông tin media."));
  }

  return (await response.json()) as { item?: MediaAsset | null };
}

async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(ROUTES.API.MEDIA, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await parseMediaError(response, "Upload failed"));
  }

  return (await response.json()) as { item: MediaAsset };
}

async function deleteMedia(id: string) {
  const response = await apiFetch(mediaUrl({ id }), { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await parseMediaError(response, "Không thể xóa media."));
  }

  return (await response.json()) as { ok: true };
}

async function fetchProviderOrderDetail(url: string) {
  const response = await apiFetch(url, {
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new Error("not_found");
  }

  if (!response.ok) {
    throw new Error("LOAD_FAILED");
  }

  const data = (await response.json()) as { detail?: ProviderOrderDetail | null };
  return data.detail ?? null;
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
    body: JSON.stringify({
      title: payload.title ?? "",
      participantUserIds: payload.participantUserIds,
      mode: payload.mode,
      category: payload.category,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseChatError(response, payload.mode === "support_request" ? "Không thể mở hội thoại hỗ trợ." : "Không thể tạo hội thoại."));
  }

  return (await response.json()) as { conversationId: string };
}

async function addChatParticipants(conversationId: string, participantUserIds: string[]) {
  const response = await apiFetch(ROUTES.API.CHAT.PARTICIPANTS(conversationId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantUserIds }),
  });

  if (!response.ok) {
    throw new Error(await parseChatError(response, "Không thể thêm thành viên."));
  }
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

export const adminApi = {
  updateGlobalFields,
  updateOrderState,
  saveProviderAssignment,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  updateMenu,
  updateAffiliateApplication,
  updateProviderApplication,
  updateAffiliate,
  updateAffiliateConversion,
  bulkUpdateAffiliates,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  saveInternalAccount,
  removeInternalAccount,
  saveAdminRole,
  deleteAdminRole,
  updateConfig,
  sendTestEmail,
  createNotification,
  updateNotification,
  deleteNotification,
  bulkUpdateNotifications,
  updatePage,
  bulkUpdatePages,
  createOffering,
  updateOffering,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  deleteOffering,
  bulkUpdateOfferings,
  createOfferingCategory,
  updateOfferingCategory,
  deleteOfferingCategory,
  bulkUpdateOfferingCategories,
  saveOfferingType,
  saveOfferingBundle,
  deleteOfferingBundle,
  savePaymentMethod,
  deletePaymentMethod,
  fetchAdminOrderState,
  listMedia,
  getMediaByUrl,
  uploadMedia,
  deleteMedia,
  fetchProviderOrderDetail,
  fetchChatConversations,
  fetchChatConversation,
  sendChatTyping,
  sendChatMessage,
  deleteChatMessage,
  updateChatMessage,
  createChatConversation,
  addChatParticipants,
  updateChatConversation,
};

export const adminApiActions = {
  updateGlobalFields: ROUTES.API.ADMIN.GLOBAL_FIELDS.UPDATE,
  updateOrderState: ROUTES.API.ADMIN.ORDERS.UPDATE,
  saveProviderAssignment: ROUTES.API.ADMIN.ORDERS.PROVIDER_ASSIGNMENT,
  createBlogCategory: ROUTES.API.ADMIN.BLOG.CATEGORIES.CREATE,
  updateBlogCategory: ROUTES.API.ADMIN.BLOG.CATEGORIES.UPDATE,
  deleteBlogCategory: ROUTES.API.ADMIN.BLOG.CATEGORIES.DELETE,
  createBlogPost: ROUTES.API.ADMIN.BLOG.CREATE,
  updateBlogPost: ROUTES.API.ADMIN.BLOG.UPDATE,
  deleteBlogPost: ROUTES.API.ADMIN.BLOG.DELETE,
  updateMenu: ROUTES.API.ADMIN.MENUS.UPDATE,
  updateAffiliateApplication: ROUTES.API.ADMIN.AFFILIATES.APPLICATIONS_UPDATE,
  updateProviderApplication: ROUTES.API.ADMIN.PROVIDER_APPLICATIONS.UPDATE,
  updateAffiliate: ROUTES.API.ADMIN.AFFILIATES.UPDATE,
  updateAffiliateConversion: ROUTES.API.ADMIN.AFFILIATES.CONVERSIONS_UPDATE,
  bulkUpdateAffiliates: ROUTES.API.ADMIN.AFFILIATES.BULK,
  createUser: ROUTES.API.ADMIN.USERS.CREATE,
  updateUser: ROUTES.API.ADMIN.USERS.UPDATE,
  deleteUser: ROUTES.API.ADMIN.USERS.DELETE,
  bulkUpdateUsers: ROUTES.API.ADMIN.USERS.BULK,
  saveInternalAccount: ROUTES.API.ADMIN.INTERNAL_ACCOUNTS.SAVE,
  removeInternalAccount: ROUTES.API.ADMIN.INTERNAL_ACCOUNTS.DELETE,
  saveAdminRole: ROUTES.API.ADMIN.ACCESS.ROLE_SAVE,
  deleteAdminRole: ROUTES.API.ADMIN.ACCESS.ROLE_DELETE,
  updateConfig: ROUTES.API.ADMIN.CONFIG.UPDATE,
  sendTestEmail: ROUTES.API.ADMIN.EMAIL.TEST,
  createNotification: ROUTES.API.ADMIN.NOTIFICATIONS.CREATE,
  updateNotification: ROUTES.API.ADMIN.NOTIFICATIONS.UPDATE,
  deleteNotification: ROUTES.API.ADMIN.NOTIFICATIONS.DELETE,
  bulkUpdateNotifications: ROUTES.API.ADMIN.NOTIFICATIONS.BULK,
  updatePage: ROUTES.API.ADMIN.PAGES.UPDATE,
  bulkUpdatePages: ROUTES.API.ADMIN.PAGES.BULK,
  createOffering: ROUTES.API.ADMIN.OFFERINGS.CREATE,
  updateOffering: ROUTES.API.ADMIN.OFFERINGS.UPDATE,
  createLandingPage: ROUTES.API.ADMIN.LANDING_PAGES.CREATE,
  updateLandingPage: ROUTES.API.ADMIN.LANDING_PAGES.UPDATE,
  deleteLandingPage: ROUTES.API.ADMIN.LANDING_PAGES.DELETE,
  deleteOffering: ROUTES.API.ADMIN.OFFERINGS.DELETE,
  bulkUpdateOfferings: ROUTES.API.ADMIN.OFFERINGS.BULK,
  createOfferingCategory: ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.CREATE,
  updateOfferingCategory: ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.UPDATE,
  deleteOfferingCategory: ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.DELETE,
  bulkUpdateOfferingCategories: ROUTES.API.ADMIN.OFFERINGS.CATEGORIES.BULK,
  saveOfferingType: ROUTES.API.ADMIN.OFFERINGS.TYPES.SAVE,
  saveOfferingBundle: ROUTES.API.ADMIN.OFFERINGS.BUNDLES_SAVE,
  deleteOfferingBundle: ROUTES.API.ADMIN.OFFERINGS.BUNDLES_DELETE,
  savePaymentMethod: ROUTES.API.ADMIN.PAYMENT_METHODS.SAVE,
  deletePaymentMethod: ROUTES.API.ADMIN.PAYMENT_METHODS.DELETE,
} as const;
