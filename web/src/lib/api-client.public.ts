"use client";

import { apiFetch } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import type { UserNotification } from "@/features/notifications/types";

export type PublicNotificationPayload = {
  notifications: UserNotification[];
};

async function trackAffiliateReferral(input: { code: string; landingPath: string }) {
  const response = await apiFetch(ROUTES.API.AFFILIATE.TRACK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("AFFILIATE_TRACK_FAILED");
  }
}

async function fetchPublicNotifications(): Promise<PublicNotificationPayload> {
  const response = await apiFetch(ROUTES.API.NOTIFICATIONS.PUBLIC, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("PUBLIC_NOTIFICATIONS_LOAD_FAILED");
  }

  return (await response.json()) as PublicNotificationPayload;
}

export const publicApi = {
  trackAffiliateReferral,
  fetchPublicNotifications,
};
