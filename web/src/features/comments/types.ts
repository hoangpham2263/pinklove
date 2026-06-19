export type CommentTargetType = "offering" | "blog_post" | "page" | "invitation";

export type CommentStatus = "pending" | "approved" | "rejected" | "spam" | "deleted";

export type CommentTarget = {
  type: CommentTargetType;
  id: string;
  slug: string;
  title: string;
  url: string;
};

export type ContentComment = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  targetSlug: string;
  targetTitle: string;
  targetUrl: string;
  authorName: string;
  authorEmail: string;
  authorUserId: string | null;
  content: string;
  rating: number;
  hasImage: boolean;
  hasVideo: boolean;
  replyCount: number;
  likedCount: number;
  status: CommentStatus;
  adminNote: string;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentInput = {
  target: CommentTarget;
  authorName: string;
  authorEmail: string;
  authorUserId?: string | null;
  content: string;
  rating?: number;
  hasImage?: boolean;
  hasVideo?: boolean;
};
