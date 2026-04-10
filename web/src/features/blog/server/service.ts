import "server-only";

import type { BlogCategory, BlogPost } from "@/features/blog/types";
import { query } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media-resolver";

type BlogCategoryInput = {
  slug: string;
  name: string;
  description?: string;
  status?: "draft" | "published";
};

type BlogPostInput = {
  categoryId: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status?: "draft" | "published";
};

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

export async function listAllBlogCategories(): Promise<BlogCategory[]> {
  const result = await query<BlogCategoryRow>(
    `
      SELECT *
      FROM blog_categories
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapCategory);
}

export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const result = await query<BlogCategoryRow>(
    `
      SELECT *
      FROM blog_categories
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] ? mapCategory(result.rows[0]) : null;
}

export async function createBlogCategory(input: BlogCategoryInput): Promise<BlogCategory> {
  const result = await query<BlogCategoryRow>(
    `
      INSERT INTO blog_categories (slug, name, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [input.slug, input.name, input.description || null, input.status || "draft"]
  );

  return mapCategory(result.rows[0]);
}

export async function updateBlogCategory(slug: string, input: Partial<BlogCategoryInput>): Promise<BlogCategory | null> {
  const existing = await getBlogCategoryBySlug(slug);
  if (!existing) {
    return null;
  }

  const result = await query<BlogCategoryRow>(
    `
      UPDATE blog_categories
      SET
        slug = COALESCE($1, slug),
        name = COALESCE($2, name),
        description = $3,
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE slug = $5
      RETURNING *
    `,
    [
      input.slug,
      input.name,
      input.description !== undefined ? input.description : existing.description ?? null,
      input.status,
      slug,
    ]
  );

  return result.rows[0] ? mapCategory(result.rows[0]) : null;
}

export async function deleteBlogCategory(slug: string): Promise<boolean> {
  const result = await query(
    `
      DELETE FROM blog_categories
      WHERE slug = $1
      RETURNING id
    `,
    [slug]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function listAllBlogPosts(): Promise<BlogPost[]> {
  const result = await query<BlogPostRow>(
    `
      SELECT
        posts.*,
        categories.slug AS category_slug,
        categories.name AS category_name
      FROM blog_posts posts
      INNER JOIN blog_categories categories ON categories.id = posts.category_id
      ORDER BY posts.created_at DESC
    `
  );

  return mapPostRows(result.rows);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await query<BlogPostRow>(
    `
      SELECT
        posts.*,
        categories.slug AS category_slug,
        categories.name AS category_name
      FROM blog_posts posts
      INNER JOIN blog_categories categories ON categories.id = posts.category_id
      WHERE posts.slug = $1
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] ? (await mapPostRows(result.rows))[0] ?? null : null;
}

export async function createBlogPost(input: BlogPostInput): Promise<BlogPost> {
  const result = await query<{ id: string }>(
    `
      INSERT INTO blog_posts (category_id, slug, title, excerpt, content, cover_image, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [
      input.categoryId,
      input.slug,
      input.title,
      input.excerpt || null,
      input.content || null,
      input.coverImage || null,
      input.status || "draft",
    ]
  );

  const created = await getBlogPostBySlug(input.slug);
  if (!created || !result.rows[0]) {
    throw new Error("BLOG_POST_CREATE_FAILED");
  }

  return created;
}

export async function updateBlogPost(slug: string, input: Partial<BlogPostInput>): Promise<BlogPost | null> {
  const existing = await getBlogPostBySlug(slug);
  if (!existing) {
    return null;
  }

  const result = await query<{ id: string }>(
    `
      UPDATE blog_posts
      SET
        category_id = COALESCE($1, category_id),
        slug = COALESCE($2, slug),
        title = COALESCE($3, title),
        excerpt = $4,
        content = $5,
        cover_image = $6,
        status = COALESCE($7, status),
        updated_at = NOW()
      WHERE slug = $8
      RETURNING id
    `,
    [
      input.categoryId,
      input.slug,
      input.title,
      input.excerpt !== undefined ? input.excerpt : existing.excerpt ?? null,
      input.content !== undefined ? input.content : existing.content ?? null,
      input.coverImage !== undefined ? input.coverImage : existing.coverImage ?? null,
      input.status,
      slug,
    ]
  );

  if (!result.rows[0]) {
    return null;
  }

  return await getBlogPostBySlug(input.slug ?? slug);
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  const result = await query(
    `
      DELETE FROM blog_posts
      WHERE slug = $1
      RETURNING id
    `,
    [slug]
  );

  return (result.rowCount ?? 0) > 0;
}
