import "server-only";

import { getOrderById, listAllOrders } from "@/features/ecommerce/server/service";
import {
  REALTIME_NOTIFY_CHANNEL,
  REALTIME_TOPIC_VENDOR_ASSIGNMENT,
  REALTIME_TOPIC_VENDOR_PORTAL,
} from "@/features/vendor-orders/realtime";
import type {
  VendorAssignmentStatus,
  VendorEventActorType,
  VendorEventType,
  VendorOrderAssignment,
  VendorOrderDetail,
  VendorOrderEvent,
  VendorOrderSummary,
} from "@/features/vendor-orders/types";
import { query, type DbExecutor, withTransaction } from "@/lib/database";
import { USER_ROLES } from "@/lib/roles";

type VendorAssignmentRow = {
  id: string;
  order_id: string;
  vendor_user_id: string;
  vendor_username: string;
  vendor_display_name: string | null;
  status: VendorAssignmentStatus;
  internal_note: string;
  vendor_note: string;
  vendor_reference: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type VendorEventRow = {
  id: string;
  assignment_id: string;
  actor_user_id: string | null;
  actor_username: string | null;
  actor_type: VendorEventActorType;
  event_type: VendorEventType;
  message: string;
  created_at: string;
};

type UpsertVendorAssignmentInput = {
  orderId: string;
  vendorUserId: string;
  internalNote?: string;
  actorUserId: string;
};

type UpdateVendorAssignmentInput = {
  assignmentId: string;
  vendorUserId: string;
  status: VendorAssignmentStatus;
  vendorNote?: string;
  vendorReference?: string;
};

type RecordAdminOrderUpdateInput = {
  orderId: string;
  actorUserId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

export class VendorAssignmentError extends Error {
  code: "INVALID_VENDOR" | "ASSIGNMENT_NOT_FOUND";

  constructor(code: "INVALID_VENDOR" | "ASSIGNMENT_NOT_FOUND", message: string) {
    super(message);
    this.code = code;
  }
}

function mapAssignmentRow(row: VendorAssignmentRow): VendorOrderAssignment {
  return {
    id: row.id,
    orderId: row.order_id,
    vendorUserId: row.vendor_user_id,
    vendorUsername: row.vendor_username,
    vendorDisplayName: row.vendor_display_name ?? row.vendor_username,
    status: row.status,
    internalNote: row.internal_note,
    vendorNote: row.vendor_note,
    vendorReference: row.vendor_reference,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventRow(row: VendorEventRow): VendorOrderEvent {
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

async function getAssignmentRowById(assignmentId: string): Promise<VendorAssignmentRow | null> {
  const result = await query<VendorAssignmentRow>(
    `
      SELECT
        a.id,
        a.order_id,
        a.vendor_user_id,
        u.username AS vendor_username,
        COALESCE(NULLIF(BTRIM(p.display_name), ''), NULLIF(BTRIM(p.full_name), '')) AS vendor_display_name,
        a.status,
        a.internal_note,
        a.vendor_note,
        a.vendor_reference,
        a.assigned_at,
        a.accepted_at,
        a.completed_at,
        a.created_at,
        a.updated_at
      FROM vendor_order_assignments a
      JOIN users u ON u.id = a.vendor_user_id
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE a.id = $1
      LIMIT 1
    `,
    [assignmentId]
  );

  return result.rows[0] ?? null;
}

export async function listVendorOrderSummariesForVendor(vendorUserId: string): Promise<VendorOrderSummary[]> {
  const [assignmentResult, orders] = await Promise.all([
    query<VendorAssignmentRow>(
      `
        SELECT
          a.id,
          a.order_id,
          a.vendor_user_id,
          u.username AS vendor_username,
          COALESCE(NULLIF(BTRIM(p.display_name), ''), NULLIF(BTRIM(p.full_name), '')) AS vendor_display_name,
          a.status,
          a.internal_note,
          a.vendor_note,
          a.vendor_reference,
          a.assigned_at,
          a.accepted_at,
          a.completed_at,
          a.created_at,
          a.updated_at
        FROM vendor_order_assignments a
        JOIN users u ON u.id = a.vendor_user_id
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE a.vendor_user_id = $1
        ORDER BY a.updated_at DESC
      `,
      [vendorUserId]
    ),
    listAllOrders(),
  ]);

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const eventRows = await query<VendorEventRow>(
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
      FROM vendor_order_events e
      LEFT JOIN users actor ON actor.id = e.actor_user_id
      WHERE e.assignment_id = ANY($1::text[])
      ORDER BY e.created_at DESC
    `,
    [assignmentResult.rows.map((row) => row.id)]
  );

  const lastEventMap = new Map<string, VendorOrderEvent>();
  for (const row of eventRows.rows) {
    if (!lastEventMap.has(row.assignment_id)) {
      lastEventMap.set(row.assignment_id, mapEventRow(row));
    }
  }

  const summaries: Array<VendorOrderSummary | null> = await Promise.all(
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
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          fulfillmentType: item.fulfillmentType,
        })),
        lastEvent: lastEventMap.get(row.id),
      } satisfies VendorOrderSummary;
    })
  );

  return summaries.filter((summary): summary is VendorOrderSummary => summary !== null);
}

export async function getVendorOrderDetailForVendor(vendorUserId: string, assignmentId: string): Promise<VendorOrderDetail | null> {
  const assignment = await getAssignmentRowById(assignmentId);
  if (!assignment || assignment.vendor_user_id !== vendorUserId) {
    return null;
  }

  return getVendorOrderDetailByAssignmentId(assignmentId);
}

export async function getVendorOrderDetailByAssignmentId(assignmentId: string): Promise<VendorOrderDetail | null> {
  const assignment = await getAssignmentRowById(assignmentId);
  if (!assignment) {
    return null;
  }

  const [order, eventResult] = await Promise.all([
    getOrderById(assignment.order_id),
    query<VendorEventRow>(
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
        FROM vendor_order_events e
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
      productName: item.productName,
      quantity: item.quantity,
      fulfillmentType: item.fulfillmentType,
    })),
    lastEvent: eventResult.rows[0] ? mapEventRow(eventResult.rows[0]) : undefined,
    events: eventResult.rows.map(mapEventRow),
  };
}

export async function getVendorAssignmentByOrderId(orderId: string): Promise<VendorOrderDetail | null> {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM vendor_order_assignments
      WHERE order_id = $1
      LIMIT 1
    `,
    [orderId]
  );

  const assignmentId = result.rows[0]?.id;
  if (!assignmentId) {
    return null;
  }

  return getVendorOrderDetailByAssignmentId(assignmentId);
}

export async function countVendorAssignmentsForVendor(vendorUserId: string): Promise<{
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
      FROM vendor_order_assignments
      WHERE vendor_user_id = $1
    `,
    [vendorUserId]
  );

  return {
    total: Number(result.rows[0]?.total ?? "0"),
    active: Number(result.rows[0]?.active ?? "0"),
    review: Number(result.rows[0]?.review ?? "0"),
    completed: Number(result.rows[0]?.completed ?? "0"),
  };
}

export async function upsertVendorAssignment(input: UpsertVendorAssignmentInput): Promise<string> {
  return withTransaction(async (execute) => {
    const internalNote = (input.internalNote ?? "").trim();
    const vendorResult = await execute<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE id = $1 AND role = $2
        LIMIT 1
      `,
      [input.vendorUserId, USER_ROLES.VENDOR]
    );

    if (!vendorResult.rows[0]) {
      throw new VendorAssignmentError("INVALID_VENDOR", "Selected account is not a vendor.");
    }

    const existing = await execute<{ id: string; vendor_user_id: string }>(
      `
        SELECT id, vendor_user_id
        FROM vendor_order_assignments
        WHERE order_id = $1
        LIMIT 1
      `,
      [input.orderId]
    );

    if (existing.rows[0]) {
      const assignmentId = existing.rows[0].id;
      const previousVendorUserId = existing.rows[0].vendor_user_id;
      const reassigned = existing.rows[0].vendor_user_id !== input.vendorUserId;

      await execute(
        `
          UPDATE vendor_order_assignments
          SET
            vendor_user_id = $2,
            internal_note = $3,
            status = CASE WHEN vendor_user_id <> $2 THEN 'pending_confirmation' ELSE status END,
            accepted_at = CASE WHEN vendor_user_id <> $2 THEN NULL ELSE accepted_at END,
            completed_at = CASE WHEN vendor_user_id <> $2 THEN NULL ELSE completed_at END,
            updated_at = NOW()
          WHERE id = $1
        `,
        [assignmentId, input.vendorUserId, internalNote]
      );

      await execute(
        `
          INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
          VALUES ($1, $2, 'admin', $3, $4)
        `,
        [
          assignmentId,
          input.actorUserId,
          reassigned ? "assignment_reassigned" : "note_added",
          reassigned ? "Đã chuyển đơn cho vendor mới." : "Đã cập nhật ghi chú và phân công vendor.",
        ]
      );

      await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_ASSIGNMENT, assignmentId);
      await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_PORTAL, input.vendorUserId);
      if (reassigned && previousVendorUserId) {
        await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_PORTAL, previousVendorUserId);
      }

      return assignmentId;
    }

    const inserted = await execute<{ id: string }>(
      `
        INSERT INTO vendor_order_assignments (order_id, vendor_user_id, internal_note)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [input.orderId, input.vendorUserId, internalNote]
    );

    const assignmentId = inserted.rows[0].id;

    await execute(
      `
        INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, 'admin', 'assignment_created', 'Đã tạo phân công vendor cho đơn hàng.')
      `,
      [assignmentId, input.actorUserId]
    );

    await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_ASSIGNMENT, assignmentId);
    await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_PORTAL, input.vendorUserId);

    return assignmentId;
  });
}

export async function updateVendorAssignmentByVendor(input: UpdateVendorAssignmentInput): Promise<void> {
  await withTransaction(async (execute) => {
    const existing = await execute<{ id: string }>(
      `
        SELECT id
        FROM vendor_order_assignments
        WHERE id = $1 AND vendor_user_id = $2
        LIMIT 1
      `,
      [input.assignmentId, input.vendorUserId]
    );

    if (!existing.rows[0]) {
      throw new VendorAssignmentError("ASSIGNMENT_NOT_FOUND", "Vendor assignment not found.");
    }

    const vendorNote = (input.vendorNote ?? "").trim();
    const vendorReference = (input.vendorReference ?? "").trim();

    await execute(
      `
        UPDATE vendor_order_assignments
        SET
          status = $2,
          vendor_note = $3,
          vendor_reference = $4,
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
      [input.assignmentId, input.status, vendorNote, vendorReference]
    );

    await execute(
      `
        INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, 'vendor', 'status_changed', $3)
      `,
      [input.assignmentId, input.vendorUserId, `Vendor đã cập nhật trạng thái sang ${input.status}.`]
    );

    if (vendorNote) {
      await execute(
        `
          INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
          VALUES ($1, $2, 'vendor', 'note_added', $3)
        `,
        [input.assignmentId, input.vendorUserId, `Vendor note: ${vendorNote}`]
      );
    }

    await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_ASSIGNMENT, input.assignmentId);
    await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_PORTAL, input.vendorUserId);
  });
}

export async function recordAdminOrderUpdateForVendor(input: RecordAdminOrderUpdateInput): Promise<void> {
  await withTransaction(async (execute) => {
    const assignmentResult = await execute<{ id: string }>(
      `
        SELECT id
        FROM vendor_order_assignments
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
        UPDATE vendor_order_assignments
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [assignmentId]
    );

    await execute(
      `
        INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, 'admin', 'note_added', $3)
      `,
      [
        assignmentId,
        input.actorUserId,
        `Admin da cap nhat don hang: ${input.status} / ${input.paymentStatus} / ${input.fulfillmentStatus}.`,
      ]
    );

    const vendorResult = await execute<{ vendor_user_id: string }>(
      `
        SELECT vendor_user_id
        FROM vendor_order_assignments
        WHERE id = $1
        LIMIT 1
      `,
      [assignmentId]
    );

    const vendorUserId = vendorResult.rows[0]?.vendor_user_id;
    await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_ASSIGNMENT, assignmentId);
    if (vendorUserId) {
      await notifyRealtime(execute, REALTIME_TOPIC_VENDOR_PORTAL, vendorUserId);
    }
  });
}
