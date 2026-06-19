import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listApprovedCommentsForTarget } from "@/features/comments/server/service";
import type { CommentTarget, ContentComment } from "@/features/comments/types";
import { ROUTES } from "@/lib/routes";
import { CommentSubmissionToast } from "@/features/comments/components/comment-submission-toast";

type CommentSectionProps = {
  target: CommentTarget;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function CommentList({ comments }: { comments: ContentComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-stone-200 bg-white p-5 text-sm text-stone-500">
        Chưa có bình luận nào được duyệt.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article key={comment.id} className="rounded-sm border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-stone-950">{comment.authorName}</p>
            <time className="text-xs text-stone-400">{formatDate(comment.createdAt)}</time>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">{comment.content}</p>
        </article>
      ))}
    </div>
  );
}

export async function CommentSection({ target }: CommentSectionProps) {
  const [user, comments] = await Promise.all([getCurrentUser(), listApprovedCommentsForTarget(target)]);

  return (
    <section className="bg-stone-50 px-4 pb-10">
      <CommentSubmissionToast />
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-5">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-stone-400">
            <MessageSquare className="h-4 w-4" />
            Comments
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">Bình luận</h2>
          <p className="mt-2 text-sm leading-7 text-stone-600">
            Bình luận mới sẽ chờ admin duyệt trước khi hiển thị công khai.
          </p>
        </div>

        <div className="col-span-12 space-y-5 lg:col-span-7">
          <form action={ROUTES.API.COMMENTS.CREATE} method="POST" className="rounded-sm border border-stone-200 bg-white p-5">
            <input type="hidden" name="targetType" value={target.type} />
            <input type="hidden" name="targetId" value={target.id} />
            <input type="hidden" name="targetSlug" value={target.slug} />
            <input type="hidden" name="targetTitle" value={target.title} />
            <input type="hidden" name="targetUrl" value={target.url} />
            <input type="hidden" name="returnTo" value={`${target.url}?comment=pending`} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Tên hiển thị
                <input
                  name="authorName"
                  required
                  maxLength={120}
                  defaultValue={user?.username ?? ""}
                  className="h-10 w-full rounded-sm border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-stone-700">
                Email
                <input
                  name="authorEmail"
                  type="email"
                  maxLength={180}
                  className="h-10 w-full rounded-sm border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400"
                />
              </label>
            </div>

            <label className="mt-3 block space-y-2 text-sm font-medium text-stone-700">
              Nội dung
              <textarea
                name="content"
                required
                maxLength={2000}
                rows={4}
                className="w-full rounded-sm border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-stone-400"
              />
            </label>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-sm bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                Gửi bình luận
              </button>
            </div>
          </form>

          <CommentList comments={comments} />
        </div>
      </div>
    </section>
  );
}
