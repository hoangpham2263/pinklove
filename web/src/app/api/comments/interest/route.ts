import { NextResponse } from "next/server";
import { updateCommentLikedCount } from "@/features/comments/server/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const commentId = typeof payload.commentId === "string" ? payload.commentId.trim() : "";
    const interested = Boolean(payload.interested);

    if (!commentId) {
      return NextResponse.json({ error: "missing_comment_id" }, { status: 400 });
    }

    const comment = await updateCommentLikedCount(commentId, interested ? 1 : -1);

    if (!comment) {
      return NextResponse.json({ error: "comment_not_found" }, { status: 404 });
    }

    return NextResponse.json({ likedCount: comment.likedCount });
  } catch {
    return NextResponse.json({ error: "interest_update_failed" }, { status: 500 });
  }
}
