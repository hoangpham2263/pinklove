import "server-only";

import type { Product, ProductType } from "@/features/products/types";
import { query } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media-resolver";

type ProductInput = {
  slug: string;
  name: string;
  excerpt?: string;
  description?: string;
  status?: "draft" | "published";
  productType: ProductType;
  templateKey: string;
  thumbnailUrl?: string;
  price?: number;
  config?: Record<string, unknown>;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  excerpt: string | null;
  description: string | null;
  status: "draft" | "published";
  product_type: ProductType;
  template_key: string;
  thumbnail_url: string | null;
  price: string;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    excerpt: row.excerpt ?? undefined,
    description: row.description ?? undefined,
    status: row.status,
    productType: row.product_type,
    templateKey: row.template_key,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    price: Number(row.price ?? "0"),
    config: row.config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function mapProductRows(rows: ProductRow[]): Promise<Product[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...mapProductRow(row),
      thumbnailUrl: await resolveMediaUrl(row.thumbnail_url),
    }))
  );
}

export async function listPublishedProducts(): Promise<Product[]> {
  const result = await query<ProductRow>(
    `
      SELECT *
      FROM products
      WHERE status = 'published'
      ORDER BY product_type ASC, created_at DESC
    `
  );

  return mapProductRows(result.rows);
}

export async function listPublishedProductsByType(productType: ProductType): Promise<Product[]> {
  const result = await query<ProductRow>(
    `
      SELECT *
      FROM products
      WHERE status = 'published'
        AND product_type = $1
      ORDER BY created_at DESC
    `,
    [productType]
  );

  return mapProductRows(result.rows);
}

export async function listAllProducts(): Promise<Product[]> {
  const result = await query<ProductRow>(
    `
      SELECT *
      FROM products
      ORDER BY product_type ASC, created_at DESC
    `
  );

  return mapProductRows(result.rows);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await query<ProductRow>(
    `
      SELECT *
      FROM products
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rows[0]) {
    return null;
  }

  return (await mapProductRows(result.rows))[0] ?? null;
}

export async function getPublishedProductBySlugAndType(
  slug: string,
  productType: ProductType
): Promise<Product | null> {
  const result = await query<ProductRow>(
    `
      SELECT *
      FROM products
      WHERE slug = $1
        AND status = 'published'
        AND product_type = $2
      LIMIT 1
    `,
    [slug, productType]
  );

  if (!result.rows[0]) {
    return null;
  }

  return (await mapProductRows(result.rows))[0] ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const result = await query<ProductRow>(
    `
      INSERT INTO products (
        slug, name, excerpt, description, status, product_type, template_key, thumbnail_url, price, config
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      input.slug,
      input.name,
      input.excerpt || null,
      input.description || null,
      input.status || "draft",
      input.productType,
      input.templateKey,
      input.thumbnailUrl || null,
      input.price ?? 0,
      input.config || {},
    ]
  );

  return (await mapProductRows(result.rows))[0];
}

export async function updateProduct(slug: string, input: Partial<ProductInput>): Promise<Product | null> {
  const existing = await getProductBySlug(slug);
  if (!existing) {
    return null;
  }

  const result = await query<ProductRow>(
    `
      UPDATE products
      SET
        slug = COALESCE($1, slug),
        name = COALESCE($2, name),
        excerpt = $3,
        description = $4,
        status = COALESCE($5, status),
        product_type = COALESCE($6, product_type),
        template_key = COALESCE($7, template_key),
        thumbnail_url = $8,
        price = COALESCE($9, price),
        config = $10,
        updated_at = NOW()
      WHERE slug = $11
      RETURNING *
    `,
    [
      input.slug,
      input.name,
      input.excerpt !== undefined ? input.excerpt : existing.excerpt ?? null,
      input.description !== undefined ? input.description : existing.description ?? null,
      input.status,
      input.productType,
      input.templateKey,
      input.thumbnailUrl !== undefined ? input.thumbnailUrl : existing.thumbnailUrl ?? null,
      input.price,
      input.config !== undefined ? input.config : existing.config,
      slug,
    ]
  );

  if (!result.rows[0]) {
    return null;
  }

  return (await mapProductRows(result.rows))[0] ?? null;
}

export async function deleteProduct(slug: string): Promise<boolean> {
  const result = await query(
    `
      DELETE FROM products
      WHERE slug = $1
      RETURNING id
    `,
    [slug]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateProductsStatus(
  slugs: string[],
  status: "draft" | "published"
): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await query(
    `
      UPDATE products
      SET
        status = $2,
        updated_at = NOW()
      WHERE slug = ANY($1::text[])
    `,
    [slugs, status]
  );

  return result.rowCount ?? 0;
}

export async function deleteProducts(slugs: string[]): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await query(
    `
      DELETE FROM products
      WHERE slug = ANY($1::text[])
    `,
    [slugs]
  );

  return result.rowCount ?? 0;
}
