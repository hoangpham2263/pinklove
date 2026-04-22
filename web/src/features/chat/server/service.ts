import "server-only";

import {
  CHAT_REALTIME_NOTIFY_CHANNEL,
  CHAT_REALTIME_TOPIC_CONVERSATION,
  CHAT_REALTIME_TOPIC_INBOX,
} from "@/features/chat/realtime";
import type {
  ChatAssignableAccount,
  ChatAttachmentKind,
  ChatConversationDetail,
  ChatConversationKind,
  ChatConversationPriority,
  ChatConversationStatus,
  ChatConversationSummary,
  ChatConversationUserPriority,
  ChatMessage,
  ChatMessageReplyPreview,
  ChatMessageVisibility,
  ChatParticipant,
  ChatSupportRequestCategory,
} from "@/features/chat/types";
import { query, type DbExecutor, withTransaction } from "@/lib/database";
import { isAdminRole, type UserRole, USER_ROLES } from "@/lib/roles";
import { getSystemSettings } from "@/lib/system-settings";

type ConversationRow = {
  id: string;
  title: string;
  kind: ChatConversationKind;
  status: ChatConversationStatus;
  request_category: ChatSupportRequestCategory | null;
  priority: ChatConversationPriority;
  created_at: string;
  updated_at: string;
  owner_user_id: string | null;
  owner_username: string | null;
  owner_display_name: string | null;
  requester_user_id: string | null;
  requester_username: string | null;
  requester_display_name: string | null;
  is_legacy: boolean;
  tags: string[] | null;
  message_count: string;
  unread_count: string;
  is_pinned: boolean | null;
  is_marked_unread: boolean | null;
  user_priority: ChatConversationUserPriority | null;
  last_message_id: string | null;
  last_message_conversation_id: string | null;
  last_message_sender_user_id: string | null;
  last_message_sender_username: string | null;
  last_message_sender_display_name: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  last_message_visibility: ChatMessageVisibility | null;
  last_message_attachment_url: string | null;
  last_message_attachment_kind: ChatAttachmentKind | null;
  typing_display_names: string[] | null;
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
  visibility: ChatMessageVisibility;
  attachment_url: string | null;
  attachment_kind: ChatAttachmentKind | null;
  is_pinned: boolean | null;
  reply_to_message_id: string | null;
  reply_to_body: string | null;
  reply_to_sender_user_id: string | null;
  reply_to_sender_username: string | null;
  reply_to_sender_display_name: string | null;
  created_at: string;
};

type LastSeenRow = {
  display_name: string | null;
  username: string;
};

type ChatViewerContext = {
  viewerRole: UserRole;
  customerFacingTeamName: string;
};

export class ChatError extends Error {
  code: "FORBIDDEN" | "NOT_FOUND" | "INVALID_PAYLOAD" | "NO_ADMIN_AVAILABLE";

  constructor(code: ChatError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export async function buildChatViewerContext(viewerRole: UserRole): Promise<ChatViewerContext> {
  const settings = await getSystemSettings();
  return {
    viewerRole,
    customerFacingTeamName: normalizeCustomerFacingTeamName(
      settings.branding.chatTeamDisplayName,
      settings.branding.siteName
    ),
  };
}

function normalizeCustomerFacingTeamName(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback.trim() || "Website";
}

function parseSupportInboxUsernames(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function normalizeTags(input: string[]) {
  return Array.from(
    new Set(
      input
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 48))
    )
  );
}

function inferAttachmentKind(url: string): ChatAttachmentKind {
  return /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url) ? "image" : "file";
}

function labelSupportRequestCategory(category: ChatSupportRequestCategory | "") {
  switch (category) {
    case "bug_report":
      return "Báo lỗi hệ thống";
    case "order_support":
      return "Hỗ trợ đơn hàng";
    case "billing":
      return "Thanh toán và tài khoản";
    case "affiliate_support":
      return "Hỗ trợ affiliate";
    case "vendor_support":
      return "Hỗ trợ vendor";
    case "other":
      return "Trao đổi khác";
    case "general":
      return "Hỗ trợ chung";
    default:
      return "Trao đổi hỗ trợ";
  }
}

function inferSupportRequestPriority(category: ChatSupportRequestCategory): ChatConversationPriority {
  if (category === "bug_report") return "high";
  return "normal";
}

function buildSupportRequestTitle(category: ChatSupportRequestCategory, requestedTitle?: string) {
  const trimmed = String(requestedTitle ?? "").trim();
  return trimmed || labelSupportRequestCategory(category);
}

function visibleMessageConditionForViewer(viewerRole: UserRole) {
  return viewerRole === USER_ROLES.ADMIN ? "TRUE" : `m.visibility = 'all'`;
}

function presentTeamLabel(
  actualUserId: string,
  currentUserId: string,
  actualDisplayName: string,
  context: ChatViewerContext
) {
  if (context.viewerRole === USER_ROLES.ADMIN || actualUserId === currentUserId) {
    return actualDisplayName;
  }
  return context.customerFacingTeamName;
}

function mapParticipant(row: ParticipantRow): ChatParticipant {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name ?? row.username,
  };
}

function presentParticipant(
  participant: ChatParticipant,
  currentUserId: string,
  context: ChatViewerContext
): ChatParticipant {
  if (context.viewerRole === USER_ROLES.ADMIN || participant.id === currentUserId) {
    return participant;
  }

  return {
    ...participant,
    displayName: context.customerFacingTeamName,
  };
}

function mapReplyPreview(
  row: MessageRow,
  currentUserId: string,
  context: ChatViewerContext
): ChatMessageReplyPreview | undefined {
  if (!row.reply_to_message_id || !row.reply_to_sender_user_id) {
    return undefined;
  }

  return {
    id: row.reply_to_message_id,
    senderUserId: row.reply_to_sender_user_id,
    body: row.reply_to_body ?? "",
    senderDisplayName: presentTeamLabel(
      row.reply_to_sender_user_id,
      currentUserId,
      row.reply_to_sender_display_name ?? row.reply_to_sender_username ?? "",
      context
    ),
  };
}

function mapMessage(row: MessageRow, currentUserId: string, context: ChatViewerContext): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    senderUsername: row.sender_username,
    senderDisplayName: presentTeamLabel(
      row.sender_user_id,
      currentUserId,
      row.sender_display_name ?? row.sender_username,
      context
    ),
    body: row.body,
    visibility: row.visibility,
    attachmentUrl: row.attachment_url ?? "",
    attachmentKind: row.attachment_kind ?? "",
    isPinned: Boolean(row.is_pinned),
    replyTo: mapReplyPreview(row, currentUserId, context),
    createdAt: row.created_at,
  };
}

function mapLastMessage(
  row: ConversationRow,
  currentUserId: string,
  context: ChatViewerContext
): ChatMessage | undefined {
  if (!row.last_message_id || !row.last_message_sender_user_id || !row.last_message_conversation_id) {
    return undefined;
  }

  return {
    id: row.last_message_id,
    conversationId: row.last_message_conversation_id,
    senderUserId: row.last_message_sender_user_id,
    senderUsername: row.last_message_sender_username ?? "",
    senderDisplayName: presentTeamLabel(
      row.last_message_sender_user_id,
      currentUserId,
      row.last_message_sender_display_name ?? row.last_message_sender_username ?? "",
      context
    ),
    body: row.last_message_body ?? "",
    visibility: row.last_message_visibility ?? "all",
    attachmentUrl: row.last_message_attachment_url ?? "",
    attachmentKind: row.last_message_attachment_kind ?? "",
    isPinned: false,
    createdAt: row.last_message_created_at ?? row.updated_at,
  };
}

function summarizeConversationTitle(
  row: ConversationRow,
  participants: ChatParticipant[],
  currentUserId: string,
  context: ChatViewerContext
) {
  const title = row.title.trim();
  if (title) return title;

  if (row.kind === "support") {
    if (row.request_category) {
      return labelSupportRequestCategory(row.request_category);
    }
    if (context.viewerRole === USER_ROLES.ADMIN) {
      const customers = participants.filter((participant) => participant.role === USER_ROLES.CUSTOMER);
      const customerNames = Array.from(
        new Set(customers.map((participant) => participant.displayName || participant.username).filter(Boolean))
      );
      if (customerNames.length > 0) {
        return customerNames.join(", ");
      }
    }
    return context.customerFacingTeamName;
  }

  const others = participants.filter((participant) => participant.id !== currentUserId);
  if (others.length === 0) return "Ghi chú cá nhân";
  return Array.from(
    new Set(others.map((participant) => participant.displayName || participant.username).filter(Boolean))
  ).join(", ");
}

function mapTypingDisplayNames(
  row: ConversationRow,
  context: ChatViewerContext
) {
  const names = row.typing_display_names ?? [];
  if (context.viewerRole === USER_ROLES.ADMIN) {
    return names;
  }
  return names.length > 0 ? [context.customerFacingTeamName] : [];
}

function mapConversation(
  row: ConversationRow,
  participants: ChatParticipant[],
  currentUserId: string,
  context: ChatViewerContext
): ChatConversationSummary {
  return {
    id: row.id,
    title: summarizeConversationTitle(row, participants, currentUserId, context),
    kind: row.kind,
    status: row.status,
    category: row.request_category ?? "",
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    unreadCount: Number(row.unread_count),
    isPinned: Boolean(row.is_pinned),
    isMarkedUnread: Boolean(row.is_marked_unread),
    userPriority: row.user_priority ?? "none",
    tags: row.tags ?? [],
    ownerUserId: row.owner_user_id ?? "",
    ownerDisplayName: row.owner_display_name ?? row.owner_username ?? "",
    requesterUserId: row.requester_user_id ?? "",
    requesterDisplayName: row.requester_display_name ?? row.requester_username ?? "",
    isLegacy: row.is_legacy,
    messageCount: Number(row.message_count ?? "0"),
    typingDisplayNames: mapTypingDisplayNames(row, context),
    participants,
    lastMessage: mapLastMessage(row, currentUserId, context),
  };
}

async function notifyRealtime(execute: DbExecutor, topic: string, resourceId: string) {
  await execute("SELECT pg_notify($1, $2)", [
    CHAT_REALTIME_NOTIFY_CHANNEL,
    JSON.stringify({ topic, resourceId }),
  ]);
}

async function notifyConversationParticipants(execute: DbExecutor, conversationId: string) {
  const participantIds = await listParticipantIds(execute, conversationId);
  await notifyRealtime(execute, CHAT_REALTIME_TOPIC_CONVERSATION, conversationId);
  for (const participantId of participantIds) {
    await notifyRealtime(execute, CHAT_REALTIME_TOPIC_INBOX, participantId);
  }
}

async function ensureConversationMembership(execute: DbExecutor, conversationId: string, userId: string) {
  const membership = await execute<{ conversation_id: string }>(
    `
      SELECT conversation_id
      FROM chat_conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
      LIMIT 1
    `,
    [conversationId, userId]
  );
  return Boolean(membership.rows[0]);
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

async function resolveSupportRecipientIds(execute: DbExecutor, configuredUsernames: string[]): Promise<string[]> {
  if (configuredUsernames.length > 0) {
    const configuredAdmins = await execute<{ id: string }>(
      `
        SELECT id::text AS id
        FROM users
        WHERE role = $1
          AND username = ANY($2::text[])
        ORDER BY created_at ASC
      `,
      [USER_ROLES.ADMIN, configuredUsernames]
    );

    if (configuredAdmins.rows.length > 0) {
      return configuredAdmins.rows.map((row) => row.id);
    }
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
  return adminId ? [adminId] : [];
}

async function listLastSeenBy(
  conversationId: string,
  senderUserId: string,
  messageCreatedAt: string
): Promise<string[]> {
  const result = await query<LastSeenRow>(
    `
      SELECT
        COALESCE(NULLIF(BTRIM(up.display_name), ''), NULLIF(BTRIM(up.full_name), '')) AS display_name,
        u.username
      FROM chat_conversation_participants p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE p.conversation_id = $1
        AND p.user_id <> $2
        AND p.last_read_at >= $3::timestamptz
      ORDER BY p.last_read_at DESC
    `,
    [conversationId, senderUserId, messageCreatedAt]
  );

  return result.rows.map((row) => row.display_name ?? row.username);
}

function buildConversationSelectSql(userIdParamIndex: number, viewerRole: UserRole) {
  const visibleCondition = visibleMessageConditionForViewer(viewerRole);
  return `
    SELECT
      c.id,
      c.title,
      c.kind,
      c.status,
      c.request_category,
      c.priority,
      c.created_at::text AS created_at,
      c.updated_at::text AS updated_at,
      c.owner_user_id::text AS owner_user_id,
      owner.username AS owner_username,
      COALESCE(NULLIF(BTRIM(owner_profile.display_name), ''), NULLIF(BTRIM(owner_profile.full_name), '')) AS owner_display_name,
      c.requester_user_id::text AS requester_user_id,
      requester.username AS requester_username,
      COALESCE(NULLIF(BTRIM(requester_profile.display_name), ''), NULLIF(BTRIM(requester_profile.full_name), '')) AS requester_display_name,
      c.is_legacy,
      c.tags,
      (
        SELECT COUNT(*)::text
        FROM chat_messages conversation_message
        WHERE conversation_message.conversation_id = c.id
          AND ${viewerRole === USER_ROLES.ADMIN ? "TRUE" : "conversation_message.visibility = 'all'"}
      ) AS message_count,
      COALESCE(conversation_state.is_pinned, FALSE) AS is_pinned,
      COALESCE(conversation_state.is_marked_unread, FALSE) AS is_marked_unread,
      COALESCE(conversation_state.priority, 'none') AS user_priority,
      (
        SELECT COUNT(*)::text
        FROM chat_messages unread_message
        WHERE unread_message.conversation_id = c.id
          AND ${viewerRole === USER_ROLES.ADMIN ? "TRUE" : "unread_message.visibility = 'all'"}
          AND unread_message.sender_user_id <> $${userIdParamIndex}
          AND unread_message.created_at > COALESCE(p.last_read_at, to_timestamp(0))
      ) AS unread_count,
      last_message.id AS last_message_id,
      last_message.conversation_id AS last_message_conversation_id,
      last_message.sender_user_id AS last_message_sender_user_id,
      sender.username AS last_message_sender_username,
      COALESCE(NULLIF(BTRIM(sender_profile.display_name), ''), NULLIF(BTRIM(sender_profile.full_name), '')) AS last_message_sender_display_name,
      last_message.body AS last_message_body,
      last_message.created_at::text AS last_message_created_at,
      last_message.visibility AS last_message_visibility,
      last_message.attachment_url AS last_message_attachment_url,
      last_message.attachment_kind AS last_message_attachment_kind,
      (
        SELECT ARRAY_AGG(
          COALESCE(NULLIF(BTRIM(typing_profile.display_name), ''), NULLIF(BTRIM(typing_profile.full_name), ''), typing_user.username)
          ORDER BY typing.updated_at DESC
        )
        FROM chat_typing_states typing
        JOIN users typing_user ON typing_user.id = typing.user_id
        LEFT JOIN user_profiles typing_profile ON typing_profile.user_id = typing_user.id
        WHERE typing.conversation_id = c.id
          AND typing.user_id <> $${userIdParamIndex}
          AND typing.updated_at >= NOW() - INTERVAL '8 seconds'
      ) AS typing_display_names
    FROM chat_conversations c
    JOIN chat_conversation_participants p ON p.conversation_id = c.id
    LEFT JOIN chat_conversation_user_states conversation_state
      ON conversation_state.conversation_id = c.id AND conversation_state.user_id = $${userIdParamIndex}
    LEFT JOIN users owner ON owner.id = c.owner_user_id
    LEFT JOIN user_profiles owner_profile ON owner_profile.user_id = owner.id
    LEFT JOIN users requester ON requester.id = c.requester_user_id
    LEFT JOIN user_profiles requester_profile ON requester_profile.user_id = requester.id
    LEFT JOIN LATERAL (
      SELECT m.*
      FROM chat_messages m
      WHERE m.conversation_id = c.id
        AND ${visibleCondition}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 1
    ) last_message ON true
    LEFT JOIN users sender ON sender.id = last_message.sender_user_id
    LEFT JOIN user_profiles sender_profile ON sender_profile.user_id = sender.id
    WHERE p.user_id = $${userIdParamIndex}
      AND COALESCE(conversation_state.is_hidden, FALSE) = FALSE
  `;
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

export async function listChatConversationsForViewer(
  userId: string,
  context: ChatViewerContext
): Promise<ChatConversationSummary[]> {
  const result = await query<ConversationRow>(
    `
      ${buildConversationSelectSql(1, context.viewerRole)}
      ORDER BY
        COALESCE(conversation_state.is_pinned, FALSE) DESC,
        CASE COALESCE(conversation_state.priority, 'none')
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 3
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 1
          ELSE 0
        END DESC,
        c.updated_at DESC
    `,
    [userId]
  );

  const participantsByConversation = await listParticipantsForConversations(result.rows.map((row) => row.id));
  return result.rows.map((row) => {
    const participants = (participantsByConversation.get(row.id) ?? []).map((participant) =>
      presentParticipant(participant, userId, context)
    );
    return mapConversation(row, participants, userId, context);
  });
}

export async function getChatConversationDetailForViewer(
  userId: string,
  conversationId: string,
  context: ChatViewerContext
): Promise<ChatConversationDetail | null> {
  const result = await query<ConversationRow>(
    `
      ${buildConversationSelectSql(2, context.viewerRole)}
      AND c.id = $1
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
          m.visibility,
          m.attachment_url,
          m.attachment_kind,
          COALESCE(message_state.is_pinned, FALSE) AS is_pinned,
          m.reply_to_message_id,
          reply.body AS reply_to_body,
          reply.sender_user_id AS reply_to_sender_user_id,
          reply_sender.username AS reply_to_sender_username,
          COALESCE(NULLIF(BTRIM(reply_sender_profile.display_name), ''), NULLIF(BTRIM(reply_sender_profile.full_name), '')) AS reply_to_sender_display_name,
          m.created_at::text AS created_at
        FROM chat_messages m
        JOIN users u ON u.id = m.sender_user_id
        LEFT JOIN user_profiles p ON p.user_id = u.id
        LEFT JOIN chat_message_user_states message_state
          ON message_state.message_id = m.id AND message_state.user_id = $2
        LEFT JOIN chat_messages reply
          ON reply.id = m.reply_to_message_id
          AND ${context.viewerRole === USER_ROLES.ADMIN ? "TRUE" : "reply.visibility = 'all'"}
        LEFT JOIN users reply_sender ON reply_sender.id = reply.sender_user_id
        LEFT JOIN user_profiles reply_sender_profile ON reply_sender_profile.user_id = reply_sender.id
        WHERE m.conversation_id = $1
          AND ${context.viewerRole === USER_ROLES.ADMIN ? "TRUE" : "m.visibility = 'all'"}
        ORDER BY m.created_at ASC, m.id ASC
      `,
      [conversationId, userId]
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

  await query(
    `
      UPDATE chat_conversation_user_states
      SET is_marked_unread = FALSE, updated_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2
    `,
    [conversationId, userId]
  );

  const participants = (participantsByConversation.get(conversationId) ?? []).map((participant) =>
    presentParticipant(participant, userId, context)
  );
  const visibleMessages = messages.rows.map((message) => mapMessage(message, userId, context));
  const lastMessage = visibleMessages.at(-1);
  const lastSeenByDisplayNames =
    lastMessage && context.viewerRole === USER_ROLES.ADMIN
      ? await listLastSeenBy(conversationId, lastMessage.senderUserId, lastMessage.createdAt)
      : [];

  return {
    ...mapConversation(
      {
        ...row,
        unread_count: "0",
        is_marked_unread: false,
      },
      participants,
      userId,
      context
    ),
    messages: visibleMessages,
    lastSeenByDisplayNames,
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

  const participantIds = Array.from(
    new Set([input.actorUserId, ...input.participantUserIds.map((id) => id.trim()).filter(Boolean)])
  );
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
        INSERT INTO chat_conversations (title, kind, created_by_user_id, owner_user_id)
        VALUES ($1, $2, $3, $3)
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
    }
    return conversationId;
  });
}

export async function createSupportRequestConversation(input: {
  requesterUserId: string;
  category: ChatSupportRequestCategory;
  title?: string;
}): Promise<string> {
  const settings = await getSystemSettings();
  const configuredUsernames = parseSupportInboxUsernames(settings.branding.supportInboxUsernames);

  return withTransaction(async (execute) => {
    const recipientIds = await resolveSupportRecipientIds(execute, configuredUsernames);
    if (recipientIds.length === 0) {
      throw new ChatError("NO_ADMIN_AVAILABLE", "No admin account is available for support chat.");
    }

    const created = await execute<{ id: string }>(
      `
        INSERT INTO chat_conversations (
          title,
          kind,
          created_by_user_id,
          owner_user_id,
          requester_user_id,
          request_category,
          priority,
          is_legacy
        )
        VALUES ($1, 'support', $2, $3, $2, $4, $5, FALSE)
        RETURNING id
      `,
      [
        buildSupportRequestTitle(input.category, input.title),
        input.requesterUserId,
        recipientIds[0],
        input.category,
        inferSupportRequestPriority(input.category),
      ]
    );

    const conversationId = created.rows[0].id;
    for (const participantId of [input.requesterUserId, ...recipientIds]) {
      await execute(
        `
          INSERT INTO chat_conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [conversationId, participantId]
      );
    }
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
    const actorMembership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!actorMembership) {
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

    await notifyConversationParticipants(execute, input.conversationId);
  });
}

export async function updateChatConversationMeta(input: {
  actorUserId: string;
  actorRole: UserRole;
  conversationId: string;
  ownerUserId?: string;
  status?: ChatConversationStatus;
  tags?: string[];
}): Promise<void> {
  if (!isAdminRole(input.actorRole)) {
    throw new ChatError("FORBIDDEN", "Only admins can update conversation metadata.");
  }

  await withTransaction(async (execute) => {
    const actorMembership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!actorMembership) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    let ownerUserId = input.ownerUserId?.trim() ?? "";
    if (ownerUserId) {
      const ownerExists = await execute<{ id: string }>(
        `
          SELECT id::text AS id
          FROM chat_conversation_participants
          WHERE conversation_id = $1 AND user_id = $2
          LIMIT 1
        `,
        [input.conversationId, ownerUserId]
      );
      if (!ownerExists.rows[0]) {
        throw new ChatError("INVALID_PAYLOAD", "Owner must be a participant in the conversation.");
      }
    } else {
      ownerUserId = "";
    }

    await execute(
      `
        UPDATE chat_conversations
        SET
          owner_user_id = $2::text,
          status = COALESCE($3, status),
          tags = COALESCE($4::text[], tags),
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        input.conversationId,
        ownerUserId || null,
        input.status ?? null,
        input.tags ? normalizeTags(input.tags) : null,
      ]
    );

    await notifyConversationParticipants(execute, input.conversationId);
  });
}

export async function updateChatConversationUserState(input: {
  actorUserId: string;
  conversationId: string;
  isPinned?: boolean;
  priority?: ChatConversationUserPriority;
  isHidden?: boolean;
  markUnread?: boolean;
}): Promise<void> {
  await withTransaction(async (execute) => {
    const membership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!membership) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    const existing = await execute<{
      is_pinned: boolean;
      is_marked_unread: boolean;
      priority: ChatConversationUserPriority;
      is_hidden: boolean;
    }>(
      `
        SELECT is_pinned, is_marked_unread, priority, is_hidden
        FROM chat_conversation_user_states
        WHERE conversation_id = $1 AND user_id = $2
        LIMIT 1
      `,
      [input.conversationId, input.actorUserId]
    );

    const current = existing.rows[0];
    const isPinned = input.isPinned ?? current?.is_pinned ?? false;
    const isMarkedUnread = input.markUnread ? true : current?.is_marked_unread ?? false;
    const priority = input.priority ?? current?.priority ?? "none";
    const isHidden = input.isHidden ?? current?.is_hidden ?? false;

    await execute(
      `
        INSERT INTO chat_conversation_user_states (conversation_id, user_id, is_pinned, is_marked_unread, priority, is_hidden, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (conversation_id, user_id)
        DO UPDATE SET
          is_pinned = EXCLUDED.is_pinned,
          is_marked_unread = EXCLUDED.is_marked_unread,
          priority = EXCLUDED.priority,
          is_hidden = EXCLUDED.is_hidden,
          updated_at = NOW()
      `,
      [input.conversationId, input.actorUserId, isPinned, isMarkedUnread, priority, isHidden]
    );

    await notifyRealtime(execute, CHAT_REALTIME_TOPIC_INBOX, input.actorUserId);
  });
}

export async function updateChatTypingState(input: {
  actorUserId: string;
  conversationId: string;
  isTyping: boolean;
}): Promise<void> {
  await withTransaction(async (execute) => {
    const membership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!membership) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    if (input.isTyping) {
      await execute(
        `
          INSERT INTO chat_typing_states (conversation_id, user_id, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (conversation_id, user_id)
          DO UPDATE SET updated_at = NOW()
        `,
        [input.conversationId, input.actorUserId]
      );
    } else {
      await execute(
        `
          DELETE FROM chat_typing_states
          WHERE conversation_id = $1 AND user_id = $2
        `,
        [input.conversationId, input.actorUserId]
      );
    }
  });
}

export async function sendChatMessage(input: {
  actorUserId: string;
  actorRole: UserRole;
  conversationId: string;
  body: string;
  attachmentUrl?: string;
  replyToMessageId?: string;
  visibility?: ChatMessageVisibility;
}): Promise<void> {
  const body = input.body.trim();
  const attachmentUrl = String(input.attachmentUrl ?? "").trim();
  const replyToMessageId = String(input.replyToMessageId ?? "").trim();
  const visibility: ChatMessageVisibility =
    input.visibility === "internal" && isAdminRole(input.actorRole) ? "internal" : "all";

  if (!body && !attachmentUrl) {
    throw new ChatError("INVALID_PAYLOAD", "Message body or attachment is required.");
  }

  await withTransaction(async (execute) => {
    const membership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!membership) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    if (replyToMessageId) {
      const replied = await execute<{ id: string }>(
        `
          SELECT id
          FROM chat_messages
          WHERE id = $1 AND conversation_id = $2
          LIMIT 1
        `,
        [replyToMessageId, input.conversationId]
      );
      if (!replied.rows[0]) {
        throw new ChatError("INVALID_PAYLOAD", "Reply target does not exist in this conversation.");
      }
    }

    await execute(
      `
        INSERT INTO chat_messages (
          conversation_id,
          sender_user_id,
          body,
          visibility,
          attachment_url,
          attachment_kind,
          reply_to_message_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        input.conversationId,
        input.actorUserId,
        body,
        visibility,
        attachmentUrl || null,
        attachmentUrl ? inferAttachmentKind(attachmentUrl) : null,
        replyToMessageId || null,
      ]
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
        UPDATE chat_conversation_user_states
        SET is_hidden = FALSE, updated_at = NOW()
        WHERE conversation_id = $1
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

    await execute(
      `
        UPDATE chat_conversation_user_states
        SET is_marked_unread = FALSE, updated_at = NOW()
        WHERE conversation_id = $1 AND user_id = $2
      `,
      [input.conversationId, input.actorUserId]
    );

    await execute(
      `
        DELETE FROM chat_typing_states
        WHERE conversation_id = $1 AND user_id = $2
      `,
      [input.conversationId, input.actorUserId]
    );
  });
}

export async function updateChatMessageUserState(input: {
  actorUserId: string;
  conversationId: string;
  messageId: string;
  isPinned?: boolean;
}): Promise<void> {
  const messageId = input.messageId.trim();
  if (!messageId) {
    throw new ChatError("INVALID_PAYLOAD", "Message id is required.");
  }

  await withTransaction(async (execute) => {
    const membership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!membership) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    const messageResult = await execute<{ id: string }>(
      `
        SELECT id
        FROM chat_messages
        WHERE id = $1 AND conversation_id = $2
        LIMIT 1
      `,
      [messageId, input.conversationId]
    );
    if (!messageResult.rows[0]) {
      throw new ChatError("NOT_FOUND", "Message does not exist in this conversation.");
    }

    await execute(
      `
        INSERT INTO chat_message_user_states (message_id, user_id, is_pinned, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (message_id, user_id)
        DO UPDATE SET
          is_pinned = EXCLUDED.is_pinned,
          updated_at = NOW()
      `,
      [messageId, input.actorUserId, input.isPinned ?? false]
    );
  });
}

export async function deleteChatMessage(input: {
  actorUserId: string;
  actorRole: UserRole;
  conversationId: string;
  messageId: string;
}): Promise<void> {
  const messageId = input.messageId.trim();
  if (!messageId) {
    throw new ChatError("INVALID_PAYLOAD", "Message id is required.");
  }

  await withTransaction(async (execute) => {
    const membership = await ensureConversationMembership(execute, input.conversationId, input.actorUserId);
    if (!membership) {
      throw new ChatError("FORBIDDEN", "You are not a participant in this conversation.");
    }

    const messageResult = await execute<{
      id: string;
      sender_user_id: string;
    }>(
      `
        SELECT id, sender_user_id::text AS sender_user_id
        FROM chat_messages
        WHERE id = $1 AND conversation_id = $2
        LIMIT 1
      `,
      [messageId, input.conversationId]
    );

    const message = messageResult.rows[0];
    if (!message) {
      throw new ChatError("NOT_FOUND", "Message does not exist in this conversation.");
    }

    const canDelete = isAdminRole(input.actorRole) || message.sender_user_id === input.actorUserId;
    if (!canDelete) {
      throw new ChatError("FORBIDDEN", "You cannot delete this message.");
    }

    await execute(
      `
        DELETE FROM chat_messages
        WHERE id = $1 AND conversation_id = $2
      `,
      [messageId, input.conversationId]
    );

    await execute(
      `
        UPDATE chat_conversations
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [input.conversationId]
    );

    await notifyConversationParticipants(execute, input.conversationId);
  });
}
