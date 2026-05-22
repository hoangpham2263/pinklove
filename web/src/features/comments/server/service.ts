import { query } from "@/lib/database";
import type { CommentStatus, CommentTarget, CommentTargetType, ContentComment, CreateCommentInput } from "@/features/comments/types";

type CommentRow = {
  id: string;
  target_type: CommentTargetType;
  target_id: string;
  target_slug: string;
  target_title: string;
  target_url: string;
  author_name: string;
  author_email: string;
  author_user_id: string | null;
  content: string;
  status: CommentStatus;
  admin_note: string;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

const VALID_TARGET_TYPES: CommentTargetType[] = ["offering", "blog_post", "page", "invitation"];
const VALID_STATUSES: CommentStatus[] = ["pending", "approved", "rejected", "spam", "deleted"];

function mapComment(row: CommentRow): ContentComment {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetSlug: row.target_slug,
    targetTitle: row.target_title,
    targetUrl: row.target_url,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorUserId: row.author_user_id,
    content: row.content,
    status: row.status,
    adminNote: row.admin_note,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTargetType(value: string): CommentTargetType {
  return VALID_TARGET_TYPES.includes(value as CommentTargetType) ? (value as CommentTargetType) : "offering";
}

function normalizeStatus(value: string): CommentStatus {
  return VALID_STATUSES.includes(value as CommentStatus) ? (value as CommentStatus) : "pending";
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanContent(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim().slice(0, 2000);
}

export function parseCommentTargetFromForm(formData: FormData): CommentTarget {
  return {
    type: normalizeTargetType(String(formData.get("targetType") ?? "offering")),
    id: cleanText(String(formData.get("targetId") ?? ""), 120),
    slug: cleanText(String(formData.get("targetSlug") ?? ""), 200),
    title: cleanText(String(formData.get("targetTitle") ?? ""), 240),
    url: cleanText(String(formData.get("targetUrl") ?? ""), 500),
  };
}

export async function createPendingComment(input: CreateCommentInput) {
  const authorName = cleanText(input.authorName, 120);
  const authorEmail = cleanText(input.authorEmail.toLowerCase(), 180);
  const content = cleanContent(input.content);

  if (!input.target.id || !input.target.title) {
    throw new Error("MISSING_TARGET");
  }

  if (!authorName) {
    throw new Error("MISSING_AUTHOR_NAME");
  }

  if (!content) {
    throw new Error("MISSING_CONTENT");
  }

  const result = await query<CommentRow>(
    `
      INSERT INTO content_comments (
        target_type,
        target_id,
        target_slug,
        target_title,
        target_url,
        author_name,
        author_email,
        author_user_id,
        content,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `,
    [
      input.target.type,
      input.target.id,
      cleanText(input.target.slug, 200),
      cleanText(input.target.title, 240),
      cleanText(input.target.url, 500),
      authorName,
      authorEmail,
      input.authorUserId || null,
      content,
    ]
  );

  return mapComment(result.rows[0]);
}

export async function listApprovedCommentsForTarget(target: Pick<CommentTarget, "type" | "id">) {
  const result = await query<CommentRow>(
    `
      SELECT *
      FROM content_comments
      WHERE target_type = $1
        AND target_id = $2
        AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [target.type, target.id]
  );

  return result.rows.map(mapComment);
}

export async function listAdminComments(options: { status?: string; keyword?: string } = {}) {
  const status = String(options.status ?? "").trim();
  const keyword = String(options.keyword ?? "").trim();
  const values: unknown[] = [];
  const where: string[] = ["status <> 'deleted'"];

  if (status && status !== "all") {
    values.push(normalizeStatus(status));
    where.push(`status = $${values.length}`);
  }

  if (keyword) {
    values.push(`%${keyword.toLowerCase()}%`);
    where.push(`(
      LOWER(author_name) LIKE $${values.length}
      OR LOWER(author_email) LIKE $${values.length}
      OR LOWER(content) LIKE $${values.length}
      OR LOWER(target_title) LIKE $${values.length}
    )`);
  }

  const result = await query<CommentRow>(
    `
      SELECT *
      FROM content_comments
      WHERE ${where.join(" AND ")}
      ORDER BY
        CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 WHEN 'spam' THEN 3 ELSE 4 END,
        created_at DESC
      LIMIT 300
    `,
    values
  );

  return result.rows.map(mapComment);
}

export async function updateCommentStatus(commentId: string, status: CommentStatus, adminUserId: string, adminNote = "") {
  const normalizedStatus = normalizeStatus(status);
  const result = await query<CommentRow>(
    `
      UPDATE content_comments
      SET status = $2,
          admin_note = $3,
          approved_at = CASE WHEN $2 = 'approved' THEN NOW() ELSE approved_at END,
          approved_by = CASE WHEN $2 = 'approved' THEN $4 ELSE approved_by END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [commentId, normalizedStatus, cleanText(adminNote, 500), adminUserId]
  );

  return result.rows[0] ? mapComment(result.rows[0]) : null;
}

export async function softDeleteComment(commentId: string) {
  const result = await query<CommentRow>(
    `
      UPDATE content_comments
      SET status = 'deleted',
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [commentId]
  );

  return result.rows[0] ? mapComment(result.rows[0]) : null;
}
