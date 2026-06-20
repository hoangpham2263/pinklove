"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";

import { NotificationDropdown } from "@/features/notifications/components/notification-dropdown";
import type { UserNotification } from "@/features/notifications/types";
import { publicApi } from "@/lib/api-client.public";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pinklove:guest-notification-read-ids";
const DISMISSED_STORAGE_KEY = "pinklove:guest-notification-dismissed-ids";

type GuestNotificationBellProps = {
  triggerClassName?: string;
  dropdownClassName?: string;
};

function readStoredIds(storageKey = STORAGE_KEY) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const value = window.localStorage.getItem(storageKey);
    const parsed = value ? (JSON.parse(value) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeStoredIds(ids: Set<string>, storageKey = STORAGE_KEY) {
  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(ids).slice(-200)));
}

export function GuestNotificationBell({ triggerClassName, dropdownClassName }: GuestNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => readStoredIds());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => readStoredIds(DISMISSED_STORAGE_KEY));

  const applyReadState = useCallback((items: UserNotification[], ids: Set<string>, dismissed: Set<string>) => {
    return items
      .filter((item) => !dismissed.has(item.id))
      .map((item) => ({
        ...item,
        isRead: ids.has(item.id),
        readAt: ids.has(item.id) ? item.createdAt : "",
      }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void publicApi.fetchPublicNotifications()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const ids = readStoredIds();
        const dismissed = readStoredIds(DISMISSED_STORAGE_KEY);
        setReadIds(ids);
        setDismissedIds(dismissed);
        setNotifications(applyReadState(payload.notifications, ids, dismissed));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [applyReadState]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const markOneRead = (notificationId: string) => {
    const nextIds = new Set(readIds);
    nextIds.add(notificationId);
    writeStoredIds(nextIds);
    setReadIds(nextIds);
    setNotifications((items) => applyReadState(items, nextIds, dismissedIds));
  };

  const markAllRead = () => {
    const nextIds = new Set(readIds);
    for (const item of notifications) {
      nextIds.add(item.id);
    }
    writeStoredIds(nextIds);
    setReadIds(nextIds);
    setNotifications((items) => applyReadState(items, nextIds, dismissedIds));
  };

  const dismissOne = (notificationId: string) => {
    const nextIds = new Set(dismissedIds);
    nextIds.add(notificationId);
    writeStoredIds(nextIds, DISMISSED_STORAGE_KEY);
    setDismissedIds(nextIds);
    setNotifications((items) => items.filter((item) => item.id !== notificationId));
  };

  const dismissAll = () => {
    if (notifications.length === 0) {
      return;
    }

    const nextIds = new Set(dismissedIds);
    for (const item of notifications) {
      nextIds.add(item.id);
    }
    writeStoredIds(nextIds, DISMISSED_STORAGE_KEY);
    setDismissedIds(nextIds);
    setNotifications([]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        aria-expanded={open}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 transition hover:border-rose-200 hover:text-rose-500",
          open && "border-stone-900",
          triggerClassName
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          emptyMessage="Chưa có thông báo công khai."
          onClose={() => setOpen(false)}
          onMarkAllRead={markAllRead}
          onDismissAll={dismissAll}
          onMarkRead={markOneRead}
          onDismiss={(item) => dismissOne(item.id)}
          className={cn(
            "rounded-xl border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:rounded-2xl",
            dropdownClassName
          )}
        />
      ) : null}
    </div>
  );
}
