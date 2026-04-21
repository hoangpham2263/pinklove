import "server-only";

import { createListenRealtimeStream } from "@/features/realtime/server";
import { query } from "@/lib/database";

export const CHAT_REALTIME_NOTIFY_CHANNEL = "app_realtime";
export const CHAT_REALTIME_TOPIC_CONVERSATION = "chat-conversation";
export const CHAT_REALTIME_TOPIC_INBOX = "chat-inbox";

type ChatConversationRealtimeState = {
  version: string;
  conversationId: string;
  updatedAt: string;
  latestMessageId: string;
  latestMessageCreatedAt: string;
  messageCount: number;
};

type ChatInboxRealtimeState = {
  version: string;
  userId: string;
  latestConversationUpdatedAt: string;
  latestMessageId: string;
  latestMessageCreatedAt: string;
  conversationCount: number;
};

export async function getChatConversationRealtimeState(
  userId: string,
  conversationId: string
): Promise<ChatConversationRealtimeState | null> {
  const result = await query<{
    conversation_id: string;
    updated_at: string;
    latest_message_id: string | null;
    latest_message_created_at: string | null;
    message_count: string;
  }>(
    `
      SELECT
        c.id AS conversation_id,
        c.updated_at::text AS updated_at,
        (
          SELECT m.id
          FROM chat_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS latest_message_id,
        (
          SELECT m.created_at::text
          FROM chat_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS latest_message_created_at,
        (
          SELECT COUNT(*)::text
          FROM chat_messages m
          WHERE m.conversation_id = c.id
        ) AS message_count
      FROM chat_conversations c
      JOIN chat_conversation_participants p ON p.conversation_id = c.id
      WHERE c.id = $1 AND p.user_id = $2
      LIMIT 1
    `,
    [conversationId, userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    version: [
      row.updated_at,
      row.latest_message_id ?? "",
      row.latest_message_created_at ?? "",
      row.message_count,
    ].join("|"),
    conversationId: row.conversation_id,
    updatedAt: row.updated_at,
    latestMessageId: row.latest_message_id ?? "",
    latestMessageCreatedAt: row.latest_message_created_at ?? "",
    messageCount: Number(row.message_count),
  };
}

export async function getChatInboxRealtimeState(userId: string): Promise<ChatInboxRealtimeState> {
  const result = await query<{
    latest_conversation_updated_at: string | null;
    latest_message_id: string | null;
    latest_message_created_at: string | null;
    conversation_count: string;
  }>(
    `
      SELECT
        MAX(c.updated_at)::text AS latest_conversation_updated_at,
        (
          SELECT m.id
          FROM chat_messages m
          JOIN chat_conversation_participants mp ON mp.conversation_id = m.conversation_id
          WHERE mp.user_id = $1
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS latest_message_id,
        (
          SELECT m.created_at::text
          FROM chat_messages m
          JOIN chat_conversation_participants mp ON mp.conversation_id = m.conversation_id
          WHERE mp.user_id = $1
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS latest_message_created_at,
        COUNT(DISTINCT c.id)::text AS conversation_count
      FROM chat_conversations c
      JOIN chat_conversation_participants p ON p.conversation_id = c.id
      WHERE p.user_id = $1
    `,
    [userId]
  );

  const row = result.rows[0];

  return {
    version: [
      row?.latest_conversation_updated_at ?? "",
      row?.latest_message_id ?? "",
      row?.latest_message_created_at ?? "",
      row?.conversation_count ?? "0",
    ].join("|"),
    userId,
    latestConversationUpdatedAt: row?.latest_conversation_updated_at ?? "",
    latestMessageId: row?.latest_message_id ?? "",
    latestMessageCreatedAt: row?.latest_message_created_at ?? "",
    conversationCount: Number(row?.conversation_count ?? "0"),
  };
}

export function createChatConversationRealtimeStream(userId: string, conversationId: string) {
  return createListenRealtimeStream({
    channel: CHAT_REALTIME_NOTIFY_CHANNEL,
    resourceId: conversationId,
    changedEvent: "chat-conversation.changed",
    deletedEvent: "chat-conversation.deleted",
    loadState: () => getChatConversationRealtimeState(userId, conversationId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === CHAT_REALTIME_TOPIC_CONVERSATION && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      conversationId,
      latestMessageId: state?.latestMessageId ?? "",
      messageCount: state?.messageCount ?? 0,
    }),
    mapChangedPayload: (state) => ({
      conversationId,
      latestMessageId: state.latestMessageId,
      latestMessageCreatedAt: state.latestMessageCreatedAt,
      messageCount: state.messageCount,
    }),
  });
}

export function createChatInboxRealtimeStream(userId: string) {
  return createListenRealtimeStream({
    channel: CHAT_REALTIME_NOTIFY_CHANNEL,
    resourceId: userId,
    changedEvent: "chat-inbox.changed",
    loadState: () => getChatInboxRealtimeState(userId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === CHAT_REALTIME_TOPIC_INBOX && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      userId,
      latestMessageId: state?.latestMessageId ?? "",
      conversationCount: state?.conversationCount ?? 0,
    }),
    mapChangedPayload: (state) => ({
      userId,
      latestMessageId: state.latestMessageId,
      latestMessageCreatedAt: state.latestMessageCreatedAt,
      conversationCount: state.conversationCount,
    }),
  });
}
