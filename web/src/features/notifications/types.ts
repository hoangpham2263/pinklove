import type { UserRole } from "@/lib/roles";

export type NotificationAudienceType = "all" | "role" | "users";
export type NotificationStatus = "draft" | "scheduled" | "sent" | "archived";

export type UserNotification = {
  id: string;
  title: string;
  body: string;
  linkUrl: string;
  audienceType: NotificationAudienceType;
  createdAt: string;
  readAt: string;
  isRead: boolean;
};

export type NotificationSummary = {
  unreadCount: number;
  latestCreatedAt: string;
  nextScheduledAt: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  linkUrl: string;
  audienceType: NotificationAudienceType;
  status: NotificationStatus;
  roles: UserRole[];
  targetUsers: Array<{ id: string; username: string; role: UserRole }>;
  createdByUsername: string;
  createdAt: string;
  scheduledAt: string;
  updatedAt: string;
};
