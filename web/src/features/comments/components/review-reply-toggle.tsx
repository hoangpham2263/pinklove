"use client";

import { useState } from "react";
import { BadgeCheck, ChevronDown } from "lucide-react";

export function ReviewReplyToggle({
  authorName,
  replyCount,
}: {
  authorName: string;
  replyCount: number;
}) {
  const [open, setOpen] = useState(false);

  if (replyCount <= 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 text-sm text-primary transition hover:underline"
        aria-expanded={open}
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        <span>{open ? "Ẩn phản hồi" : `Xem ${replyCount} phản hồi từ PinkLove`}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-2.5">
          {Array.from({ length: replyCount }).map((_, index) => (
            <div
              key={index}
              className="rounded-sm border border-l-2 border-primary/10 border-l-primary bg-gradient-to-r from-primary/8 to-white px-4 py-3"
            >
              <p className="flex items-center gap-1.5 text-sm font-medium">
                PinkLove
                <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" aria-hidden="true" />
              </p>
              <p className="mt-1 text-sm leading-6">
                Cảm ơn {authorName}. PinkLove đã ghi nhận đánh giá của bạn.
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
