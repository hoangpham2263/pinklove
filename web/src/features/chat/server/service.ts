import "server-only";

import {
  CHAT_REALTIME_NOTIFY_CHANNEL,
  CHAT_REALTIME_TOPIC_CONVERSATION,
  CHAT_REALTIME_TOPIC_INBOX,
} from "@/features/chat/realtime";
import type {
  ChatAssignableAccount,
  ChatConversationDetail,
  ChatConversationKind,
  ChatConversationSummary,
  ChatMessage,
  ChatParticipant,
} from "@/features/chat/types";
import { query, type DbExecutor, withTransaction } from "@/lib/database";
import { isAdminRole, type UserRole, USER_ROLES } from "@/lib/roles";

type ConversationRow = {
  id: string;
  title: string;
  kind: ChatConversationKind;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message_conversation_id: string | null;
  last_message_sender_user_id: string | null;
  last_message_sender_username: string | null;
  last_message_sender_display_name: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
};

type ParticipantRow = {
  conversation_id: string;
  id: string;
  username: string;
  role: UserRole;
  display_name: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_username: string;
  sender_display_name: string | null;
  body: string;
  created_at: string;
};

export class ChatError extends Error {
  code: "FORBIDDEN" | "NOT_FOUND" | "INVALID_PAYLOAD" | "NO_ADMIN_AVAILABLE";

  constructor(code: ChatError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function mapParticipant(row: ParticipantRow): ChatParticipant {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name ?? row.username,
  };
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    senderUsername: row.sender_username,
    senderDisplayName: row.sender_display_name ?? row.sender_username,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapLastMessage(row: ConversationRow): ChatMessage | undefined {
  if (!row.last_message_id || !row.last_message_sender_user_id || !row.last_message_conversation_id) {
    return undefined;
  }

  return {
    id: row.last_message_id,
    conversationId: row.last_message_conversation_id,
    senderUserId: row.last_message_sender_user_id,
    senderUsername: row.last_message_sender_username ?? "",
    senderDisplayName: row.last_message_sender_display_name ?? row.last_message_sender_username ?? "",
    body: row.last_message_body ?? "",
    createdAt: row.last_message_created_at ?? row.updated_at,
  };
}

function summarizeConversationTitle(
  row: ConversationRow,
  participants: ChatParticipant[],
  currentUserId: string
) {
  const title = row.title.trim();
  if (title) return title;
  if (row.kind === "support") return "Hỗ trợ từ PinkLove";

  const others = participants.filter((participant) => participant.id !== currentUserId);
  if (others.length === 0) return "Ghi chú cá nhân";
  return others.map((participant) => participant.displayName || participant.username).join(", ");
}

function mapConversation(
  row: ConversationRow,
  participants: ChatParticipant[],
  currentUserId: string
): ChatConversationSummary {
  return {
    id: row.id,
    title: summarizeConversationTitle(row, participants, currentUserId),
    kind: row.kind,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    participants,
    lastMessage: mapLastMessage(row),
  };
}

async function notifyRealtime(execute: DbExecutor, topic: string, resourceId: string) {
  await execute("SELECT pg_notify($1, $2)", [
    CHAT_REALTIME_NOTIFY_CHANNEL,
    JSON.stringify({ topic, resourceId }),
  ]);
}

async function listParticipantsForConversations(conversationIds: string[]): Promise<Map<string, ChatParticipant[]>> {
  const map = new Map<string, ChatParticipant[]>();
  if (conversationIds.length === 0) return map;

  const result = await query<ParticipantRow>(
    `
      SELECT
        p.conversation_id,
        u.id,
        u.username,
        u.role,
        COALESCE(NULLIF(BTRIM(up.display_name), ''), NULLIF(BTRIM(up.full_name), '')) AS display_name
      FROM chat_conversation_participants p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE p.conversation_id = ANY($1::text[])
      ORDER BY p.joined_at ASC
    `,
    [conversationIds]
  );

  for (const row of result.rows) {
    const current = map.get(row.conversation_id) ?? [];
    current.push(mapParticipant(row));
    map.set(row.conversation_id, current);
  }

  return map;
}

async function listParticipantIds(execute: DbExecutor, conversationId: string): Promise<string[]> {
  const result = await execute<{ user_id: string }>(
    `
      SELECT user_id::text AS user_id
      FROM chat_conversation_participants
      WHERE conversation_id = $1
    `,
    [conversationId]
  );

  return result.rows.map((row) => row.user_id);
}

export async function listChatAssignableAccounts(actorUserId: string): Promise<ChatAssignableAccount[]> {
  const result = await query<{
    id: string;
    username: string;
    role: UserRole;
    display_name: string | null;
  }>(
    `
      SELECT
        u.id,
        u.username,
        u.role,
        COALESCE(NULLIF(BTRIM(p.display_name), ''), NULLIF(BTRIM(p.full_name), '')) AS display_name
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id <> $1
      ORDER BY u.role ASC, u.username ASC
    `,
    [actorUserId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name ?? row.username,
  }));
}

export async function listChatConversationsForUser(userId: string): Promise<ChatConversationSummary[]> {
  const result = await query<ConversationRow>(
    `
      SELECT
        c.id,
        c.title,
        c.kind,
        c.created_at::text AS created_at,
        c.updated_at::text AS updated_at,
        last_message.id AS last_message_id,
        last_message.conversation_id AS last_message_conversation_id,
        last_message.sender_user_id AS last_message_sender_user_id,
        sender.username AS last_message_sender_username,
        COALESCE(NULLIF(BTRIM(sender_profile.display_name), ''), NULLIF(BTRIM(sender_profile.full_name), '')) AS last_message_sender_display_name,
        last_message.body AS last_message_body,
        last_message.created_at::text AS last_message_created_at
      FROM chat_conversations c
      JOIN chat_conversation_participants p ON p.conversation_id = c.id
      LEFT JOIN LATERAL (
        SELECT m.*
        FROM chat_messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
      ) last_message ON true
      LEFT JOIN users sender ON sender.id = last_message.sender_user_id
      LEFT JOIN user_profiles sender_profile ON sender_profile.user_id = sender.id
      WHERE p.user_id = $1
      ORDER BY c.updated_at DESC
    `,
    [userId]
  );

  const participantsByConversation = await listParticipantsForConversations(result.rows.map((row) => row.id));
  return result.rows.map((row) =>
    mapConversation(row, participantsByConversation.get(row.id) ?? [], userId)
  );
}

export async function getChatConversationDetail(
  userId: string,
  conversationId: string
): Promise<ChatConversationDetail | null> {
  const result = await query<ConversationRow>(
    `
      SELECT
        c.id,
        c.title,
        c.kind,
        c.created_at::text AS created_at,
        c.updated_at::text AS updated_at,
        last_message.id AS last_message_id,
        last_message.conversation_id AS last_message_conversation_id,
        last_message.sender_user_id AS last_message_sender_user_id,
        sender.username AS last_message_sender_username,
        COALESCE(NULLIF(BTRIM(sender_profile.display_name), ''), NULLIF(BTRIM(sender_profile.full_name), '')) AS last_message_sender_display_name,
        last_message.body AS last_message_body,
        last_message.created_at::text AS last_message_created_at
      FROM chat_conversations c
      JOIN chat_conversation_participants p ON p.conversation_id = c.id
      LEFT JOIN LATERAL (
        SELECT m.*
        FROM chat_messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
      ) last_message ON true
      LEFT JOIN users sender ON sender.id = last_message.sender_user_id
      LEFT JOIN user_profiles sender_profile ON sender_profile.user_id = sender.id
      WHERE c.id = $1 AND p.user_id = $2
      LIMIT 1
    `,
    [conversationId, userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  const [participantsByConversation, messages] = await Promise.all([
    listParticipantsForConversations([conversationId]),
    query<MessageRow>(
      `
        SELECT
          m.id,
          m.conversation_id,
          m.sender_user_id,
          u.username AS sender_username,
          COALESCE(NULLIF(BTRIM(p.display_name), ''), NULLIF(BTRIM(p.full_name), '')) AS sender_display_name,
          m.body,
          m.created_at::text AS created_at
        FROM chat_messages m
        JOIN users u ON u.id = m.sender_user_id
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC, m.id ASC
      `,
      [conversationId]
    ),
  ]);

  await query(
    `
      UPDATE chat_conversation_participants
      SET last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2
    `,
    [conversationId, userId]
  );

  return {
    ...mapConversation(row, participantsByConversation.get(conversationId) ?? [], userId),
    messages: messages.rows.map(mapMessage),
  };
}

export async function createChatConversation(input: {
  actorUserId: string;
  actorRole: UserRole;
  title?: string;
  participantUserIds: string[];
}): Promise<string> {
  if (!isAdminRole(input.actorRole)) {
    throw new ChatError("FORBIDDEN", "Only admins can create group conversations.");
  }

  const participantIds = Array.from(new Set([input.actorUserId, ...input.participantUserIds.map((id) => id.trim()).filter(Boolean)]));
  if (participantIds.length < 2) {
    throw new ChatError("INVALID_PAYLOAD", "A conversation needs at least two participants.");
  }

  return withTransaction(async (execute) => {
    const validUsers = await execute<{ id: string }>(
      `
        SELECT id::text AS id
        FROM users
        WHERE id = ANY($1::text[])
      `,
      [participantIds]
    );
    const validUserIds = validUsers.rows.map((row) => row.id);
    if (validUserIds.length !== participantIds.length) {
      throw new ChatError("INVALID_PAYLOAD", "Some selected accounts do not exist.");
    }

    const kind: ChatConversationKind = validUserIds.length > 2 ? "group" : "direct";
    const created = await execute<{ id: string }>(
      `
        INSERT INTO chat_conversations (title, kind, created_by_user_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [(input.title ?? "").trim(), kind, input.actorUserId]
    );

    const conversationId = created.rows[0].id;
    for (const userId of validUserIds) {
      await execute(
        `
          INSERT INTO chat_conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [conversationId, userId]
      );
      await notifyRealtime(execute, CHAT_REALTIME_TOPIC_INBOX, userId);
    }

    await notifyRealtime(execute, CHAT_REALTIME_TOPIC_CONVERSATION, conversationId);
    return conversationId;
  });
}

export async function createOrGetSupportConversation(userId: string): Promise<string> {
  return withTransaction(async (execute) => {
    const existing = await execute<{ id: string }>(
      `
        SELECT c.id
        FROM chat_conversations c
        JOIN chat_conversation_participants customer_participant
          ON customer_participant.conversation_id = c.id AND customer_participant.user_id = $1
        JOIN chat_conversation_participants admin_participant
          ON admin_participant.conversation_id = c.id
        JOIN users admin_user ON admin_user.id = admin_participant.user_id AND admin_user.role = $2
        WHERE c.kind = 'support'
        ORDER BY c.updated_at DESC
        LIMIT 1
      `,
      [userId, USER_ROLES.ADMIN]
    );
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }

    const admin = await execute<{ id: string }>(
      `
        SELECT id::text AS id
        FROM users
        WHERE role = $1
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [USER_ROLES.ADMIN]
    );
    const adminId = admin.rows[0]?.id;
    if (!adminId) {
      throw new ChatError("NO_ADMIN_AVAILABLE", "No admin account is available for support chat.");
    }

    const created = await execute<{ id: string }>(
      `
        INSERT INTO chat_conversations (title, kind, created_by_user_id)
        VALUES ('Hỗ trợ khách hàng', 'support', $1)
        RETURNING id
      `,
      [userId]
    );

    const conversationId = created.rows[0].id;
    for (const participantId of [userId, adminId]) {
      await execute(
        `
          INSERT INTO chat_conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [conversationId, participantId]
      );
      await notifyRealtime(execute, CHAT_REALTIME_TOPIC_INBOX, participantId);
    }

    await notifyRealtime(execute, CHAT_REALTIME_TOPIC_CONVERSATION, conversationId);
    return conversationId;
  });
}

export async function addChatParticipants(input: {
  actorUserId: string;
  actorRole: UserRole;
  conversationId: string;
  participantUserIds: string[];
}): Promise<void> {
  if (!isAdminRole(input.actorRole)) {
    throw new ChatError("FORBIDDEN", "Only admins can add conversation participants.");
  }

  const participantIds = Array.from(new Set(input.participantUserIds.map((id) => id.trim()).filter(Boolean)));
  if (participantIds.length === 0) {
    throw new ChatError("INVALID_PAYLOAD", "Select at least one account to add.");
  }

  await withTransaction(async (execute) => {
    const actorMembership = await execute<{ conversation_id: string }>(
      `
        SELECT conversation_id
        FROM chat_conversation_participants
        WHERE conversation_id = $1 AND user_id = $2
        LIMIT 1
      `,
      [input.conversationId, input.actorUserId]
    );

    if (!actorMembership.rows[0]) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    const validUsers = await execute<{ id: string }>(
      `
        SELECT id::text AS id
        FROM users
        WHERE id = ANY($1::text[])
      `,
      [participantIds]
    );
    const validUserIds = validUsers.rows.map((row) => row.id);
    if (validUserIds.length !== participantIds.length) {
      throw new ChatError("INVALID_PAYLOAD", "Some selected accounts do not exist.");
    }

    for (const userId of validUserIds) {
      await execute(
        `
          INSERT INTO chat_conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [input.conversationId, userId]
      );
    }

    await execute(
      `
        UPDATE chat_conversations
        SET
          kind = CASE WHEN kind = 'direct' THEN 'group' ELSE kind END,
          updated_at = NOW()
        WHERE id = $1
      `,
      [input.conversationId]
    );

    const allParticipantIds = await listParticipantIds(execute, input.conversationId);
    await notifyRealtime(execute, CHAT_REALTIME_TOPIC_CONVERSATION, input.conversationId);
    for (const participantId of allParticipantIds) {
      await notifyRealtime(execute, CHAT_REALTIME_TOPIC_INBOX, participantId);
    }
  });
}

export async function sendChatMessage(input: {
  actorUserId: string;
  conversationId: string;
  body: string;
}): Promise<void> {
  const body = input.body.trim();
  if (!body) {
    throw new ChatError("INVALID_PAYLOAD", "Message body is required.");
  }

  await withTransaction(async (execute) => {
    const membership = await execute<{ conversation_id: string }>(
      `
        SELECT conversation_id
        FROM chat_conversation_participants
        WHERE conversation_id = $1 AND user_id = $2
        LIMIT 1
      `,
      [input.conversationId, input.actorUserId]
    );

    if (!membership.rows[0]) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    await execute(
      `
        INSERT INTO chat_messages (conversation_id, sender_user_id, body)
        VALUES ($1, $2, $3)
      `,
      [input.conversationId, input.actorUserId, body]
    );

    await execute(
      `
        UPDATE chat_conversations
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [input.conversationId]
    );

    await execute(
      `
        UPDATE chat_conversation_participants
        SET last_read_at = NOW()
        WHERE conversation_id = $1 AND user_id = $2
      `,
      [input.conversationId, input.actorUserId]
    );

    const participantIds = await listParticipantIds(execute, input.conversationId);
    await notifyRealtime(execute, CHAT_REALTIME_TOPIC_CONVERSATION, input.conversationId);
    for (const participantId of participantIds) {
      await notifyRealtime(execute, CHAT_REALTIME_TOPIC_INBOX, participantId);
    }
  });
}
