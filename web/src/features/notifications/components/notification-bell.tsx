"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import type { NotificationSummary, UserNotification } from "@/features/notifications/types";
import { customerApi } from "@/lib/api-client.customer";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  listHref?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
};

type NotificationPayload = Awaited<ReturnType<typeof customerApi.fetchNotifications>>;

export function NotificationBell({ listHref, triggerClassName, dropdownClassName }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const rootRef = useRef<HTMLDivElement | null>(null);
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
    void customerApi.fetchNotifications()
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
      void customerApi.fetchNotifications().then((payload) => applyPayload(payload, previousUnread)).catch(() => undefined);
      return;
    }

    const timeout = window.setTimeout(() => {
      void customerApi.fetchNotifications().then((payload) => applyPayload(payload, previousUnread)).catch(() => undefined);
    }, Math.min(delay, 2_147_483_647));

    return () => window.clearTimeout(timeout);
  }, [applyPayload, summary.nextScheduledAt, summary.unreadCount]);

  useRealtimeResource({
    streamUrl: ROUTES.API.NOTIFICATIONS.REALTIME,
    changedEvent: "notifications.changed",
    load: customerApi.fetchNotifications,
    onData: (payload) => {
      applyPayload(payload, latestUnread);
    },
    onError: () => {
      toast.error("Không thể đồng bộ thông báo.");
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || rootRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const filteredNotifications = filter === "unread" ? notifications.filter((item) => !item.isRead) : notifications;

  const dismissNotification = useCallback((item: UserNotification) => {
    setNotifications((current) => current.filter((notification) => notification.id !== item.id));
    setSummary((current) => ({
      ...current,
      unreadCount: item.isRead ? current.unreadCount : Math.max(0, current.unreadCount - 1),
    }));

    void customerApi.dismissNotification(item.id).catch(() => {
      toast.error("Không thể xóa thông báo.");
      void customerApi.fetchNotifications().then((payload) => applyPayload(payload, summary.unreadCount)).catch(() => undefined);
    });
  }, [applyPayload, summary.unreadCount]);

  const dismissAllNotifications = useCallback(() => {
    if (notifications.length === 0) {
      return;
    }

    setNotifications([]);
    setSummary((current) => ({
      ...current,
      unreadCount: 0,
    }));

    void customerApi.dismissAllNotifications().catch(() => {
      toast.error("Không thể xóa tất cả thông báo.");
      void customerApi.fetchNotifications().then((payload) => applyPayload(payload, summary.unreadCount)).catch(() => undefined);
    });
  }, [applyPayload, notifications.length, summary.unreadCount]);

  const markNotificationRead = useCallback((notificationId: string) => {
    void customerApi.markNotificationRead(notificationId)
      .then(() => customerApi.fetchNotifications().then((payload) => applyPayload(payload, summary.unreadCount)))
      .catch(() => undefined);
  }, [applyPayload, summary.unreadCount]);

  const markAllNotificationsRead = useCallback(() => {
    void customerApi.markNotificationRead()
      .then(() => customerApi.fetchNotifications().then((payload) => applyPayload(payload, summary.unreadCount)))
      .catch(() => undefined);
  }, [applyPayload, summary.unreadCount]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "relative rounded-full",
          open && "border-stone-900",
          triggerClassName
        )}
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-5" />
        {summary.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
            {summary.unreadCount > 99 ? "99+" : summary.unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <NotificationDropdown
          notifications={filteredNotifications}
          unreadCount={summary.unreadCount}
          emptyMessage="Chưa có thông báo."
          listHref={listHref}
          filter={filter}
          onFilterChange={setFilter}
          onClose={() => setOpen(false)}
          onMarkAllRead={markAllNotificationsRead}
          onDismissAll={dismissAllNotifications}
          onMarkRead={markNotificationRead}
          onDismiss={dismissNotification}
          className={cn("top-10", dropdownClassName)}
        />
      ) : null}
    </div>
  );
}
