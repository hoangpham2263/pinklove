import { Clock3, Star } from "lucide-react";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { listApprovedOfferingReviews } from "@/features/comments/server/service";
import type { CommentTarget, ContentComment } from "@/features/comments/types";
import { CommentSubmissionToast } from "@/features/comments/components/comment-submission-toast";
import { OfferingReviewDialog } from "@/features/comments/components/offering-review-dialog";
import { ReviewListToggle } from "@/features/comments/components/review-list-toggle";
import { ReviewActions } from "@/features/comments/components/review-actions";
import { ReviewMediaPreview } from "@/features/comments/components/review-media-preview";

type OfferingReviewSectionProps = {
  target: CommentTarget;
  embedded?: boolean;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function ReviewStars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const className = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          strokeWidth={1.5}
          className={`${className} text-primary ${index < rating ? "fill-primary" : "fill-transparent opacity-25"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function getAverageRating(reviews: ContentComment[]) {
  if (reviews.length === 0) {
    return 0;
  }

  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

function getRatingDistribution(reviews: ContentComment[]) {
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));
}

function ReviewAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

const reviewPreviewImages = [
  "/uploads/seed-offerings/seed-red-wedding-web-01.png",
  "/uploads/seed-offerings/seed-red-wedding-web-02.png",
  "/uploads/seed-offerings/seed-red-wedding-web-03.png",
];

function getReviewPreviewImage(reviewId: string, index = 0) {
  const seed = reviewId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return reviewPreviewImages[(seed + index) % reviewPreviewImages.length];
}

function ReviewCard({ review }: { review: ContentComment }) {
  const mediaItems = [
    ...(review.hasImage
      ? [
          { type: "image" as const, src: getReviewPreviewImage(review.id, 0) },
          { type: "image" as const, src: getReviewPreviewImage(review.id, 1) },
        ]
      : []),
    ...(review.hasVideo ? [{ type: "video" as const, src: getReviewPreviewImage(review.id, 2) }] : []),
  ];

  return (
    <article className="py-5">
      <div className="flex items-center gap-3">
        <ReviewAvatar name={review.authorName} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{review.authorName}</p>
            <ReviewStars rating={review.rating} />
          </div>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-stone-400">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDateTime(review.createdAt)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6">{review.content}</p>

      <ReviewMediaPreview items={mediaItems} />

      <ReviewActions
        reviewId={review.id}
        authorName={review.authorName}
        initialLikedCount={review.likedCount}
        replyCount={review.replyCount}
      />
    </article>
  );
}

export async function OfferingReviewSection({ target, embedded = false }: OfferingReviewSectionProps) {
  const [user, reviews] = await Promise.all([getCurrentUser(), listApprovedOfferingReviews(target)]);
  const profile = user ? await getUserProfile(user.id) : null;
  const reviewAuthorName = profile?.displayName || profile?.fullName || user?.accountName || "";
  const averageRating = getAverageRating(reviews);
  const distribution = getRatingDistribution(reviews);
  const maxCount = Math.max(1, ...distribution.map((item) => item.count));

  const content = (
    <>
      <CommentSubmissionToast />
      <div className="bg-white px-4 py-5 sm:px-6">
        <h2 className="text-lg font-bold uppercase">Đánh giá sản phẩm</h2>

        <div className="mt-8 grid grid-cols-12 gap-8 lg:items-center">
          <div className="col-span-12 flex flex-col items-center justify-center lg:col-span-4">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold">{averageRating ? averageRating.toFixed(0) : 0}</span>
              <span className="pb-1 text-sm">/ 5</span>
            </div>
            <ReviewStars rating={Math.round(averageRating || 0)} size="lg" />
            <OfferingReviewDialog
              target={target}
              defaultAuthorName={reviewAuthorName}
              authenticated={Boolean(user)}
            />
          </div>

          <div className="col-span-12 space-y-3 lg:col-span-8">
            {distribution.map((item) => (
              <div key={item.rating} className="grid grid-cols-12 items-center gap-4 text-xs">
                <span className="col-span-2">{item.rating} sao</span>
                <div className="col-span-7 h-3 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(0, (item.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="col-span-3 text-right">{item.count} đánh giá</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {reviews.length ? (
            <ReviewListToggle
              initialCount={5}
              reviews={reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                hasImage: review.hasImage,
                hasVideo: review.hasVideo,
              }))}
            >
              {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            </ReviewListToggle>
          ) : (
            <div className="rounded-sm border border-dashed bg-white p-5 text-sm">
              Chưa có đánh giá nào được duyệt.
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <section className="rounded-sm border bg-white">{content}</section>;
  }

  return (
    <section className="bg-stone-50 pb-10 pt-10 lg:pt-15 2xl:pt-20">
      <div className="container mx-auto px-4">
        {content}
      </div>
    </section>
  );
}
