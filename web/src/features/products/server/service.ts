import "server-only";

import type { Product, ProductCategory, ProductFulfillmentType, ProductOwnerType, ProductType } from "@/features/products/types";
import { ensureProductCatalogReady, query, withTransaction } from "@/lib/database";
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
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  costPrice?: number;
  vendorSku?: string;
  config?: Record<string, unknown>;
};

type ProductCategoryInput = {
  slug: string;
  name: string;
  description?: string;
  status?: "draft" | "published";
};

type ProductCatalogFilterInput = {
  productTypes: ProductType[];
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
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
  track_inventory: boolean;
  stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  coded_template_key: string | null;
  coded_site_defaults: Record<string, unknown> | null;
  builder_template_key: string | null;
  builder_site_defaults: Record<string, unknown> | null;
  general_fulfillment_type: ProductFulfillmentType | null;
  general_track_inventory: boolean | null;
  general_stock_quantity: string | null;
  general_low_stock_threshold: string | null;
  general_allow_backorder: boolean | null;
  general_cost_price: string | null;
  general_vendor_sku: string | null;
  general_owner_type: ProductOwnerType | null;
  general_owner_vendor_user_id: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type ProductTemplateUsageRow = {
  slug: string;
  name: string;
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
  const baseConfig = row.config ?? {};
  const rawGeneralProductConfig =
    typeof baseConfig.generalProduct === "object" && baseConfig.generalProduct
      ? (baseConfig.generalProduct as Record<string, unknown>)
      : null;
  const ownerType =
    row.general_owner_type === "vendor" || rawGeneralProductConfig?.ownerType === "vendor"
      ? "vendor"
      : "internal";
  const ownerVendorUserId =
    ownerType === "vendor"
      ? row.general_owner_vendor_user_id ??
        (typeof rawGeneralProductConfig?.vendorUserId === "string" ? rawGeneralProductConfig.vendorUserId : undefined)
      : undefined;
  const templateKey =
    row.product_type === "coded_template"
      ? row.coded_template_key ?? row.template_key
      : row.product_type === "builder_template"
        ? row.builder_template_key ?? row.template_key
        : row.template_key;
  const siteDefaults =
    row.product_type === "coded_template"
      ? row.coded_site_defaults
      : row.product_type === "builder_template"
        ? row.builder_site_defaults
        : null;
  const fulfillmentType = row.general_fulfillment_type ?? row.fulfillment_type;
  const trackInventory = row.general_track_inventory ?? row.track_inventory;
  const stockQuantity = row.general_stock_quantity ?? row.stock_quantity;
  const lowStockThreshold = row.general_low_stock_threshold ?? row.low_stock_threshold;
  const allowBackorder = row.general_allow_backorder ?? row.allow_backorder;
  const costPrice = row.general_cost_price ?? "0";
  const vendorSku = row.general_vendor_sku ?? "";
  const config: Record<string, unknown> = {
    ...baseConfig,
    ...(siteDefaults ? { siteDefaults } : {}),
    ...(row.product_type === "general_product"
      ? {
          generalProduct: {
            ...(rawGeneralProductConfig ?? {}),
            ownerType,
            ...(ownerVendorUserId ? { vendorUserId: ownerVendorUserId } : {}),
          },
        }
      : {}),
  };

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
    templateKey,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    price: Number(row.price ?? "0"),
    fulfillmentType,
    trackInventory: Boolean(trackInventory),
    stockQuantity: Number(stockQuantity ?? "0"),
    lowStockThreshold: Number(lowStockThreshold ?? "0"),
    allowBackorder: Boolean(allowBackorder),
    costPrice: Number(costPrice ?? "0"),
    vendorSku,
    ownerType: ownerType as ProductOwnerType,
    ownerVendorUserId,
    config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT = `
  SELECT
    products.id,
    products.slug,
    products.category_id,
    categories.slug AS category_slug,
    categories.name AS category_name,
    products.name,
    products.excerpt,
    products.description,
    products.status,
    products.product_type,
    products.template_key,
    products.thumbnail_url,
    products.price::text,
    products.fulfillment_type,
    products.track_inventory,
    products.stock_quantity::text,
    products.low_stock_threshold::text,
    products.allow_backorder,
    coded.template_key AS coded_template_key,
    coded.site_defaults AS coded_site_defaults,
    builder.template_key AS builder_template_key,
    builder.site_defaults AS builder_site_defaults,
    general.fulfillment_type AS general_fulfillment_type,
    general.track_inventory AS general_track_inventory,
    general.stock_quantity::text AS general_stock_quantity,
    general.low_stock_threshold::text AS general_low_stock_threshold,
    general.allow_backorder AS general_allow_backorder,
    general.cost_price::text AS general_cost_price,
    general.vendor_sku AS general_vendor_sku,
    general.owner_type AS general_owner_type,
    general.owner_vendor_user_id AS general_owner_vendor_user_id,
    products.config,
    products.created_at,
    products.updated_at
  FROM products
  LEFT JOIN product_categories categories ON categories.id = products.category_id
  LEFT JOIN coded_template_products coded ON coded.product_id = products.id
  LEFT JOIN builder_products builder ON builder.product_id = products.id
  LEFT JOIN general_products general ON general.product_id = products.id
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

async function getProductUsingTemplateKey(input: {
  templateKey: string;
  productType: ProductType;
  excludeSlug?: string;
}) {
  if (!input.templateKey) {
    return null;
  }

  const result = await withProductCatalogRetry(() =>
    query<ProductTemplateUsageRow>(
      input.productType === "coded_template"
        ? `
            SELECT products.slug, products.name
            FROM products
            INNER JOIN coded_template_products coded ON coded.product_id = products.id
            WHERE coded.template_key = $1
              AND products.product_type = $2
              AND ($3::text IS NULL OR products.slug <> $3)
            LIMIT 1
          `
        : `
            SELECT products.slug, products.name
            FROM products
            INNER JOIN builder_products builder ON builder.product_id = products.id
            WHERE builder.template_key = $1
              AND products.product_type = $2
              AND ($3::text IS NULL OR products.slug <> $3)
            LIMIT 1
          `,
      [input.templateKey, input.productType, input.excludeSlug ?? null]
    )
  );

  return result.rows[0] ?? null;
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

export async function listPublishedProductsFiltered(input: ProductCatalogFilterInput): Promise<Product[]> {
  if (input.productTypes.length === 0) {
    return [];
  }

  const categorySlug = input.categorySlug && input.categorySlug !== "all" ? input.categorySlug : null;
  const minPrice = Number.isFinite(input.minPrice) ? input.minPrice ?? 0 : 0;
  const maxPrice = Number.isFinite(input.maxPrice) ? input.maxPrice ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  const sort = input.sort ?? "newest";
  const orderBy =
    sort === "price-asc"
      ? "products.price ASC, products.created_at DESC"
      : sort === "price-desc"
        ? "products.price DESC, products.created_at DESC"
        : "products.created_at DESC";

  const result = await withProductCatalogRetry(() =>
    query<ProductRow>(
      `
        ${PRODUCT_SELECT}
        WHERE products.status = 'published'
          AND products.product_type = ANY($1::text[])
          AND ($2::text IS NULL OR categories.slug = $2)
          AND products.price >= $3
          AND products.price < $4
        ORDER BY ${orderBy}
      `,
      [input.productTypes, categorySlug, minPrice, maxPrice]
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

  if (!result) {
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

  if (!result) {
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

  if (!result) {
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
  if (input.productType === "coded_template") {
    const existingTemplateProduct = await getProductUsingTemplateKey({
      templateKey: input.templateKey,
      productType: input.productType,
    });

    if (existingTemplateProduct) {
      throw new Error("PRODUCT_TEMPLATE_KEY_IN_USE");
    }
  }

  await withProductCatalogRetry(() =>
    withTransaction(async (execute) => {
      const created = await execute<{ id: string }>(
        `
          INSERT INTO products (
            slug, category_id, name, excerpt, description, status, product_type, template_key, thumbnail_url, price, fulfillment_type, track_inventory, stock_quantity, low_stock_threshold, allow_backorder, config
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
          input.trackInventory ?? false,
          input.stockQuantity ?? 0,
          input.lowStockThreshold ?? 0,
          input.allowBackorder ?? false,
          input.config || {},
        ]
      );

      const productId = created.rows[0]?.id;
      if (!productId) {
        throw new Error("PRODUCT_CREATE_FAILED");
      }

      await execute("DELETE FROM coded_template_products WHERE product_id = $1", [productId]);
      await execute("DELETE FROM builder_products WHERE product_id = $1", [productId]);
      await execute("DELETE FROM general_products WHERE product_id = $1", [productId]);

      if (input.productType === "coded_template") {
        const siteDefaults =
          typeof input.config?.siteDefaults === "object" && input.config.siteDefaults
            ? input.config.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO coded_template_products (product_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [productId, input.templateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (input.productType === "builder_template") {
        const siteDefaults =
          typeof input.config?.siteDefaults === "object" && input.config.siteDefaults
            ? input.config.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO builder_products (product_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [productId, input.templateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (input.productType === "general_product") {
        const generalConfig =
          typeof input.config?.generalProduct === "object" && input.config.generalProduct
            ? (input.config.generalProduct as Record<string, unknown>)
            : null;
        const ownerType = generalConfig?.ownerType === "vendor" ? "vendor" : "internal";
        const ownerVendorUserId =
          ownerType === "vendor" && typeof generalConfig?.vendorUserId === "string"
            ? generalConfig.vendorUserId
            : null;
        const costPrice =
          typeof generalConfig?.costPrice === "number"
            ? generalConfig.costPrice
            : input.costPrice ?? 0;
        const vendorSku =
          typeof generalConfig?.vendorSku === "string"
            ? generalConfig.vendorSku
            : input.vendorSku ?? "";

        await execute(
          `
            INSERT INTO general_products (
              product_id,
              fulfillment_type,
              track_inventory,
              stock_quantity,
              low_stock_threshold,
              allow_backorder,
              cost_price,
              vendor_sku,
              owner_type,
              owner_vendor_user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            productId,
            input.fulfillmentType ?? "digital",
            input.trackInventory ?? false,
            input.stockQuantity ?? 0,
            input.lowStockThreshold ?? 0,
            input.allowBackorder ?? false,
            costPrice,
            vendorSku,
            ownerType,
            ownerVendorUserId,
          ]
        );
      }
    })
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

  const nextTemplateKey = input.templateKey ?? existing.templateKey;
  const nextProductType = input.productType ?? existing.productType;
  if (nextProductType !== existing.productType) {
    throw new Error("PRODUCT_TYPE_LOCKED");
  }

  if (nextProductType === "coded_template") {
    const existingTemplateProduct = await getProductUsingTemplateKey({
      templateKey: nextTemplateKey,
      productType: nextProductType,
      excludeSlug: slug,
    });

    if (existingTemplateProduct) {
      throw new Error("PRODUCT_TEMPLATE_KEY_IN_USE");
    }
  }

  const nextConfig = input.config !== undefined ? input.config : existing.config;

  const result = await withProductCatalogRetry(() =>
    withTransaction(async (execute) => {
      const updated = await execute<{ id: string }>(
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
            track_inventory = COALESCE($12, track_inventory),
            stock_quantity = COALESCE($13, stock_quantity),
            low_stock_threshold = COALESCE($14, low_stock_threshold),
            allow_backorder = COALESCE($15, allow_backorder),
            config = $16,
            updated_at = NOW()
          WHERE slug = $17
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
          input.trackInventory,
          input.stockQuantity,
          input.lowStockThreshold,
          input.allowBackorder,
          nextConfig,
          slug,
        ]
      );

      const productId = updated.rows[0]?.id;
      if (!productId) {
        return null;
      }

      await execute("DELETE FROM coded_template_products WHERE product_id = $1", [productId]);
      await execute("DELETE FROM builder_products WHERE product_id = $1", [productId]);
      await execute("DELETE FROM general_products WHERE product_id = $1", [productId]);

      if (nextProductType === "coded_template") {
        const siteDefaults =
          typeof nextConfig?.siteDefaults === "object" && nextConfig.siteDefaults
            ? nextConfig.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO coded_template_products (product_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [productId, nextTemplateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (nextProductType === "builder_template") {
        const siteDefaults =
          typeof nextConfig?.siteDefaults === "object" && nextConfig.siteDefaults
            ? nextConfig.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO builder_products (product_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [productId, nextTemplateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (nextProductType === "general_product") {
        const generalConfig =
          typeof nextConfig?.generalProduct === "object" && nextConfig.generalProduct
            ? (nextConfig.generalProduct as Record<string, unknown>)
            : null;
        const ownerType = generalConfig?.ownerType === "vendor" ? "vendor" : "internal";
        const ownerVendorUserId =
          ownerType === "vendor" && typeof generalConfig?.vendorUserId === "string"
            ? generalConfig.vendorUserId
            : null;
        const costPrice =
          typeof generalConfig?.costPrice === "number"
            ? generalConfig.costPrice
            : input.costPrice ?? existing.costPrice;
        const vendorSku =
          typeof generalConfig?.vendorSku === "string"
            ? generalConfig.vendorSku
            : input.vendorSku ?? existing.vendorSku;

        await execute(
          `
            INSERT INTO general_products (
              product_id,
              fulfillment_type,
              track_inventory,
              stock_quantity,
              low_stock_threshold,
              allow_backorder,
              cost_price,
              vendor_sku,
              owner_type,
              owner_vendor_user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `,
          [
            productId,
            input.fulfillmentType ?? existing.fulfillmentType,
            input.trackInventory ?? existing.trackInventory,
            input.stockQuantity ?? existing.stockQuantity,
            input.lowStockThreshold ?? existing.lowStockThreshold,
            input.allowBackorder ?? existing.allowBackorder,
            costPrice,
            vendorSku,
            ownerType,
            ownerVendorUserId,
          ]
        );
      }

      return updated.rows[0];
    })
  );

  if (!result) {
    return null;
  }

  return await getProductBySlug(input.slug ?? slug);
}

export async function deleteProduct(slug: string): Promise<boolean> {
  return withProductCatalogRetry(async () => {
    const existing = await query<{ id: string; product_type: ProductType }>(
      `
        SELECT id, product_type
        FROM products
        WHERE slug = $1
        LIMIT 1
      `,
      [slug]
    );

    const product = existing.rows[0];
    if (!product) {
      return false;
    }

    if (product.product_type === "coded_template") {
      throw new Error("CODED_TEMPLATE_DELETE_BLOCKED");
    }

    const result = await query(
      `
        DELETE FROM products
        WHERE id = $1
      `,
      [product.id]
    );

    return (result.rowCount ?? 0) > 0;
  });
}

export async function hasCodedTemplateProducts(slugs: string[]): Promise<boolean> {
  if (slugs.length === 0) {
    return false;
  }

  const result = await withProductCatalogRetry(() =>
    query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM products
          WHERE slug = ANY($1::text[])
            AND product_type = 'coded_template'
        ) AS exists
      `,
      [slugs]
    )
  );

  return result.rows[0]?.exists ?? false;
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

  return withProductCatalogRetry(async () => {
    if (await hasCodedTemplateProducts(slugs)) {
      throw new Error("CODED_TEMPLATE_DELETE_BLOCKED");
    }

    const result = await query(
      `
        DELETE FROM products
        WHERE slug = ANY($1::text[])
      `,
      [slugs]
    );

    return result.rowCount ?? 0;
  });
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
  return withProductCatalogRetry(() =>
    withTransaction(async (execute) => {
      const category = await execute<{ id: string }>(
        `
          SELECT id
          FROM product_categories
          WHERE slug = $1
          LIMIT 1
        `,
        [slug]
      );

      const categoryId = category.rows[0]?.id;
      if (!categoryId) {
        return false;
      }

      await execute(
        `
          UPDATE products
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = $1
        `,
        [categoryId]
      );

      await execute(
        `
          UPDATE vendor_product_submissions
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = $1
        `,
        [categoryId]
      );

      const result = await execute(
        `
          DELETE FROM product_categories
          WHERE id = $1
        `,
        [categoryId]
      );

      return (result.rowCount ?? 0) > 0;
    })
  );
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

  return withProductCatalogRetry(() =>
    withTransaction(async (execute) => {
      const categories = await execute<{ id: string }>(
        `
          SELECT id
          FROM product_categories
          WHERE slug = ANY($1::text[])
        `,
        [slugs]
      );

      const categoryIds = categories.rows.map((category) => category.id);
      if (categoryIds.length === 0) {
        return 0;
      }

      await execute(
        `
          UPDATE products
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = ANY($1::text[])
        `,
        [categoryIds]
      );

      await execute(
        `
          UPDATE vendor_product_submissions
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = ANY($1::text[])
        `,
        [categoryIds]
      );

      const result = await execute(
        `
          DELETE FROM product_categories
          WHERE id = ANY($1::text[])
        `,
        [categoryIds]
      );

      return result.rowCount ?? 0;
    })
  );
}
