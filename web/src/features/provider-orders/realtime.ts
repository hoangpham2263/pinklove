import "server-only";

import { createListenRealtimeStream } from "@/features/realtime/server";
import { query } from "@/lib/database";

export const REALTIME_NOTIFY_CHANNEL = "app_realtime";
export const REALTIME_TOPIC_PROVIDER_ASSIGNMENT = "provider-assignment";
export const REALTIME_TOPIC_PROVIDER_PORTAL = "provider-portal";

type ProviderAssignmentRealtimeState = {
  version: string;
  assignmentId: string;
  updatedAt: string;
  lastEventId: string;
  lastEventCreatedAt: string;
};

type ProviderPortalRealtimeState = {
  version: string;
  providerId: string;
  latestAssignmentUpdatedAt: string;
  latestEventCreatedAt: string;
  assignmentCount: number;
};

async function getProviderAssignmentRealtimeStateRow(assignmentId: string, providerId?: string) {
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
          FROM provider_order_events e
          WHERE e.assignment_id = a.id
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT 1
        ) AS last_event_id,
        (
          SELECT e.created_at::text
          FROM provider_order_events e
          WHERE e.assignment_id = a.id
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT 1
        ) AS last_event_created_at
      FROM provider_order_assignments a
      WHERE a.id = $1
      ${providerId ? "AND a.provider_id = $2" : ""}
      LIMIT 1
    `,
    providerId ? [assignmentId, providerId] : [assignmentId]
  );

  return result.rows[0] ?? null;
}

export async function getProviderAssignmentRealtimeState(assignmentId: string): Promise<ProviderAssignmentRealtimeState | null> {
  const row = await getProviderAssignmentRealtimeStateRow(assignmentId);
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

export async function getProviderAssignmentRealtimeStateForProvider(
  providerId: string,
  assignmentId: string
): Promise<ProviderAssignmentRealtimeState | null> {
  const row = await getProviderAssignmentRealtimeStateRow(assignmentId, providerId);
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

export async function getProviderPortalRealtimeState(providerId: string): Promise<ProviderPortalRealtimeState> {
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
      FROM provider_order_assignments a
      LEFT JOIN provider_order_events e ON e.assignment_id = a.id
      WHERE a.provider_id = $1
    `,
    [providerId]
  );

  const row = result.rows[0];

  return {
    version: [row?.latest_assignment_updated_at ?? "", row?.latest_event_created_at ?? "", row?.assignment_count ?? "0"].join("|"),
    providerId,
    latestAssignmentUpdatedAt: row?.latest_assignment_updated_at ?? "",
    latestEventCreatedAt: row?.latest_event_created_at ?? "",
    assignmentCount: Number(row?.assignment_count ?? "0"),
  };
}

export function createProviderAssignmentRealtimeStream(assignmentId: string) {
  return createListenRealtimeStream({
    channel: REALTIME_NOTIFY_CHANNEL,
    resourceId: assignmentId,
    changedEvent: "provider-assignment.changed",
    deletedEvent: "provider-assignment.deleted",
    loadState: () => getProviderAssignmentRealtimeState(assignmentId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === REALTIME_TOPIC_PROVIDER_ASSIGNMENT && payload.resourceId === currentResourceId,
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

export function createProviderAssignmentRealtimeStreamForProvider(providerId: string, assignmentId: string) {
  return createListenRealtimeStream({
    channel: REALTIME_NOTIFY_CHANNEL,
    resourceId: assignmentId,
    changedEvent: "provider-assignment.changed",
    deletedEvent: "provider-assignment.deleted",
    loadState: () => getProviderAssignmentRealtimeStateForProvider(providerId, assignmentId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === REALTIME_TOPIC_PROVIDER_ASSIGNMENT && payload.resourceId === currentResourceId,
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

export function createProviderPortalRealtimeStream(providerId: string) {
  return createListenRealtimeStream({
    channel: REALTIME_NOTIFY_CHANNEL,
    resourceId: providerId,
    changedEvent: "provider-portal.changed",
    loadState: () => getProviderPortalRealtimeState(providerId),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === REALTIME_TOPIC_PROVIDER_PORTAL && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      providerId,
      latestAssignmentUpdatedAt: state?.latestAssignmentUpdatedAt ?? "",
      latestEventCreatedAt: state?.latestEventCreatedAt ?? "",
      assignmentCount: state?.assignmentCount ?? 0,
    }),
    mapChangedPayload: (state) => ({
      providerId,
      latestAssignmentUpdatedAt: state.latestAssignmentUpdatedAt,
      latestEventCreatedAt: state.latestEventCreatedAt,
      assignmentCount: state.assignmentCount,
    }),
  });
}
