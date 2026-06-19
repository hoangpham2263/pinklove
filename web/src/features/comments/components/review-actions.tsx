"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, MessageSquareReply, Send } from "lucide-react";
import { ReviewReplyToggle } from "@/features/comments/components/review-reply-toggle";
import { ROUTES } from "@/lib/routes";

type ReviewActionsProps = {
  reviewId: string;
  authorName: string;
  initialLikedCount: number;
  replyCount: number;
};

type LocalReply = {
  id: string;
  content: string;
};

export function ReviewActions({ reviewId, authorName, initialLikedCount, replyCount }: ReviewActionsProps) {
  const [liked, setLiked] = useState(false);
  const [likedCount, setLikedCount] = useState(initialLikedCount);
  const [likePending, setLikePending] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [localReplies, setLocalReplies] = useState<LocalReply[]>([]);

  const likedStorageKey = useMemo(() => `pinklove-review-interest:${reviewId}`, [reviewId]);
  const canSubmitReply = replyContent.trim().length > 0;

  useEffect(() => {
    setLiked(window.localStorage.getItem(likedStorageKey) === "1");
  }, [likedStorageKey]);

  async function toggleLiked() {
    if (likePending) {
      return;
    }

    const nextLiked = !liked;
    const previousLiked = liked;
    const previousLikedCount = likedCount;

    setLiked(nextLiked);
    setLikedCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setLikePending(true);

    try {
      const response = await fetch(ROUTES.API.COMMENTS.INTEREST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: reviewId, interested: nextLiked }),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật quan tâm.");
      }

      const payload = (await response.json()) as { likedCount?: number };

      if (typeof payload.likedCount === "number") {
        setLikedCount(payload.likedCount);
      }

      if (nextLiked) {
        window.localStorage.setItem(likedStorageKey, "1");
      } else {
        window.localStorage.removeItem(likedStorageKey);
      }
    } catch {
      setLiked(previousLiked);
      setLikedCount(previousLikedCount);
    } finally {
      setLikePending(false);
    }
  }

  function submitReply() {
    const content = replyContent.trim();

    if (!content) {
      return;
    }

    setLocalReplies((current) => [{ id: crypto.randomUUID(), content }, ...current]);
    setReplyContent("");
    setReplyOpen(false);
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => setReplyOpen((value) => !value)}
          className={`inline-flex items-center gap-1 transition hover:text-primary ${replyOpen ? "text-primary" : ""}`}
          aria-expanded={replyOpen}
        >
          <MessageSquareReply className="h-4 w-4" aria-hidden="true" />
          Trả lời
        </button>
        <button
          type="button"
          onClick={toggleLiked}
          disabled={likePending}
          className={`inline-flex items-center gap-1 transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 ${liked ? "text-primary" : ""}`}
          aria-pressed={liked}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} aria-hidden="true" />
          Quan tâm ({likedCount})
        </button>
      </div>

      {replyOpen ? (
        <div className="mt-3 flex gap-2">
          <input
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitReply();
              }
            }}
            className="min-h-10 flex-1 rounded-sm border bg-white px-3 text-sm outline-none transition placeholder:opacity-50 focus:border-primary"
            placeholder={`Trả lời ${authorName}`}
          />
          <button
            type="button"
            onClick={submitReply}
            disabled={!canSubmitReply}
            className="inline-flex min-h-10 items-center justify-center rounded-sm border border-primary/20 px-3 text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Gửi phản hồi"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {localReplies.length ? (
        <div className="mt-3 space-y-2">
          {localReplies.map((reply) => (
            <div key={reply.id} className="rounded-sm border border-primary/10 bg-primary/5 px-4 py-2.5">
              <p className="text-sm font-medium">Bạn</p>
              <p className="mt-1 text-sm leading-6">{reply.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ReviewReplyToggle authorName={authorName} replyCount={replyCount} />
    </div>
  );
}
