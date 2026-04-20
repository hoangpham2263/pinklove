import "server-only";

import type { Product, ProductCategory, ProductFulfillmentType, ProductType } from "@/features/products/types";
import { ensureProductCatalogReady, query } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media-resolver";

type ProductInput = {
  slug: string;
  categoryId?: string;
  name: string;
  excerpt?: string;
  description?: string;
  status?: "draft" | "published";
  productType: ProductType;
  templateKey: string;
  thumbnailUrl?: string;
  price?: number;
  fulfillmentType?: ProductFulfillmentType;
  config?: Record<string, unknown>;
};

type ProductCategoryInput = {
  slug: string;
  name: string;
  description?: string;
  status?: "draft" | "published";
};

type ProductCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  slug: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  name: string;
  excerpt: string | null;
  description: string | null;
  status: "draft" | "published";
  product_type: ProductType;
  template_key: string;
  thumbnail_url: string | null;
  price: string;
  fulfillment_type: ProductFulfillmentType;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapProductCategoryRow(row: ProductCategoryRow): ProductCategory {
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

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id ?? undefined,
    categorySlug: row.category_slug ?? undefined,
    categoryName: row.category_name ?? undefined,
    name: row.name,
    excerpt: row.excerpt ?? undefined,
    description: row.description ?? undefined,
    status: row.status,
    productType: row.product_type,
    templateKey: row.template_key,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    price: Number(row.price ?? "0"),
    fulfillmentType: row.fulfillment_type,
    config: row.config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT = `
  SELECT
    products.*,
    categories.slug AS category_slug,
    categories.name AS category_name
  FROM products
  LEFT JOIN product_categories categories ON categories.id = products.category_id
`;

type PgLikeError = {
  code?: string;
  message?: string;
};

function isMissingProductCatalogRelation(error: unknown) {
  const pgError = error as PgLikeError;
  return pgError?.code === "42P01" || pgError?.code === "42703" || /product_categories|category_id/i.test(pgError?.message ?? "");
}

async function withProductCatalogRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingProductCatalogRelation(error)) {
      throw error;
    }

    await ensureProductCatalogReady();
    return operation();
  }
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
  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.status = 'published'
        ORDER BY products.product_type ASC, products.created_at DESC
      `
    )
  );

  return mapProductRows(result.rows);
}

export async function listPublishedProductsByType(productType: ProductType): Promise<Product[]> {
  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.status = 'published'
          AND products.product_type = $1
        ORDER BY products.created_at DESC
      `,
      [productType]
    )
  );

  return mapProductRows(result.rows);
}

export async function listAllProducts(): Promise<Product[]> {
  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        ORDER BY products.product_type ASC, products.created_at DESC
      `
    )
  );

  return mapProductRows(result.rows);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.slug = $1
        LIMIT 1
      `,
      [slug]
    )
  );

  if (!result.rows[0]) {
    return null;
  }

  return (await mapProductRows(result.rows))[0] ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.id::text = $1::text
        LIMIT 1
      `,
      [id]
    )
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
  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.slug = $1
          AND products.status = 'published'
          AND products.product_type = $2
        LIMIT 1
      `,
      [slug, productType]
    )
  );

  if (!result.rows[0]) {
    return null;
  }

  return (await mapProductRows(result.rows))[0] ?? null;
}

export async function listPublishedProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) {
    return [];
  }

  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.status = 'published'
          AND products.id::text = ANY($1::text[])
      `,
      [ids]
    )
  );

  const products = await mapProductRows(result.rows);
  const orderMap = new Map(ids.map((id, index) => [id, index]));

  return products.sort((left, right) => {
    const leftIndex = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        INSERT INTO products (
          slug, category_id, name, excerpt, description, status, product_type, template_key, thumbnail_url, price, fulfillment_type, config
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `,
      [
        input.slug,
        input.categoryId || null,
        input.name,
        input.excerpt || null,
        input.description || null,
        input.status || "draft",
        input.productType,
        input.templateKey,
        input.thumbnailUrl || null,
        input.price ?? 0,
        input.fulfillmentType ?? "digital",
        input.config || {},
      ]
    )
  );

  const created = await getProductBySlug(input.slug);
  if (!created) {
    throw new Error("PRODUCT_CREATE_FAILED");
  }

  return created;
}

export async function updateProduct(slug: string, input: Partial<ProductInput>): Promise<Product | null> {
  const existing = await getProductBySlug(slug);
  if (!existing) {
    return null;
  }

  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        UPDATE products
        SET
          slug = COALESCE($1, slug),
          category_id = $2,
          name = COALESCE($3, name),
          excerpt = $4,
          description = $5,
          status = COALESCE($6, status),
          product_type = COALESCE($7, product_type),
          template_key = COALESCE($8, template_key),
          thumbnail_url = $9,
          price = COALESCE($10, price),
          fulfillment_type = COALESCE($11, fulfillment_type),
          config = $12,
          updated_at = NOW()
        WHERE slug = $13
        RETURNING id
      `,
      [
        input.slug,
        input.categoryId !== undefined ? input.categoryId : existing.categoryId ?? null,
        input.name,
        input.excerpt !== undefined ? input.excerpt : existing.excerpt ?? null,
        input.description !== undefined ? input.description : existing.description ?? null,
        input.status,
        input.productType,
        input.templateKey,
        input.thumbnailUrl !== undefined ? input.thumbnailUrl : existing.thumbnailUrl ?? null,
        input.price,
        input.fulfillmentType,
        input.config !== undefined ? input.config : existing.config,
        slug,
      ]
    )
  );

  if (!result.rows[0]) {
    return null;
  }

  return await getProductBySlug(input.slug ?? slug);
}

export async function deleteProduct(slug: string): Promise<boolean> {
  const result = await withProductCatalogRetry(() =>
    query(
      `
        DELETE FROM products
        WHERE slug = $1
        RETURNING id
      `,
      [slug]
    )
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

  const result = await withProductCatalogRetry(() =>
    query(
      `
        UPDATE products
        SET
          status = $2,
          updated_at = NOW()
        WHERE slug = ANY($1::text[])
      `,
      [slugs, status]
    )
  );

  return result.rowCount ?? 0;
}

export async function deleteProducts(slugs: string[]): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await withProductCatalogRetry(() =>
    query(
      `
        DELETE FROM products
        WHERE slug = ANY($1::text[])
      `,
      [slugs]
    )
  );

  return result.rowCount ?? 0;
}

export async function listAllProductCategories(): Promise<ProductCategory[]> {
  const result = await withProductCatalogRetry(() =>
    query<ProductCategoryRow>(
      `
        SELECT *
        FROM product_categories
        ORDER BY name ASC
      `
    )
  );

  return result.rows.map(mapProductCategoryRow);
}

export async function getProductCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  const result = await withProductCatalogRetry(() =>
    query<ProductCategoryRow>(
      `
        SELECT *
        FROM product_categories
        WHERE slug = $1
        LIMIT 1
      `,
      [slug]
    )
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapProductCategoryRow(result.rows[0]);
}

export async function createProductCategory(input: ProductCategoryInput): Promise<ProductCategory> {
  const result = await withProductCatalogRetry(() =>
    query<ProductCategoryRow>(
      `
        INSERT INTO product_categories (slug, name, description, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [input.slug, input.name, input.description || null, input.status || "draft"]
    )
  );

  return mapProductCategoryRow(result.rows[0]);
}

export async function updateProductCategory(
  slug: string,
  input: Partial<ProductCategoryInput>
): Promise<ProductCategory | null> {
  const existing = await getProductCategoryBySlug(slug);
  if (!existing) {
    return null;
  }

  const result = await withProductCatalogRetry(() =>
    query<ProductCategoryRow>(
      `
        UPDATE product_categories
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
    )
  );

  return result.rows[0] ? mapProductCategoryRow(result.rows[0]) : null;
}

export async function deleteProductCategory(slug: string): Promise<boolean> {
  const result = await withProductCatalogRetry(() =>
    query(
      `
        DELETE FROM product_categories
        WHERE slug = $1
        RETURNING id
      `,
      [slug]
    )
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateProductCategoriesStatus(
  slugs: string[],
  status: "draft" | "published"
): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await withProductCatalogRetry(() =>
    query(
      `
        UPDATE product_categories
        SET
          status = $2,
          updated_at = NOW()
        WHERE slug = ANY($1::text[])
      `,
      [slugs, status]
    )
  );

  return result.rowCount ?? 0;
}

export async function deleteProductCategories(slugs: string[]): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await withProductCatalogRetry(() =>
    query(
      `
        DELETE FROM product_categories
        WHERE slug = ANY($1::text[])
      `,
      [slugs]
    )
  );

  return result.rowCount ?? 0;
}
