import "server-only";

import { createListenRealtimeStream } from "@/features/realtime/server";
import { query } from "@/lib/database";

export const REALTIME_NOTIFY_CHANNEL = "app_realtime";
export const REALTIME_TOPIC_VENDOR_ASSIGNMENT = "vendor-assignment";
export const REALTIME_TOPIC_VENDOR_PORTAL = "vendor-portal";

type VendorAssignmentRealtimeState = {
  version: string;
  assignmentId: string;
  updatedAt: string;
  lastEventId: string;
  lastEventCreatedAt: string;
};

type VendorPortalRealtimeState = {
  version: string;
  vendorUserId: string;
  latestAssignmentUpdatedAt: string;
  latestEventCreatedAt: string;
  assignmentCount: number;
};

export async function getVendorAssignmentRealtimeState(assignmentId: string): Promise<VendorAssignmentRealtimeState | null> {
  const result = await query<{
    assignment_id: string;
    updated_at: string;
    last_event_id: string | null;
    last_event_created_at: string | null;
  }>(
    `
      SELECT
        a.id AS assignment_id,
        a.updated_at::text AS updated_at,
        (
          SELECT e.id
          FROM vendor_order_events e
          WHERE e.assignment_id = a.id
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT 1
        ) AS last_event_id,
        (
          SELECT e.created_at::text
          FROM vendor_order_events e
          WHERE e.assignment_id = a.id
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT 1
        ) AS last_event_created_at
      FROM vendor_order_assignments a
      WHERE a.id = $1
      LIMIT 1
    `,
    [assignmentId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    version: [row.updated_at, row.last_event_id ?? "", row.last_event_created_at ?? ""].join("|"),
    assignmentId: row.assignment_id,
    updatedAt: row.updated_at,
    lastEventId: row.last_event_id ?? "",
    lastEventCreatedAt: row.last_event_created_at ?? "",
  };
}

export async function getVendorAssignmentRealtimeStateForVendor(
  vendorUserId: string,
  assignmentId: string
): Promise<VendorAssignmentRealtimeState | null> {
  const result = await query<{
    assignment_id: string;
    updated_at: string;
    last_event_id: string | null;
    last_event_created_at: string | null;
  }>(
    `
      SELECT
        a.id AS assignment_id,
        a.updated_at::text AS updated_at,
        (
          SELECT e.id
          FROM vendor_order_events e
          WHERE e.assignment_id = a.id
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT 1
        ) AS last_event_id,
        (
          SELECT e.created_at::text
          FROM vendor_order_events e
          WHERE e.assignment_id = a.id
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT 1
        ) AS last_event_created_at
      FROM vendor_order_assignments a
      WHERE a.id = $1 AND a.vendor_user_id = $2
      LIMIT 1
    `,
    [assignmentId, vendorUserId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    version: [row.updated_at, row.last_event_id ?? "", row.last_event_created_at ?? ""].join("|"),
    assignmentId: row.assignment_id,
    updatedAt: row.updated_at,
    lastEventId: row.last_event_id ?? "",
    lastEventCreatedAt: row.last_event_created_at ?? "",
  };
}

export async function getVendorPortalRealtimeState(vendorUserId: string): Promise<VendorPortalRealtimeState> {
  const result = await query<{
    latest_assignment_updated_at: string | null;
    latest_event_created_at: string | null;
    assignment_count: string;
  }>(
    `
      SELECT
        MAX(a.updated_at)::text AS latest_assignment_updated_at,
        MAX(e.created_at)::text AS latest_event_created_at,
        COUNT(DISTINCT a.id)::text AS assignment_count
      FROM vendor_order_assignments a
      LEFT JOIN vendor_order_events e ON e.assignment_id = a.id
      WHERE a.vendor_user_id = $1
    `,
    [vendorUserId]
  );

  const row = result.rows[0];

  return {
    version: [row?.latest_assignment_updated_at ?? "", row?.latest_event_created_at ?? "", row?.assignment_count ?? "0"].join("|"),
    vendorUserId,
    latestAssignmentUpdatedAt: row?.latest_assignment_updated_at ?? "",
    latestEventCreatedAt: row?.latest_event_created_at ?? "",
    assignmentCount: Number(row?.assignment_count ?? "0"),
  };
}

export function createVendorAssignmentRealtimeStream(assignmentId: string) {
  return createListenRealtimeStream({
    channel: REALTIME_NOTIFY_CHANNEL,
    resourceId: assignmentId,
    changedEvent: "vendor-assignment.changed",
    deletedEvent: "vendor-assignment.deleted",
    loadState: () => getVendorAssignmentRealtimeState(assignmentId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === REALTIME_TOPIC_VENDOR_ASSIGNMENT && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      assignmentId,
      updatedAt: state?.updatedAt ?? "",
      lastEventId: state?.lastEventId ?? "",
    }),
    mapChangedPayload: (state) => ({
      assignmentId,
      updatedAt: state.updatedAt,
      lastEventId: state.lastEventId,
      lastEventCreatedAt: state.lastEventCreatedAt,
    }),
  });
}

export function createVendorAssignmentRealtimeStreamForVendor(vendorUserId: string, assignmentId: string) {
  return createListenRealtimeStream({
    channel: REALTIME_NOTIFY_CHANNEL,
    resourceId: assignmentId,
    changedEvent: "vendor-assignment.changed",
    deletedEvent: "vendor-assignment.deleted",
    loadState: () => getVendorAssignmentRealtimeStateForVendor(vendorUserId, assignmentId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === REALTIME_TOPIC_VENDOR_ASSIGNMENT && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      assignmentId,
      updatedAt: state?.updatedAt ?? "",
      lastEventId: state?.lastEventId ?? "",
    }),
    mapChangedPayload: (state) => ({
      assignmentId,
      updatedAt: state.updatedAt,
      lastEventId: state.lastEventId,
      lastEventCreatedAt: state.lastEventCreatedAt,
    }),
  });
}

export function createVendorPortalRealtimeStream(vendorUserId: string) {
  return createListenRealtimeStream({
    channel: REALTIME_NOTIFY_CHANNEL,
    resourceId: vendorUserId,
    changedEvent: "vendor-portal.changed",
    loadState: () => getVendorPortalRealtimeState(vendorUserId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === REALTIME_TOPIC_VENDOR_PORTAL && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      vendorUserId,
      latestAssignmentUpdatedAt: state?.latestAssignmentUpdatedAt ?? "",
      latestEventCreatedAt: state?.latestEventCreatedAt ?? "",
      assignmentCount: state?.assignmentCount ?? 0,
    }),
    mapChangedPayload: (state) => ({
      vendorUserId,
      latestAssignmentUpdatedAt: state.latestAssignmentUpdatedAt,
      latestEventCreatedAt: state.latestEventCreatedAt,
      assignmentCount: state.assignmentCount,
    }),
  });
}
