"use client";

import Link from "next/link";
import { CheckCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UserNotification } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

type NotificationFilter = "all" | "unread";

type NotificationDropdownProps = {
  notifications: UserNotification[];
  unreadCount: number;
  emptyMessage: string;
  listHref?: string;
  filter?: NotificationFilter;
  onFilterChange?: (filter: NotificationFilter) => void;
  onClose?: () => void;
  onMarkAllRead: () => void;
  onDismissAll: () => void;
  onMarkRead: (notificationId: string) => void;
  onDismiss: (notification: UserNotification) => void;
  className?: string;
};

export function NotificationDropdown({
  notifications,
  unreadCount,
  emptyMessage,
  listHref,
  filter,
  onFilterChange,
  onClose,
  onMarkAllRead,
  onDismissAll,
  onMarkRead,
  onDismiss,
  className,
}: NotificationDropdownProps) {
  const visibleNotifications = notifications.slice(0, 8);
  const hasNotifications = notifications.length > 0;
  const showFilters = Boolean(filter && onFilterChange);

  return (
    <div
      className={cn(
        "absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-background shadow-lg",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b px-3 py-2.5">
        <div>
          <p className="font-medium">Thông báo</p>
          <p className="text-xs text-muted-foreground">{unreadCount} chưa xem</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            disabled={!hasNotifications}
            onClick={onMarkAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Đã xem
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
            disabled={!hasNotifications}
            onClick={onDismissAll}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa tất cả
          </Button>
        </div>
      </div>

      {showFilters ? (
        <div className="flex gap-2 border-b px-3 py-2">
          <Button
            type="button"
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onFilterChange?.("all")}
          >
            Tất cả
          </Button>
          <Button
            type="button"
            variant={filter === "unread" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onFilterChange?.("unread")}
          >
            Chưa xem
          </Button>
        </div>
      ) : null}

      <div className="max-h-80 overflow-y-auto">
        {visibleNotifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          visibleNotifications.map((item) => {
            const href = item.linkUrl || listHref;
            const content = (
              <div className="flex items-start gap-2">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.isRead ? "bg-muted" : "bg-primary")} />
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="line-clamp-1 min-w-0 text-sm font-medium">{item.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px]",
                        item.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      )}
                    >
                      {item.isRead ? "Đã xem" : "Chưa xem"}
                    </span>
                  </div>
                  {item.body ? <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.body}</p> : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>
            );

            return (
              <div key={item.id} className="flex items-stretch border-b transition-colors hover:bg-muted">
                {href ? (
                  <Link
                    href={href}
                    className="min-w-0 flex-1 px-3 py-2.5"
                    onClick={() => {
                      onMarkRead(item.id);
                      onClose?.();
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-3 py-2.5"
                    onClick={() => onMarkRead(item.id)}
                  >
                    {content}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Xóa thông báo ${item.title}`}
                  className="mx-2 my-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDismiss(item)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
