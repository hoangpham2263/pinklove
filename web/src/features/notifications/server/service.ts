import "server-only";

import { query, withTransaction, type DbExecutor } from "@/lib/database";
import { parseUserRole, type UserRole, USER_ROLES } from "@/lib/roles";
import type {
  AdminNotification,
  NotificationAudienceType,
  NotificationStatus,
  NotificationSummary,
  UserNotification,
} from "@/features/notifications/types";

export const NOTIFICATION_REALTIME_CHANNEL = "app_realtime";
export const NOTIFICATION_REALTIME_TOPIC_USER = "notifications-user";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  link_url: string;
  audience_type: NotificationAudienceType;
  created_at: string;
  read_at: string | null;
  dismissed_at?: string | null;
};

type AdminNotificationRow = {
  id: string;
  title: string;
  body: string;
  link_url: string;
  audience_type: NotificationAudienceType;
  status: NotificationStatus;
  created_by_username: string | null;
  created_at: string;
  updated_at: string;
  scheduled_at: string | null;
  roles: UserRole[] | null;
  target_users: Array<{ id: string; accountName: string; role: UserRole }> | null;
};

function mapUserNotification(row: NotificationRow): UserNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    audienceType: row.audience_type,
    createdAt: row.created_at,
    readAt: row.read_at ?? "",
    isRead: Boolean(row.read_at),
  };
}

function sanitizeNotificationLinkUrl(value: string) {
  const linkUrl = value.trim();
  if (!linkUrl || !linkUrl.startsWith("/") || linkUrl.startsWith("//")) {
    return "";
  }
  return linkUrl;
}

function parseScheduledDate(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const parsedValue = new Date(trimmedValue);
  if (Number.isNaN(parsedValue.getTime())) {
    return null;
  }

  return parsedValue;
}

function resolveNotificationStatus(
  sendMode: "draft" | "now" | "scheduled",
  scheduledAt: Date | null | undefined
): NotificationStatus {
  if (sendMode === "draft") {
    return "draft";
  }

  if (sendMode === "scheduled" && scheduledAt && scheduledAt.getTime() > Date.now() + 30_000) {
    return "scheduled";
  }

  return "sent";
}

function mapAdminNotification(row: AdminNotificationRow): AdminNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    audienceType: row.audience_type,
    status: row.status,
    roles: row.roles ?? [],
    targetUsers: row.target_users ?? [],
    createdByUsername: row.created_by_username ?? "System",
    createdAt: row.created_at,
    scheduledAt: row.scheduled_at ?? "",
    updatedAt: row.updated_at,
  };
}

async function notifyUsers(execute: DbExecutor, userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  for (const userId of uniqueUserIds) {
    await execute(
      "SELECT pg_notify($1, json_build_object('topic', $2::text, 'resourceId', $3::text)::text)",
      [NOTIFICATION_REALTIME_CHANNEL, NOTIFICATION_REALTIME_TOPIC_USER, userId]
    );
  }
}

async function resolveAudienceUserIds(
  execute: DbExecutor,
  audienceType: NotificationAudienceType,
  roles: UserRole[],
  userIds: string[]
) {
  if (audienceType === "all") {
    const result = await execute<{ id: string }>("SELECT id FROM users", []);
    return result.rows.map((row) => row.id);
  }

  if (audienceType === "role") {
    const result = await execute<{ id: string }>(
      "SELECT id FROM users WHERE role = ANY($1::text[])",
      [roles]
    );
    return result.rows.map((row) => row.id);
  }

  return userIds;
}

async function resolveNotificationAudienceUserIds(execute: DbExecutor, notificationId: string) {
  const notification = await execute<{
    audience_type: NotificationAudienceType;
  }>("SELECT audience_type FROM notifications WHERE id = $1 LIMIT 1", [notificationId]);
  const audienceType = notification.rows[0]?.audience_type;
  if (!audienceType) {
    return [];
  }

  const roleResult = await execute<{ role: UserRole }>(
    "SELECT role FROM notification_target_roles WHERE notification_id = $1",
    [notificationId]
  );
  const userResult = await execute<{ user_id: string }>(
    "SELECT user_id FROM notification_target_users WHERE notification_id = $1",
    [notificationId]
  );

  return resolveAudienceUserIds(
    execute,
    audienceType,
    roleResult.rows.map((row) => row.role),
    userResult.rows.map((row) => row.user_id)
  );
}

export async function publishDueScheduledNotifications() {
  await withTransaction(async (execute) => {
    const due = await execute<{ id: string }>(
      `
        SELECT id
        FROM notifications
        WHERE status = 'scheduled'
          AND scheduled_at IS NOT NULL
          AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC, created_at ASC
        LIMIT 50
      `,
      []
    );

    for (const row of due.rows) {
      await execute(
        "UPDATE notifications SET status = 'sent', updated_at = NOW() WHERE id = $1 AND status = 'scheduled'",
        [row.id]
      );
      const affectedUserIds = await resolveNotificationAudienceUserIds(execute, row.id);
      await notifyUsers(execute, affectedUserIds);
    }
  });
}

export async function listNotificationsForUser(userId: string, role: UserRole, limit = 30): Promise<UserNotification[]> {
  const result = await query<NotificationRow>(
    `
      SELECT
        n.id,
        n.title,
        n.body,
        n.link_url,
        n.audience_type,
        n.created_at::text AS created_at,
        s.read_at::text AS read_at
      FROM notifications n
      LEFT JOIN notification_user_states s
        ON s.notification_id = n.id AND s.user_id = $1
      WHERE n.status = 'sent'
        AND s.dismissed_at IS NULL
        AND (
          n.audience_type = 'all'
          OR EXISTS (
            SELECT 1
            FROM notification_target_roles r
            WHERE r.notification_id = n.id AND r.role = $2
          )
          OR EXISTS (
            SELECT 1
            FROM notification_target_users u
            WHERE u.notification_id = n.id AND u.user_id = $1
          )
        )
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT $3
    `,
    [userId, role, limit]
  );

  return result.rows.map(mapUserNotification);
}

export async function listPublicNotifications(limit = 20): Promise<UserNotification[]> {
  const result = await query<NotificationRow>(
    `
      SELECT
        n.id,
        n.title,
        n.body,
        n.link_url,
        n.audience_type,
        n.created_at::text AS created_at,
        NULL::text AS read_at
      FROM notifications n
      WHERE n.status = 'sent'
        AND n.audience_type = 'all'
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapUserNotification);
}

export async function getNotificationSummaryForUser(userId: string, role: UserRole): Promise<NotificationSummary> {
  const result = await query<{
    unread_count: string;
    latest_created_at: string | null;
    latest_state_updated_at: string | null;
  }>(
    `
      WITH visible_notifications AS (
        SELECT n.id, n.created_at
        FROM notifications n
        LEFT JOIN notification_user_states s
          ON s.notification_id = n.id AND s.user_id = $1
        WHERE n.status = 'sent'
          AND (
            n.audience_type = 'all'
            OR EXISTS (
              SELECT 1
              FROM notification_target_roles r
              WHERE r.notification_id = n.id AND r.role = $2
            )
            OR EXISTS (
              SELECT 1
              FROM notification_target_users u
              WHERE u.notification_id = n.id AND u.user_id = $1
            )
          )
          AND s.dismissed_at IS NULL
      )
      SELECT
        COUNT(*) FILTER (WHERE s.read_at IS NULL)::text AS unread_count,
        MAX(v.created_at)::text AS latest_created_at,
        MAX(s.updated_at)::text AS latest_state_updated_at
      FROM visible_notifications v
      LEFT JOIN notification_user_states s
        ON s.notification_id = v.id AND s.user_id = $1
    `,
    [userId, role]
  );
  const nextScheduledResult = await query<{ next_scheduled_at: string | null }>(
    `
      SELECT MIN(n.scheduled_at)::text AS next_scheduled_at
      FROM notifications n
      WHERE n.status = 'scheduled'
        AND n.scheduled_at > NOW()
        AND (
          n.audience_type = 'all'
          OR EXISTS (
            SELECT 1
            FROM notification_target_roles r
            WHERE r.notification_id = n.id AND r.role = $2
          )
          OR EXISTS (
            SELECT 1
            FROM notification_target_users u
            WHERE u.notification_id = n.id AND u.user_id = $1
          )
        )
    `,
    [userId, role]
  );

  const row = result.rows[0];
  return {
    unreadCount: Number(row?.unread_count ?? "0"),
    latestCreatedAt: [row?.latest_created_at ?? "", row?.latest_state_updated_at ?? ""].join("|"),
    nextScheduledAt: nextScheduledResult.rows[0]?.next_scheduled_at ?? "",
  };
}

export async function dismissNotificationForUser(userId: string, notificationId: string) {
  await withTransaction(async (execute) => {
    await execute(
      `
        INSERT INTO notification_user_states (notification_id, user_id, read_at, dismissed_at, updated_at)
        VALUES ($1, $2, NOW(), NOW(), NOW())
        ON CONFLICT (notification_id, user_id)
        DO UPDATE SET dismissed_at = NOW(), read_at = COALESCE(notification_user_states.read_at, NOW()), updated_at = NOW()
      `,
      [notificationId, userId]
    );
    await notifyUsers(execute, [userId]);
  });
}

export async function dismissAllNotificationsForUser(userId: string, role: UserRole) {
  const notifications = await listNotificationsForUser(userId, role, 500);
  await withTransaction(async (execute) => {
    for (const item of notifications) {
      await execute(
        `
          INSERT INTO notification_user_states (notification_id, user_id, read_at, dismissed_at, updated_at)
          VALUES ($1, $2, NOW(), NOW(), NOW())
          ON CONFLICT (notification_id, user_id)
          DO UPDATE SET dismissed_at = NOW(), read_at = COALESCE(notification_user_states.read_at, NOW()), updated_at = NOW()
        `,
        [item.id, userId]
      );
    }
    await notifyUsers(execute, [userId]);
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await withTransaction(async (execute) => {
    await execute(
      `
        INSERT INTO notification_user_states (notification_id, user_id, read_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (notification_id, user_id)
        DO UPDATE SET read_at = COALESCE(notification_user_states.read_at, NOW()), updated_at = NOW()
      `,
      [notificationId, userId]
    );
    await notifyUsers(execute, [userId]);
  });
}

export async function markAllNotificationsRead(userId: string, role: UserRole) {
  const notifications = await listNotificationsForUser(userId, role, 500);
  await withTransaction(async (execute) => {
    for (const item of notifications) {
      await execute(
        `
          INSERT INTO notification_user_states (notification_id, user_id, read_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT (notification_id, user_id)
          DO UPDATE SET read_at = COALESCE(notification_user_states.read_at, NOW()), updated_at = NOW()
        `,
        [item.id, userId]
      );
    }
    await notifyUsers(execute, [userId]);
  });
}

export async function createAdminNotification(input: {
  actorUserId: string;
  title: string;
  body: string;
  linkUrl?: string;
  scheduledAt?: string;
  sendMode?: "draft" | "now" | "scheduled";
  audienceType: NotificationAudienceType;
  roles?: UserRole[];
  userIds?: string[];
}) {
  const title = input.title.trim();
  const body = input.body.trim();
  const audienceType = input.audienceType;
  const linkUrl = sanitizeNotificationLinkUrl(input.linkUrl ?? "");
  const roles =
    audienceType === "role"
      ? Array.from(new Set((input.roles ?? []).map((role) => parseUserRole(role, USER_ROLES.CUSTOMER))))
      : [];
  const userIds = audienceType === "users" ? Array.from(new Set(input.userIds ?? [])) : [];
  const scheduledAt = parseScheduledDate(input.scheduledAt) ?? null;
  const sendMode = input.sendMode ?? "now";
  const status = resolveNotificationStatus(sendMode, scheduledAt);

  if (!title) {
    throw new Error("MISSING_TITLE");
  }
  if (audienceType === "role" && roles.length === 0) {
    throw new Error("MISSING_ROLES");
  }
  if (audienceType === "users" && userIds.length === 0) {
    throw new Error("MISSING_USERS");
  }

  return withTransaction(async (execute) => {
    const created = await execute<{ id: string }>(
      `
        INSERT INTO notifications (title, body, link_url, audience_type, created_by_user_id, status, scheduled_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [title, body, linkUrl, audienceType, input.actorUserId, status, scheduledAt]
    );
    const notificationId = created.rows[0].id;

    for (const role of roles) {
      await execute(
        "INSERT INTO notification_target_roles (notification_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [notificationId, role]
      );
    }

    for (const userId of userIds) {
      await execute(
        "INSERT INTO notification_target_users (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [notificationId, userId]
      );
    }

    if (status === "sent") {
      const affectedUserIds = await resolveAudienceUserIds(execute, audienceType, roles, userIds);
      await notifyUsers(execute, affectedUserIds);
    }
    return notificationId;
  });
}

export async function listAdminNotifications(limit = 30): Promise<AdminNotification[]> {
  const result = await query<AdminNotificationRow>(
    `
      SELECT
        n.id,
        n.title,
        n.body,
        n.link_url,
        n.audience_type,
        n.status,
        creator.account_name AS created_by_username,
        n.created_at::text AS created_at,
        n.updated_at::text AS updated_at,
        n.scheduled_at::text AS scheduled_at,
        COALESCE(
          ARRAY_AGG(DISTINCT r.role) FILTER (WHERE r.role IS NOT NULL),
          ARRAY[]::text[]
        ) AS roles,
        COALESCE(
          JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', u.id, 'accountName', u.account_name, 'role', u.role))
            FILTER (WHERE u.id IS NOT NULL),
          '[]'::jsonb
        ) AS target_users
      FROM notifications n
      LEFT JOIN users creator ON creator.id = n.created_by_user_id
      LEFT JOIN notification_target_roles r ON r.notification_id = n.id
      LEFT JOIN notification_target_users tu ON tu.notification_id = n.id
      LEFT JOIN users u ON u.id = tu.user_id
      GROUP BY n.id, creator.account_name
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapAdminNotification);
}

export async function updateAdminNotification(
  notificationId: string,
  input: {
    title?: string;
    body?: string;
    linkUrl?: string;
    scheduledAt?: string;
    sendMode?: "draft" | "now" | "scheduled";
    audienceType?: NotificationAudienceType;
    roles?: UserRole[];
    userIds?: string[];
  }
) {
  const existingResult = await query<AdminNotificationRow>(
    `
      SELECT
        n.id,
        n.title,
        n.body,
        n.link_url,
        n.audience_type,
        n.status,
        creator.account_name AS created_by_username,
        n.created_at::text AS created_at,
        n.updated_at::text AS updated_at,
        n.scheduled_at::text AS scheduled_at,
        COALESCE(
          ARRAY_AGG(DISTINCT r.role) FILTER (WHERE r.role IS NOT NULL),
          ARRAY[]::text[]
        ) AS roles,
        COALESCE(
          JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', u.id, 'accountName', u.account_name, 'role', u.role))
            FILTER (WHERE u.id IS NOT NULL),
          '[]'::jsonb
        ) AS target_users
      FROM notifications n
      LEFT JOIN users creator ON creator.id = n.created_by_user_id
      LEFT JOIN notification_target_roles r ON r.notification_id = n.id
      LEFT JOIN notification_target_users tu ON tu.notification_id = n.id
      LEFT JOIN users u ON u.id = tu.user_id
      WHERE n.id = $1
      GROUP BY n.id, creator.account_name
      LIMIT 1
    `,
    [notificationId]
  );

  const existing = existingResult.rows[0];
  if (!existing) {
    return null;
  }

  const audienceType = input.audienceType ?? existing.audience_type;
  const title = input.title?.trim() ?? existing.title;
  const body = input.body?.trim() ?? existing.body;
  const linkUrl = input.linkUrl !== undefined ? sanitizeNotificationLinkUrl(input.linkUrl) : existing.link_url;
  const roles =
    audienceType === "role"
      ? Array.from(new Set((input.roles ?? existing.roles ?? []).map((role) => parseUserRole(role, USER_ROLES.CUSTOMER))))
      : [];
  const userIds =
    audienceType === "users"
      ? Array.from(new Set((input.userIds ?? existing.target_users?.map((user) => user.id) ?? []).filter(Boolean)))
      : [];
  const scheduledAtInput = input.scheduledAt !== undefined ? input.scheduledAt : existing.scheduled_at ?? "";
  const scheduledAt = parseScheduledDate(scheduledAtInput) ?? null;
  const sendMode =
    input.sendMode
    ?? (existing.status === "draft" ? "draft" : existing.status === "scheduled" ? "scheduled" : "now");
  const status = resolveNotificationStatus(sendMode, scheduledAt);

  if (!title) {
    throw new Error("MISSING_TITLE");
  }
  if (audienceType === "role" && roles.length === 0) {
    throw new Error("MISSING_ROLES");
  }
  if (audienceType === "users" && userIds.length === 0) {
    throw new Error("MISSING_USERS");
  }

  return withTransaction(async (execute) => {
    await execute(
      `
        UPDATE notifications
        SET
          title = $2,
          body = $3,
          link_url = $4,
          audience_type = $5,
          status = $6,
          scheduled_at = $7,
          updated_at = NOW()
        WHERE id = $1
      `,
      [notificationId, title, body, linkUrl, audienceType, status, scheduledAt]
    );

    await execute("DELETE FROM notification_target_roles WHERE notification_id = $1", [notificationId]);
    await execute("DELETE FROM notification_target_users WHERE notification_id = $1", [notificationId]);

    for (const role of roles) {
      await execute(
        "INSERT INTO notification_target_roles (notification_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [notificationId, role]
      );
    }

    for (const userId of userIds) {
      await execute(
        "INSERT INTO notification_target_users (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [notificationId, userId]
      );
    }

    if (status === "sent" && existing.status !== "sent") {
      const affectedUserIds = await resolveAudienceUserIds(execute, audienceType, roles, userIds);
      await notifyUsers(execute, affectedUserIds);
    }

    return true;
  });
}

export async function deleteAdminNotification(notificationId: string): Promise<boolean> {
  const result = await query(
    `
      DELETE FROM notifications
      WHERE id = $1
      RETURNING id
    `,
    [notificationId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function deleteAdminNotifications(notificationIds: string[]): Promise<number> {
  if (notificationIds.length === 0) {
    return 0;
  }

  const result = await query(
    `
      DELETE FROM notifications
      WHERE id = ANY($1::text[])
    `,
    [notificationIds]
  );

  return result.rowCount ?? 0;
}

export async function updateAdminNotificationsStatus(
  notificationIds: string[],
  status: Extract<NotificationStatus, "draft" | "sent" | "archived">
): Promise<number> {
  if (notificationIds.length === 0) {
    return 0;
  }

  return withTransaction(async (execute) => {
    const previousResult = await execute<{ id: string; status: NotificationStatus }>(
      "SELECT id, status FROM notifications WHERE id = ANY($1::text[])",
      [notificationIds]
    );
    const previousById = new Map(previousResult.rows.map((row) => [row.id, row.status]));

    const result = await execute<{ id: string }>(
      `
        UPDATE notifications
        SET
          status = $2,
          scheduled_at = CASE WHEN $2 = 'sent' THEN NULL ELSE scheduled_at END,
          updated_at = NOW()
        WHERE id = ANY($1::text[])
        RETURNING id
      `,
      [notificationIds, status]
    );

    if (status === "sent") {
      for (const row of result.rows) {
        if (previousById.get(row.id) === "sent") {
          continue;
        }

        const affectedUserIds = await resolveNotificationAudienceUserIds(execute, row.id);
        await notifyUsers(execute, affectedUserIds);
      }
    }

    return result.rowCount ?? 0;
  });
}
