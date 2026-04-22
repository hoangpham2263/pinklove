"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import type { NotificationSummary, UserNotification } from "@/features/notifications/types";
import { ROUTES } from "@/lib/routes";

type NotificationBellProps = {
  listHref?: string;
};

type NotificationPayload = {
  notifications: UserNotification[];
  summary: NotificationSummary;
};

async function fetchNotifications(): Promise<NotificationPayload> {
  const response = await fetch(ROUTES.API.NOTIFICATIONS.INDEX, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new Error("NOTIFICATIONS_LOAD_FAILED");
  }
  return (await response.json()) as NotificationPayload;
}

async function markRead(notificationId?: string) {
  await fetch(ROUTES.API.NOTIFICATIONS.READ, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(notificationId ? { notificationId } : { all: true }),
  });
}

export function NotificationBell({ listHref }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({
    unreadCount: 0,
    latestCreatedAt: "",
    nextScheduledAt: "",
  });
  const latestUnread = useMemo(() => summary.unreadCount, [summary.unreadCount]);

  const applyPayload = useCallback((payload: NotificationPayload, previousUnread: number) => {
    setNotifications(payload.notifications);
    setSummary(payload.summary);
    if (payload.summary.unreadCount > previousUnread) {
      toast.info("Bạn có thông báo mới.");
    }
  }, []);

  useEffect(() => {
    void fetchNotifications()
      .then((payload) => {
        setNotifications(payload.notifications);
        setSummary(payload.summary);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!summary.nextScheduledAt) {
      return;
    }

    const previousUnread = summary.unreadCount;
    const delay = new Date(summary.nextScheduledAt).getTime() - Date.now() + 1000;
    if (!Number.isFinite(delay) || delay <= 0) {
      void fetchNotifications().then((payload) => applyPayload(payload, previousUnread)).catch(() => undefined);
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchNotifications().then((payload) => applyPayload(payload, previousUnread)).catch(() => undefined);
    }, Math.min(delay, 2_147_483_647));

    return () => window.clearTimeout(timeout);
  }, [applyPayload, summary.nextScheduledAt, summary.unreadCount]);

  useRealtimeResource({
    streamUrl: ROUTES.API.NOTIFICATIONS.REALTIME,
    changedEvent: "notifications.changed",
    load: fetchNotifications,
    onData: (payload) => {
      applyPayload(payload, latestUnread);
    },
    onError: () => {
      toast.error("Không thể đồng bộ thông báo.");
    },
  });

  const filteredNotifications = filter === "unread" ? notifications.filter((item) => !item.isRead) : notifications;
  const visibleNotifications = filteredNotifications.slice(0, 8);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative rounded-full"
        aria-label="Thông báo"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" />
        {summary.unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
            {summary.unreadCount > 99 ? "99+" : summary.unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-10 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div>
              <p className="font-medium">Thông báo</p>
              <p className="text-xs text-muted-foreground">{summary.unreadCount} chưa xem</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void markRead().then(() => fetchNotifications().then((payload) => applyPayload(payload, summary.unreadCount)));
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đã đọc
            </Button>
          </div>

          <div className="flex gap-2 border-b px-3 py-2">
            <Button
              type="button"
              variant={filter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Tất cả
            </Button>
            <Button
              type="button"
              variant={filter === "unread" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Chưa xem
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>
            ) : (
              visibleNotifications.map((item) => {
                const href = item.linkUrl || listHref;
                const content = (
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-muted" : "bg-primary"}`} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${item.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                          {item.isRead ? "Đã xem" : "Chưa xem"}
                        </span>
                      </div>
                      {item.body ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p> : null}
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                );

                if (!href) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="block w-full border-b px-3 py-2.5 transition-colors hover:bg-muted"
                      onClick={() => {
                        void markRead(item.id).then(() => fetchNotifications().then((payload) => applyPayload(payload, summary.unreadCount)));
                      }}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="block border-b px-3 py-2.5 transition-colors hover:bg-muted"
                    onClick={() => {
                      setOpen(false);
                      void markRead(item.id);
                    }}
                  >
                    {content}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
