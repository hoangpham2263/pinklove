"use client";

import { useState } from "react";
import Link from "next/link";
import { ImagePlus, Star, Video } from "lucide-react";
import { NativeForm } from "@/components/common/native-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CommentTarget } from "@/features/comments/types";
import { ROUTES } from "@/lib/routes";

export function OfferingReviewDialog({
  target,
  defaultAuthorName = "",
  defaultAuthorEmail = "",
  authenticated = false,
}: {
  target: CommentTarget;
  defaultAuthorName?: string;
  defaultAuthorEmail?: string;
  authenticated?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [imageCount, setImageCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Viết đánh giá
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-sm border-primary/20 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Viết đánh giá sản phẩm</DialogTitle>
          </DialogHeader>

          {!authenticated ? (
            <div className="space-y-4">
              <p className="text-sm leading-7">
                Bạn cần đăng nhập để viết đánh giá. Sau khi đăng nhập, PinkLove sẽ tự dùng thông tin tài khoản của bạn.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm border border-primary/20 bg-white px-5 py-2 text-sm font-semibold hover:border-primary"
                >
                  Đóng
                </button>
                <Link
                  href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(target.url)}`}
                  className="inline-flex rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Đăng nhập để đánh giá
                </Link>
              </div>
            </div>
          ) : (
          <NativeForm action={ROUTES.API.COMMENTS.CREATE} method="POST" encType="multipart/form-data" className="space-y-4">
            <input type="hidden" name="targetType" value={target.type} />
            <input type="hidden" name="targetId" value={target.id} />
            <input type="hidden" name="targetSlug" value={target.slug} />
            <input type="hidden" name="targetTitle" value={target.title} />
            <input type="hidden" name="targetUrl" value={target.url} />
            <input type="hidden" name="returnTo" value={`${target.url}?comment=pending`} />
            <input type="hidden" name="rating" value={rating} />
            <input type="hidden" name="hasImage" value={imageCount > 0 ? "1" : "0"} />
            <input type="hidden" name="hasVideo" value={videoCount > 0 ? "1" : "0"} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <input type="hidden" name="authorName" value={defaultAuthorName} />
            <input type="hidden" name="authorEmail" value={defaultAuthorEmail} />

            <div>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="rounded-sm p-1 outline-none hover:bg-primary/5 focus-visible:text-primary"
                    aria-label={`${value} sao`}
                  >
                    <Star
                      strokeWidth={1.5}
                      className={`h-7 w-7 text-primary ${value <= rating ? "fill-primary" : "fill-transparent opacity-25"}`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-2 text-sm font-medium text-stone-700">
              Nội dung đánh giá
              <textarea
                name="content"
                required
                maxLength={2000}
                rows={5}
                className="w-full rounded-sm border border-primary/20 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
              />
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-700">Đính kèm</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-primary/30 bg-primary/5 px-3 py-4 text-center text-sm transition hover:border-primary hover:bg-primary/10">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  <span className="mt-2 font-medium text-stone-800">Thêm ảnh</span>
                  <span className="mt-1 text-xs text-stone-500">
                    {imageCount > 0 ? `${imageCount} ảnh đã chọn` : "JPG, PNG, WEBP"}
                  </span>
                  <input
                    type="file"
                    name="reviewImages"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => setImageCount(event.currentTarget.files?.length ?? 0)}
                  />
                </label>

                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-primary/30 bg-primary/5 px-3 py-4 text-center text-sm transition hover:border-primary hover:bg-primary/10">
                  <Video className="h-5 w-5" aria-hidden="true" />
                  <span className="mt-2 font-medium text-stone-800">Thêm video</span>
                  <span className="mt-1 text-xs text-stone-500">
                    {videoCount > 0 ? `${videoCount} video đã chọn` : "MP4, MOV, WEBM"}
                  </span>
                  <input
                    type="file"
                    name="reviewVideos"
                    accept="video/mp4,video/quicktime,video/webm"
                    multiple
                    className="sr-only"
                    onChange={(event) => setVideoCount(event.currentTarget.files?.length ?? 0)}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-primary/20 bg-white px-5 py-2 text-sm font-semibold text-stone-700 hover:border-primary hover:text-primary"
              >
                Đóng
              </button>
              <button type="submit" className="rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Gửi đánh giá
              </button>
            </div>
          </NativeForm>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
