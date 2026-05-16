"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

import type { UserNotification } from "@/features/notifications/types";
import { publicApi } from "@/lib/api-client.public";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pinklove:guest-notification-read-ids";

type GuestNotificationBellProps = {
  triggerClassName?: string;
};

function readStoredIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? (JSON.parse(value) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeStoredIds(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-200)));
}

export function GuestNotificationBell({ triggerClassName }: GuestNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => readStoredIds());

  const applyReadState = useCallback((items: UserNotification[], ids: Set<string>) => {
    return items.map((item) => ({
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
        setReadIds(ids);
        setNotifications(applyReadState(payload.notifications, ids));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [applyReadState]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const visibleNotifications = notifications.slice(0, 8);

  const markOneRead = (notificationId: string) => {
    const nextIds = new Set(readIds);
    nextIds.add(notificationId);
    writeStoredIds(nextIds);
    setReadIds(nextIds);
    setNotifications((items) => applyReadState(items, nextIds));
  };

  const markAllRead = () => {
    const nextIds = new Set(readIds);
    for (const item of notifications) {
      nextIds.add(item.id);
    }
    writeStoredIds(nextIds);
    setReadIds(nextIds);
    setNotifications((items) => applyReadState(items, nextIds));
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
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:rounded-2xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <div>
              <p className="font-medium text-stone-950">Thông báo</p>
              <p className="text-xs text-stone-500">{unreadCount} chưa xem</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
              onClick={markAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đã xem
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">Chưa có thông báo công khai.</p>
            ) : (
              visibleNotifications.map((item) => {
                const content = (
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-stone-200" : "bg-rose-500"}`} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="line-clamp-1 text-sm font-medium text-stone-950">{item.title}</p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${item.isRead ? "bg-stone-100 text-stone-500" : "bg-rose-50 text-rose-600"}`}>
                          {item.isRead ? "Đã xem" : "Chưa xem"}
                        </span>
                      </div>
                      {item.body ? <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-stone-500">{item.body}</p> : null}
                      <p className="mt-1 text-[11px] text-stone-400">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                );

                if (!item.linkUrl) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="block w-full border-b border-stone-100 px-4 py-3 transition hover:bg-stone-50"
                      onClick={() => markOneRead(item.id)}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.linkUrl}
                    className="block border-b border-stone-100 px-4 py-3 transition hover:bg-stone-50"
                    onClick={() => {
                      markOneRead(item.id);
                      setOpen(false);
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
