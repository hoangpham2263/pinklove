import "server-only";

import type { BlogCategory, BlogPost } from "@/features/blog/types";
import { query } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media-resolver";

type BlogCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  status: "draft" | "published";
  category_id: string;
  category_slug: string;
  category_name: string;
  created_at: string;
  updated_at: string;
};

function mapCategory(row: BlogCategoryRow): BlogCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    content: row.content ?? undefined,
    coverImage: row.cover_image ?? undefined,
    status: row.status,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mapPostRows(rows: BlogPostRow[]): Promise<BlogPost[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...mapPost(row),
      coverImage: await resolveMediaUrl(row.cover_image),
    }))
  );
}

export async function listPublishedBlogCategories(): Promise<BlogCategory[]> {
  const result = await query<BlogCategoryRow>(
    `
      SELECT *
      FROM blog_categories
      WHERE status = 'published'
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapCategory);
}

export async function getPublishedBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const result = await query<BlogCategoryRow>(
    `
      SELECT *
      FROM blog_categories
      WHERE slug = $1
        AND status = 'published'
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapCategory(result.rows[0]);
}

export async function listPublishedBlogPosts(categorySlug?: string): Promise<BlogPost[]> {
  const result = await query<BlogPostRow>(
    `
      SELECT
        posts.*,
        categories.slug AS category_slug,
        categories.name AS category_name
      FROM blog_posts posts
      INNER JOIN blog_categories categories ON categories.id = posts.category_id
      WHERE posts.status = 'published'
        AND categories.status = 'published'
        AND ($1::text IS NULL OR categories.slug = $1)
      ORDER BY posts.created_at DESC
    `,
    [categorySlug ?? null]
  );

  return mapPostRows(result.rows);
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await query<BlogPostRow>(
    `
      SELECT
        posts.*,
        categories.slug AS category_slug,
        categories.name AS category_name
      FROM blog_posts posts
      INNER JOIN blog_categories categories ON categories.id = posts.category_id
      WHERE posts.slug = $1
        AND posts.status = 'published'
        AND categories.status = 'published'
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rows[0]) {
    return null;
  }

  return (await mapPostRows(result.rows))[0] ?? null;
}

export async function listRelatedBlogPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const result = await query<BlogPostRow>(
    `
      SELECT
        posts.*,
        categories.slug AS category_slug,
        categories.name AS category_name
      FROM blog_posts posts
      INNER JOIN blog_categories categories ON categories.id = posts.category_id
      WHERE posts.status = 'published'
        AND categories.status = 'published'
        AND posts.category_id = $1
        AND posts.id <> $2
      ORDER BY posts.created_at DESC
      LIMIT $3
    `,
    [post.categoryId, post.id, limit]
  );

  return mapPostRows(result.rows);
}
