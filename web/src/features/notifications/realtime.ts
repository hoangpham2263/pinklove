import "server-only";

import { createListenRealtimeStream } from "@/features/realtime/server";
import { getNotificationSummaryForUser, NOTIFICATION_REALTIME_CHANNEL, NOTIFICATION_REALTIME_TOPIC_USER } from "@/features/notifications/server/service";
import type { UserRole } from "@/lib/roles";

type NotificationRealtimeState = {
  version: string;
  userId: string;
  unreadCount: number;
  latestCreatedAt: string;
  nextScheduledAt: string;
};

export async function getNotificationRealtimeState(userId: string, role: UserRole): Promise<NotificationRealtimeState> {
  const summary = await getNotificationSummaryForUser(userId, role);
  return {
    version: [summary.unreadCount, summary.latestCreatedAt, summary.nextScheduledAt].join("|"),
    userId,
    unreadCount: summary.unreadCount,
    latestCreatedAt: summary.latestCreatedAt,
    nextScheduledAt: summary.nextScheduledAt,
  };
}

export function createNotificationRealtimeStream(userId: string, role: UserRole) {
  return createListenRealtimeStream({
    channel: NOTIFICATION_REALTIME_CHANNEL,
    resourceId: userId,
    changedEvent: "notifications.changed",
    loadState: () => getNotificationRealtimeState(userId, role),
    matchesNotification: (payload, currentResourceId) =>
      payload.topic === NOTIFICATION_REALTIME_TOPIC_USER && payload.resourceId === currentResourceId,
    mapReadyPayload: (state) => ({
      userId,
      unreadCount: state?.unreadCount ?? 0,
      nextScheduledAt: state?.nextScheduledAt ?? "",
    }),
    mapChangedPayload: (state) => ({
      userId,
      unreadCount: state.unreadCount,
      latestCreatedAt: state.latestCreatedAt,
      nextScheduledAt: state.nextScheduledAt,
    }),
  });
}
