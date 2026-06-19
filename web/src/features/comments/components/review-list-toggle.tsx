"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type ReviewListMeta = {
  id: string;
  rating: number;
  hasImage: boolean;
  hasVideo: boolean;
};

export function ReviewListToggle({
  initialCount = 5,
  children,
  reviews,
}: {
  initialCount?: number;
  children: ReactNode[];
  reviews: ReviewListMeta[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [mediaFilter, setMediaFilter] = useState<"image" | "video" | null>(null);
  const filteredChildren = children.filter((_, index) => {
    const review = reviews[index];

    if (!review) {
      return false;
    }

    if (ratingFilter && review.rating !== ratingFilter) {
      return false;
    }

    if (mediaFilter === "image" && !review.hasImage) {
      return false;
    }

    if (mediaFilter === "video" && !review.hasVideo) {
      return false;
    }

    return true;
  });
  const visibleChildren = expanded ? filteredChildren : filteredChildren.slice(0, initialCount);
  const hiddenCount = Math.max(0, filteredChildren.length - initialCount);

  function getFilterButtonClass(active: boolean) {
    return `min-w-24 rounded-sm border bg-white px-5 py-2 transition hover:border-primary hover:bg-primary/5 hover:text-primary ${
      active ? "border-primary bg-primary/5 text-primary" : ""
    }`;
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => {
              setExpanded(false);
              setRatingFilter((value) => (value === rating ? null : rating));
            }}
            className={getFilterButtonClass(ratingFilter === rating)}
          >
            {rating} Sao
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setMediaFilter((value) => (value === "image" ? null : "image"));
          }}
          className={getFilterButtonClass(mediaFilter === "image")}
        >
          Có hình ảnh
        </button>
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setMediaFilter((value) => (value === "video" ? null : "video"));
          }}
          className={getFilterButtonClass(mediaFilter === "video")}
        >
          Có video
        </button>
      </div>

      {visibleChildren.length ? (
        <div className="divide-y border-t">{visibleChildren}</div>
      ) : (
        <div className="rounded-sm border border-dashed bg-white p-5 text-sm">
          Không có đánh giá phù hợp.
        </div>
      )}
      {hiddenCount > 0 ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-primary/20 bg-white px-5 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
          >
            {expanded ? "Thu gọn" : `Xem thêm ${hiddenCount} đánh giá`}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
