import "server-only";

import { getOrderById, listAllOrders } from "@/features/ecommerce/server/service";
import {
  REALTIME_NOTIFY_CHANNEL,
  REALTIME_TOPIC_PROVIDER_ASSIGNMENT,
  REALTIME_TOPIC_PROVIDER_PORTAL,
} from "@/features/provider-orders/realtime";
import type {
  ProviderAssignmentStatus,
  ProviderEventActorType,
  ProviderEventType,
  ProviderOrderAssignment,
  ProviderOrderDetail,
  ProviderOrderEvent,
  ProviderOrderSummary,
} from "@/features/provider-orders/types";
import { query, type DbExecutor, withTransaction } from "@/lib/database";
import { USER_ROLES } from "@/lib/roles";
import { getProviderAssignmentStatusLabel } from "@/lib/status-labels";

type ProviderAssignmentRow = {
  id: string;
  order_id: string;
  provider_user_id: string;
  provider_username: string;
  provider_display_name: string | null;
  status: ProviderAssignmentStatus;
  internal_note: string;
  provider_note: string;
  provider_reference: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProviderEventRow = {
  id: string;
  assignment_id: string;
  actor_user_id: string | null;
  actor_username: string | null;
  actor_type: ProviderEventActorType;
  event_type: ProviderEventType;
  message: string;
  created_at: string;
};

type UpsertProviderAssignmentInput = {
  orderId: string;
  providerId: string;
  internalNote?: string;
  actorUserId: string;
};

type UpdateProviderAssignmentInput = {
  assignmentId: string;
  providerId: string;
  status: ProviderAssignmentStatus;
  providerNote?: string;
  providerReference?: string;
};

type RecordAdminOrderUpdateInput = {
  orderId: string;
  actorUserId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

export class ProviderAssignmentError extends Error {
  code: "INVALID_PROVIDER" | "ASSIGNMENT_NOT_FOUND";

  constructor(code: "INVALID_PROVIDER" | "ASSIGNMENT_NOT_FOUND", message: string) {
    super(message);
    this.code = code;
  }
}

function mapAssignmentRow(row: ProviderAssignmentRow): ProviderOrderAssignment {
  return {
    id: row.id,
    orderId: row.order_id,
    providerId: row.provider_user_id,
    providerUsername: row.provider_username,
    providerDisplayName: row.provider_display_name ?? row.provider_username,
    status: row.status,
    internalNote: row.internal_note,
    providerNote: row.provider_note,
    providerReference: row.provider_reference,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventRow(row: ProviderEventRow): ProviderOrderEvent {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    actorUserId: row.actor_user_id ?? undefined,
    actorUsername: row.actor_username ?? undefined,
    actorType: row.actor_type,
    eventType: row.event_type,
    message: row.message,
    createdAt: row.created_at,
  };
}

async function notifyRealtime(execute: DbExecutor, topic: string, resourceId: string) {
  await execute("SELECT pg_notify($1, $2)", [
    REALTIME_NOTIFY_CHANNEL,
    JSON.stringify({ topic, resourceId }),
  ]);
}

async function getAssignmentRowById(assignmentId: string): Promise<ProviderAssignmentRow | null> {
  const result = await query<ProviderAssignmentRow>(
    `
      SELECT
        a.id,
        a.order_id,
        a.provider_user_id,
        u.username AS provider_username,
        COALESCE(NULLIF(BTRIM(p.display_name), ''), NULLIF(BTRIM(p.full_name), '')) AS provider_display_name,
        a.status,
        a.internal_note,
        a.provider_note,
        a.provider_reference,
        a.assigned_at,
        a.accepted_at,
        a.completed_at,
        a.created_at,
        a.updated_at
      FROM provider_order_assignments a
      JOIN users u ON u.id = a.provider_user_id
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE a.id = $1
      LIMIT 1
    `,
    [assignmentId]
  );

  return result.rows[0] ?? null;
}

export async function listProviderOrderSummariesForProvider(providerId: string): Promise<ProviderOrderSummary[]> {
  const [assignmentResult, orders] = await Promise.all([
    query<ProviderAssignmentRow>(
      `
        SELECT
          a.id,
          a.order_id,
          a.provider_user_id,
          u.username AS provider_username,
          COALESCE(NULLIF(BTRIM(p.display_name), ''), NULLIF(BTRIM(p.full_name), '')) AS provider_display_name,
          a.status,
          a.internal_note,
          a.provider_note,
          a.provider_reference,
          a.assigned_at,
          a.accepted_at,
          a.completed_at,
          a.created_at,
          a.updated_at
        FROM provider_order_assignments a
        JOIN users u ON u.id = a.provider_user_id
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE a.provider_user_id = $1
        ORDER BY a.updated_at DESC
      `,
      [providerId]
    ),
    listAllOrders(),
  ]);

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const eventRows = await query<ProviderEventRow>(
    `
      SELECT
        e.id,
        e.assignment_id,
        e.actor_user_id,
        actor.username AS actor_username,
        e.actor_type,
        e.event_type,
        e.message,
        e.created_at
      FROM provider_order_events e
      LEFT JOIN users actor ON actor.id = e.actor_user_id
      WHERE e.assignment_id = ANY($1::text[])
      ORDER BY e.created_at DESC
    `,
    [assignmentResult.rows.map((row) => row.id)]
  );

  const lastEventMap = new Map<string, ProviderOrderEvent>();
  for (const row of eventRows.rows) {
    if (!lastEventMap.has(row.assignment_id)) {
      lastEventMap.set(row.assignment_id, mapEventRow(row));
    }
  }

  const summaries: Array<ProviderOrderSummary | null> = await Promise.all(
    assignmentResult.rows.map(async (row) => {
      const order = orderMap.get(row.order_id) ?? (await getOrderById(row.order_id));
      if (!order) {
        return null;
      }

      return {
        assignment: mapAssignmentRow(row),
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          status: order.status,
          paymentStatus: order.paymentStatus,
          fulfillmentStatus: order.fulfillmentStatus,
          totalAmount: order.totalAmount,
          currency: order.currency,
          notes: order.notes,
          metadata: order.metadata,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        items: order.items.map((item) => ({
          id: item.id,
          offeringName: item.offeringName,
          quantity: item.quantity,
          fulfillmentType: item.fulfillmentType,
        })),
        lastEvent: lastEventMap.get(row.id),
      } satisfies ProviderOrderSummary;
    })
  );

  return summaries.filter((summary): summary is ProviderOrderSummary => summary !== null);
}

export async function getProviderOrderDetailForProvider(providerId: string, assignmentId: string): Promise<ProviderOrderDetail | null> {
  const assignment = await getAssignmentRowById(assignmentId);
  if (!assignment || assignment.provider_user_id !== providerId) {
    return null;
  }

  return getProviderOrderDetailByAssignmentId(assignmentId);
}

export async function getProviderOrderDetailByAssignmentId(assignmentId: string): Promise<ProviderOrderDetail | null> {
  const assignment = await getAssignmentRowById(assignmentId);
  if (!assignment) {
    return null;
  }

  const [order, eventResult] = await Promise.all([
    getOrderById(assignment.order_id),
    query<ProviderEventRow>(
      `
        SELECT
          e.id,
          e.assignment_id,
          e.actor_user_id,
          actor.username AS actor_username,
          e.actor_type,
          e.event_type,
          e.message,
          e.created_at
        FROM provider_order_events e
        LEFT JOIN users actor ON actor.id = e.actor_user_id
        WHERE e.assignment_id = $1
        ORDER BY e.created_at DESC
      `,
      [assignmentId]
    ),
  ]);

  if (!order) {
    return null;
  }

  return {
    assignment: mapAssignmentRow(assignment),
    order,
    items: order.items.map((item) => ({
      id: item.id,
      offeringName: item.offeringName,
      quantity: item.quantity,
      fulfillmentType: item.fulfillmentType,
    })),
    lastEvent: eventResult.rows[0] ? mapEventRow(eventResult.rows[0]) : undefined,
    events: eventResult.rows.map(mapEventRow),
  };
}

export async function getProviderAssignmentByOrderId(orderId: string): Promise<ProviderOrderDetail | null> {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM provider_order_assignments
      WHERE order_id = $1
      LIMIT 1
    `,
    [orderId]
  );

  const assignmentId = result.rows[0]?.id;
  if (!assignmentId) {
    return null;
  }

  return getProviderOrderDetailByAssignmentId(assignmentId);
}

export async function countProviderAssignmentsForProvider(providerId: string): Promise<{
  total: number;
  active: number;
  review: number;
  completed: number;
}> {
  const result = await query<{
    total: string;
    active: string;
    review: string;
    completed: string;
  }>(
    `
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status IN ('pending_confirmation', 'accepted', 'in_progress'))::text AS active,
        COUNT(*) FILTER (WHERE status = 'ready_for_review')::text AS review,
        COUNT(*) FILTER (WHERE status = 'completed')::text AS completed
      FROM provider_order_assignments
      WHERE provider_user_id = $1
    `,
    [providerId]
  );

  return {
    total: Number(result.rows[0]?.total ?? "0"),
    active: Number(result.rows[0]?.active ?? "0"),
    review: Number(result.rows[0]?.review ?? "0"),
    completed: Number(result.rows[0]?.completed ?? "0"),
  };
}

export async function upsertProviderAssignment(input: UpsertProviderAssignmentInput): Promise<string> {
  return withTransaction(async (execute) => {
    const internalNote = (input.internalNote ?? "").trim();
    const providerResult = await execute<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE id = $1 AND role = $2
        LIMIT 1
      `,
      [input.providerId, USER_ROLES.PROVIDER]
    );

    if (!providerResult.rows[0]) {
      throw new ProviderAssignmentError("INVALID_PROVIDER", "Selected account is not a provider.");
    }

    const existing = await execute<{ id: string; provider_user_id: string }>(
      `
        SELECT id, provider_user_id
        FROM provider_order_assignments
        WHERE order_id = $1
        LIMIT 1
      `,
      [input.orderId]
    );

    if (existing.rows[0]) {
      const assignmentId = existing.rows[0].id;
      const previousProviderUserId = existing.rows[0].provider_user_id;
      const reassigned = existing.rows[0].provider_user_id !== input.providerId;

      await execute(
        `
          UPDATE provider_order_assignments
          SET
            provider_user_id = $2,
            internal_note = $3,
            status = CASE WHEN provider_user_id <> $2 THEN 'pending_confirmation' ELSE status END,
            accepted_at = CASE WHEN provider_user_id <> $2 THEN NULL ELSE accepted_at END,
            completed_at = CASE WHEN provider_user_id <> $2 THEN NULL ELSE completed_at END,
            updated_at = NOW()
          WHERE id = $1
        `,
        [assignmentId, input.providerId, internalNote]
      );

      await execute(
        `
          INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
          VALUES ($1, $2, 'admin', $3, $4)
        `,
        [
          assignmentId,
          input.actorUserId,
          reassigned ? "assignment_reassigned" : "note_added",
          reassigned ? "Đã chuyển đơn cho provider mới." : "Đã cập nhật ghi chú và phân công provider.",
        ]
      );

      await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_ASSIGNMENT, assignmentId);
      await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_PORTAL, input.providerId);
      if (reassigned && previousProviderUserId) {
        await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_PORTAL, previousProviderUserId);
      }

      return assignmentId;
    }

    const inserted = await execute<{ id: string }>(
      `
        INSERT INTO provider_order_assignments (order_id, provider_user_id, internal_note)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [input.orderId, input.providerId, internalNote]
    );

    const assignmentId = inserted.rows[0].id;

    await execute(
      `
        INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, 'admin', 'assignment_created', 'Đã tạo phân công provider cho đơn hàng.')
      `,
      [assignmentId, input.actorUserId]
    );

    await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_ASSIGNMENT, assignmentId);
    await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_PORTAL, input.providerId);

    return assignmentId;
  });
}

export async function updateProviderAssignmentByProvider(input: UpdateProviderAssignmentInput): Promise<void> {
  await withTransaction(async (execute) => {
    const existing = await execute<{
      id: string;
      status: ProviderAssignmentStatus;
      provider_note: string;
      provider_reference: string;
    }>(
      `
        SELECT id, status, provider_note, provider_reference
        FROM provider_order_assignments
        WHERE id = $1 AND provider_user_id = $2
        LIMIT 1
      `,
      [input.assignmentId, input.providerId]
    );

    if (!existing.rows[0]) {
      throw new ProviderAssignmentError("ASSIGNMENT_NOT_FOUND", "Provider assignment not found.");
    }

    const providerNote = (input.providerNote ?? "").trim();
    const providerReference = (input.providerReference ?? "").trim();
    const currentStatus = existing.rows[0].status;
    const currentProviderNote = existing.rows[0].provider_note;
    const currentProviderReference = existing.rows[0].provider_reference;
    const statusChanged = currentStatus !== input.status;
    const providerNoteChanged = currentProviderNote !== providerNote;
    const providerReferenceChanged = currentProviderReference !== providerReference;

    if (!statusChanged && !providerNoteChanged && !providerReferenceChanged) {
      return;
    }

    await execute(
      `
        UPDATE provider_order_assignments
        SET
          status = $2,
          provider_note = $3,
          provider_reference = $4,
          accepted_at = CASE
            WHEN $2 IN ('accepted', 'in_progress', 'ready_for_review', 'completed') AND accepted_at IS NULL THEN NOW()
            ELSE accepted_at
          END,
          completed_at = CASE
            WHEN $2 = 'completed' THEN NOW()
            WHEN $2 <> 'completed' THEN NULL
            ELSE completed_at
          END,
          updated_at = NOW()
        WHERE id = $1
      `,
      [input.assignmentId, input.status, providerNote, providerReference]
    );

    if (statusChanged) {
      await execute(
        `
          INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
          VALUES ($1, $2, 'provider', 'status_changed', $3)
        `,
        [input.assignmentId, input.providerId, `Provider đã cập nhật trạng thái sang ${getProviderAssignmentStatusLabel(input.status)}.`]
      );
    }

    if (providerNoteChanged && providerNote) {
      await execute(
        `
          INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
          VALUES ($1, $2, 'provider', 'note_added', $3)
        `,
        [input.assignmentId, input.providerId, `Provider note: ${providerNote}`]
      );
    }

    await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_ASSIGNMENT, input.assignmentId);
    await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_PORTAL, input.providerId);
  });
}

export async function recordAdminOrderUpdateForProvider(input: RecordAdminOrderUpdateInput): Promise<void> {
  await withTransaction(async (execute) => {
    const assignmentResult = await execute<{ id: string }>(
      `
        SELECT id
        FROM provider_order_assignments
        WHERE order_id = $1
        LIMIT 1
      `,
      [input.orderId]
    );

    const assignmentId = assignmentResult.rows[0]?.id;
    if (!assignmentId) {
      return;
    }

    await execute(
      `
        UPDATE provider_order_assignments
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [assignmentId]
    );

    await execute(
      `
        INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, 'admin', 'note_added', $3)
      `,
      [
        assignmentId,
        input.actorUserId,
        `Admin da cap nhat don hang: ${input.status} / ${input.paymentStatus} / ${input.fulfillmentStatus}.`,
      ]
    );

    const providerResult = await execute<{ provider_user_id: string }>(
      `
        SELECT provider_user_id
        FROM provider_order_assignments
        WHERE id = $1
        LIMIT 1
      `,
      [assignmentId]
    );

    const providerId = providerResult.rows[0]?.provider_user_id;
    await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_ASSIGNMENT, assignmentId);
    if (providerId) {
      await notifyRealtime(execute, REALTIME_TOPIC_PROVIDER_PORTAL, providerId);
    }
  });
}
