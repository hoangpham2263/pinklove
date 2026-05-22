import "server-only";

import type {
  Offering,
  OfferingCategory,
  OfferingFulfillmentType,
  OfferingOwnerType,
  OfferingType,
  OfferingTypeDefinition,
  OfferingTypeField,
} from "@/features/offerings/types";
import { ensureOfferingCatalogReady, query, withTransaction } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media-resolver";

type OfferingInput = {
  slug: string;
  categoryId?: string;
  name: string;
  excerpt?: string;
  description?: string;
  status?: "draft" | "published";
  offeringType: OfferingType;
  templateKey: string;
  thumbnailUrl?: string;
  price?: number;
  fulfillmentType?: OfferingFulfillmentType;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  costPrice?: number;
  vendorSku?: string;
  config?: Record<string, unknown>;
};

type OfferingCategoryInput = {
  slug: string;
  name: string;
  description?: string;
  status?: "draft" | "published";
};

type OfferingTypeInput = {
  key: string;
  label: string;
  description?: string;
  status?: "draft" | "active" | "archived";
  fulfillmentType?: OfferingFulfillmentType;
  templateKey?: string;
  supportsInventory?: boolean;
  supportsVendorSupply?: boolean;
  fieldSchema?: OfferingTypeField[];
};

type OfferingTypeRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: "draft" | "active" | "archived";
  fulfillment_type: OfferingFulfillmentType;
  template_key: string;
  supports_inventory: boolean;
  supports_vendor_supply: boolean;
  is_system: boolean;
  field_schema: OfferingTypeField[] | null;
  created_at: string;
  updated_at: string;
};

type OfferingCatalogFilterInput = {
  offeringTypes: OfferingType[];
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc";
};

type OfferingCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

function mapOfferingTypeRow(row: OfferingTypeRow): OfferingTypeDefinition {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? undefined,
    status: row.status,
    fulfillmentType: row.fulfillment_type,
    templateKey: row.template_key,
    supportsInventory: row.supports_inventory,
    supportsVendorSupply: row.supports_vendor_supply,
    isSystem: row.is_system,
    fieldSchema: Array.isArray(row.field_schema) ? row.field_schema : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type OfferingRow = {
  id: string;
  slug: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  name: string;
  excerpt: string | null;
  description: string | null;
  status: "draft" | "published";
  offering_type: OfferingType;
  template_key: string;
  thumbnail_url: string | null;
  price: string;
  fulfillment_type: OfferingFulfillmentType;
  track_inventory: boolean;
  stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  coded_template_key: string | null;
  coded_site_defaults: Record<string, unknown> | null;
  builder_key: string | null;
  builder_site_defaults: Record<string, unknown> | null;
  general_fulfillment_type: OfferingFulfillmentType | null;
  general_track_inventory: boolean | null;
  general_stock_quantity: string | null;
  general_low_stock_threshold: string | null;
  general_allow_backorder: boolean | null;
  general_cost_price: string | null;
  general_vendor_sku: string | null;
  general_owner_type: OfferingOwnerType | null;
  general_owner_vendor_user_id: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type OfferingTemplateUsageRow = {
  slug: string;
  name: string;
};

function mapOfferingCategoryRow(row: OfferingCategoryRow): OfferingCategory {
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

function mapOfferingRow(row: OfferingRow): Offering {
  const baseConfig = row.config ?? {};
  const rawGeneralOfferingConfig =
    typeof baseConfig.generalOffering === "object" && baseConfig.generalOffering
      ? (baseConfig.generalOffering as Record<string, unknown>)
      : null;
  const ownerType =
    row.general_owner_type === "vendor" || rawGeneralOfferingConfig?.ownerType === "vendor"
      ? "vendor"
      : "internal";
  const ownerVendorUserId =
    ownerType === "vendor"
      ? row.general_owner_vendor_user_id ??
        (typeof rawGeneralOfferingConfig?.vendorUserId === "string" ? rawGeneralOfferingConfig.vendorUserId : undefined)
      : undefined;
  const templateKey =
    row.offering_type === "coded_template"
      ? row.coded_template_key ?? row.template_key
      : row.offering_type === "builder"
        ? row.builder_key ?? row.template_key
        : row.template_key;
  const siteDefaults =
    row.offering_type === "coded_template"
      ? row.coded_site_defaults
      : row.offering_type === "builder"
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
    ...(row.offering_type === "general_offering"
      ? {
          generalOffering: {
            ...(rawGeneralOfferingConfig ?? {}),
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
    offeringType: row.offering_type,
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
    ownerType: ownerType as OfferingOwnerType,
    ownerVendorUserId,
    config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const OFFERING_SELECT = `
  SELECT
    offerings.id,
    offerings.slug,
    offerings.category_id,
    categories.slug AS category_slug,
    categories.name AS category_name,
    offerings.name,
    offerings.excerpt,
    offerings.description,
    offerings.status,
    offerings.offering_type,
    offerings.template_key,
    offerings.thumbnail_url,
    offerings.price::text,
    offerings.fulfillment_type,
    offerings.track_inventory,
    offerings.stock_quantity::text,
    offerings.low_stock_threshold::text,
    offerings.allow_backorder,
    coded.template_key AS coded_template_key,
    coded.site_defaults AS coded_site_defaults,
    builder.template_key AS builder_key,
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
    offerings.config,
    offerings.created_at,
    offerings.updated_at
  FROM offerings
  LEFT JOIN offering_categories categories ON categories.id = offerings.category_id
  LEFT JOIN coded_template_offerings coded ON coded.offering_id = offerings.id
  LEFT JOIN builder_offerings builder ON builder.offering_id = offerings.id
  LEFT JOIN general_offerings general ON general.offering_id = offerings.id
`;

type PgLikeError = {
  code?: string;
  message?: string;
};

function isMissingOfferingCatalogRelation(error: unknown) {
  const pgError = error as PgLikeError;
  return pgError?.code === "42P01" || pgError?.code === "42703" || /offering_categories|category_id/i.test(pgError?.message ?? "");
}

async function withOfferingCatalogRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingOfferingCatalogRelation(error)) {
      throw error;
    }

    await ensureOfferingCatalogReady();
    return operation();
  }
}

async function mapOfferingRows(rows: OfferingRow[]): Promise<Offering[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...mapOfferingRow(row),
      thumbnailUrl: await resolveMediaUrl(row.thumbnail_url),
    }))
  );
}

async function getOfferingUsingTemplateKey(input: {
  templateKey: string;
  offeringType: OfferingType;
  excludeSlug?: string;
}) {
  if (!input.templateKey) {
    return null;
  }

  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTemplateUsageRow>(
      input.offeringType === "coded_template"
        ? `
            SELECT offerings.slug, offerings.name
            FROM offerings
            INNER JOIN coded_template_offerings coded ON coded.offering_id = offerings.id
            WHERE coded.template_key = $1
              AND offerings.offering_type = $2
              AND ($3::text IS NULL OR offerings.slug <> $3)
            LIMIT 1
          `
        : `
            SELECT offerings.slug, offerings.name
            FROM offerings
            INNER JOIN builder_offerings builder ON builder.offering_id = offerings.id
            WHERE builder.template_key = $1
              AND offerings.offering_type = $2
              AND ($3::text IS NULL OR offerings.slug <> $3)
            LIMIT 1
          `,
      [input.templateKey, input.offeringType, input.excludeSlug ?? null]
    )
  );

  return result.rows[0] ?? null;
}

export async function listPublishedOfferings(): Promise<Offering[]> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.status = 'published'
        ORDER BY offerings.offering_type ASC, offerings.created_at DESC
      `
    )
  );

  return mapOfferingRows(result.rows);
}

export async function listPublishedOfferingsFiltered(input: OfferingCatalogFilterInput): Promise<Offering[]> {
  if (input.offeringTypes.length === 0) {
    return [];
  }

  const categorySlug = input.categorySlug && input.categorySlug !== "all" ? input.categorySlug : null;
  const minPrice = Number.isFinite(input.minPrice) ? input.minPrice ?? 0 : 0;
  const maxPrice = Number.isFinite(input.maxPrice) ? input.maxPrice ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  const sort = input.sort ?? "newest";
  const orderBy =
    sort === "price-asc"
      ? "offerings.price ASC, offerings.created_at DESC"
      : sort === "price-desc"
        ? "offerings.price DESC, offerings.created_at DESC"
        : "offerings.created_at DESC";

  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.status = 'published'
          AND offerings.offering_type = ANY($1::text[])
          AND ($2::text IS NULL OR categories.slug = $2)
          AND offerings.price >= $3
          AND offerings.price < $4
        ORDER BY ${orderBy}
      `,
      [input.offeringTypes, categorySlug, minPrice, maxPrice]
    )
  );

  return mapOfferingRows(result.rows);
}

export async function listAllOfferings(): Promise<Offering[]> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        ORDER BY offerings.offering_type ASC, offerings.created_at DESC
      `
    )
  );

  return mapOfferingRows(result.rows);
}

export async function listOfferingTypes(options: { includeArchived?: boolean } = {}): Promise<OfferingTypeDefinition[]> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTypeRow>(
      `
        SELECT
          id,
          key,
          label,
          description,
          status,
          fulfillment_type,
          template_key,
          supports_inventory,
          supports_vendor_supply,
          is_system,
          field_schema,
          created_at,
          updated_at
        FROM offering_types
        WHERE ($1::boolean = TRUE OR status <> 'archived')
        ORDER BY is_system DESC, label ASC, key ASC
      `,
      [Boolean(options.includeArchived)]
    )
  );

  return result.rows.map(mapOfferingTypeRow);
}

export async function getOfferingTypeByKey(key: string): Promise<OfferingTypeDefinition | null> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTypeRow>(
      `
        SELECT
          id,
          key,
          label,
          description,
          status,
          fulfillment_type,
          template_key,
          supports_inventory,
          supports_vendor_supply,
          is_system,
          field_schema,
          created_at,
          updated_at
        FROM offering_types
        WHERE key = $1
        LIMIT 1
      `,
      [key]
    )
  );

  return result.rows[0] ? mapOfferingTypeRow(result.rows[0]) : null;
}

export async function saveOfferingType(input: OfferingTypeInput): Promise<OfferingTypeDefinition> {
  const key = input.key.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    throw new Error("INVALID_OFFERING_TYPE_KEY");
  }

  const label = input.label.trim();
  if (!label) {
    throw new Error("MISSING_OFFERING_TYPE_LABEL");
  }

  const fieldSchema = Array.isArray(input.fieldSchema) ? input.fieldSchema : [];
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTypeRow>(
      `
        INSERT INTO offering_types (
          key,
          label,
          description,
          status,
          fulfillment_type,
          template_key,
          supports_inventory,
          supports_vendor_supply,
          is_system,
          field_schema
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9::jsonb)
        ON CONFLICT (key) DO UPDATE
        SET
          label = EXCLUDED.label,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          fulfillment_type = EXCLUDED.fulfillment_type,
          template_key = EXCLUDED.template_key,
          supports_inventory = EXCLUDED.supports_inventory,
          supports_vendor_supply = EXCLUDED.supports_vendor_supply,
          field_schema = EXCLUDED.field_schema,
          updated_at = NOW()
        RETURNING
          id,
          key,
          label,
          description,
          status,
          fulfillment_type,
          template_key,
          supports_inventory,
          supports_vendor_supply,
          is_system,
          field_schema,
          created_at,
          updated_at
      `,
      [
        key,
        label,
        input.description?.trim() || null,
        input.status ?? "active",
        input.fulfillmentType ?? "digital",
        input.templateKey?.trim() || key,
        Boolean(input.supportsInventory),
        Boolean(input.supportsVendorSupply),
        JSON.stringify(fieldSchema),
      ]
    )
  );

  return mapOfferingTypeRow(result.rows[0]);
}

export async function getOfferingBySlug(slug: string): Promise<Offering | null> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.slug = $1
        LIMIT 1
      `,
      [slug]
    )
  );

  if (!result) {
    return null;
  }

  return (await mapOfferingRows(result.rows))[0] ?? null;
}

export async function getOfferingById(id: string): Promise<Offering | null> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.id::text = $1::text
        LIMIT 1
      `,
      [id]
    )
  );

  if (!result) {
    return null;
  }

  return (await mapOfferingRows(result.rows))[0] ?? null;
}

export async function getPublishedOfferingBySlugAndType(
  slug: string,
  offeringType: OfferingType
): Promise<Offering | null> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.slug = $1
          AND offerings.status = 'published'
          AND offerings.offering_type = $2
        LIMIT 1
      `,
      [slug, offeringType]
    )
  );

  if (!result) {
    return null;
  }

  return (await mapOfferingRows(result.rows))[0] ?? null;
}

export async function listPublishedOfferingsByIds(ids: string[]): Promise<Offering[]> {
  if (ids.length === 0) {
    return [];
  }

  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.status = 'published'
          AND offerings.id::text = ANY($1::text[])
      `,
      [ids]
    )
  );

  const offerings = await mapOfferingRows(result.rows);
  const orderMap = new Map(ids.map((id, index) => [id, index]));

  return offerings.sort((left, right) => {
    const leftIndex = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

export async function createOffering(input: OfferingInput): Promise<Offering> {
  if (input.offeringType === "coded_template") {
    const existingTemplateOffering = await getOfferingUsingTemplateKey({
      templateKey: input.templateKey,
      offeringType: input.offeringType,
    });

    if (existingTemplateOffering) {
      throw new Error("OFFERING_TEMPLATE_KEY_IN_USE");
    }
  }

  await withOfferingCatalogRetry(() =>
    withTransaction(async (execute) => {
      const created = await execute<{ id: string }>(
        `
          INSERT INTO offerings (
            slug, category_id, name, excerpt, description, status, offering_type, template_key, thumbnail_url, price, fulfillment_type, track_inventory, stock_quantity, low_stock_threshold, allow_backorder, config
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
          input.offeringType,
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

      const offeringId = created.rows[0]?.id;
      if (!offeringId) {
        throw new Error("OFFERING_CREATE_FAILED");
      }

      await execute("DELETE FROM coded_template_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM builder_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM general_offerings WHERE offering_id = $1", [offeringId]);

      if (input.offeringType === "coded_template") {
        const siteDefaults =
          typeof input.config?.siteDefaults === "object" && input.config.siteDefaults
            ? input.config.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO coded_template_offerings (offering_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [offeringId, input.templateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (input.offeringType === "builder") {
        const siteDefaults =
          typeof input.config?.siteDefaults === "object" && input.config.siteDefaults
            ? input.config.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO builder_offerings (offering_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [offeringId, input.templateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (input.offeringType === "general_offering") {
        const generalConfig =
          typeof input.config?.generalOffering === "object" && input.config.generalOffering
            ? (input.config.generalOffering as Record<string, unknown>)
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
            INSERT INTO general_offerings (
              offering_id,
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
            offeringId,
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

  const created = await getOfferingBySlug(input.slug);
  if (!created) {
    throw new Error("OFFERING_CREATE_FAILED");
  }

  return created;
}

export async function updateOffering(slug: string, input: Partial<OfferingInput>): Promise<Offering | null> {
  const existing = await getOfferingBySlug(slug);
  if (!existing) {
    return null;
  }

  const nextTemplateKey = input.templateKey ?? existing.templateKey;
  const nextOfferingType = input.offeringType ?? existing.offeringType;
  if (nextOfferingType !== existing.offeringType) {
    throw new Error("OFFERING_TYPE_LOCKED");
  }

  if (nextOfferingType === "coded_template") {
    const existingTemplateOffering = await getOfferingUsingTemplateKey({
      templateKey: nextTemplateKey,
      offeringType: nextOfferingType,
      excludeSlug: slug,
    });

    if (existingTemplateOffering) {
      throw new Error("OFFERING_TEMPLATE_KEY_IN_USE");
    }
  }

  const nextConfig = input.config !== undefined ? input.config : existing.config;

  const result = await withOfferingCatalogRetry(() =>
    withTransaction(async (execute) => {
      const updated = await execute<{ id: string }>(
        `
          UPDATE offerings
          SET
            slug = COALESCE($1, slug),
            category_id = $2,
            name = COALESCE($3, name),
            excerpt = $4,
            description = $5,
            status = COALESCE($6, status),
            offering_type = COALESCE($7, offering_type),
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
          input.offeringType,
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

      const offeringId = updated.rows[0]?.id;
      if (!offeringId) {
        return null;
      }

      await execute("DELETE FROM coded_template_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM builder_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM general_offerings WHERE offering_id = $1", [offeringId]);

      if (nextOfferingType === "coded_template") {
        const siteDefaults =
          typeof nextConfig?.siteDefaults === "object" && nextConfig.siteDefaults
            ? nextConfig.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO coded_template_offerings (offering_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [offeringId, nextTemplateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (nextOfferingType === "builder") {
        const siteDefaults =
          typeof nextConfig?.siteDefaults === "object" && nextConfig.siteDefaults
            ? nextConfig.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO builder_offerings (offering_id, template_key, site_defaults)
            VALUES ($1, $2, $3::jsonb)
          `,
          [offeringId, nextTemplateKey, JSON.stringify(siteDefaults)]
        );
      }

      if (nextOfferingType === "general_offering") {
        const generalConfig =
          typeof nextConfig?.generalOffering === "object" && nextConfig.generalOffering
            ? (nextConfig.generalOffering as Record<string, unknown>)
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
            INSERT INTO general_offerings (
              offering_id,
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
            offeringId,
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

  return await getOfferingBySlug(input.slug ?? slug);
}

export async function deleteOffering(slug: string): Promise<boolean> {
  return withOfferingCatalogRetry(async () => {
    const existing = await query<{ id: string; offering_type: OfferingType }>(
      `
        SELECT id, offering_type
        FROM offerings
        WHERE slug = $1
        LIMIT 1
      `,
      [slug]
    );

    const offering = existing.rows[0];
    if (!offering) {
      return false;
    }

    if (offering.offering_type === "coded_template") {
      throw new Error("CODED_TEMPLATE_DELETE_BLOCKED");
    }

    const result = await query(
      `
        DELETE FROM offerings
        WHERE id = $1
      `,
      [offering.id]
    );

    return (result.rowCount ?? 0) > 0;
  });
}

export async function hasCodedTemplateOfferings(slugs: string[]): Promise<boolean> {
  if (slugs.length === 0) {
    return false;
  }

  const result = await withOfferingCatalogRetry(() =>
    query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM offerings
          WHERE slug = ANY($1::text[])
            AND offering_type = 'coded_template'
        ) AS exists
      `,
      [slugs]
    )
  );

  return result.rows[0]?.exists ?? false;
}

export async function updateOfferingsStatus(
  slugs: string[],
  status: "draft" | "published"
): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await withOfferingCatalogRetry(() =>
    query(
      `
        UPDATE offerings
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

export async function deleteOfferings(slugs: string[]): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  return withOfferingCatalogRetry(async () => {
    if (await hasCodedTemplateOfferings(slugs)) {
      throw new Error("CODED_TEMPLATE_DELETE_BLOCKED");
    }

    const result = await query(
      `
        DELETE FROM offerings
        WHERE slug = ANY($1::text[])
      `,
      [slugs]
    );

    return result.rowCount ?? 0;
  });
}

export async function listAllOfferingCategories(): Promise<OfferingCategory[]> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingCategoryRow>(
      `
        SELECT *
        FROM offering_categories
        ORDER BY name ASC
      `
    )
  );

  return result.rows.map(mapOfferingCategoryRow);
}

export async function getOfferingCategoryBySlug(slug: string): Promise<OfferingCategory | null> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingCategoryRow>(
      `
        SELECT *
        FROM offering_categories
        WHERE slug = $1
        LIMIT 1
      `,
      [slug]
    )
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapOfferingCategoryRow(result.rows[0]);
}

export async function createOfferingCategory(input: OfferingCategoryInput): Promise<OfferingCategory> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingCategoryRow>(
      `
        INSERT INTO offering_categories (slug, name, description, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [input.slug, input.name, input.description || null, input.status || "draft"]
    )
  );

  return mapOfferingCategoryRow(result.rows[0]);
}

export async function updateOfferingCategory(
  slug: string,
  input: Partial<OfferingCategoryInput>
): Promise<OfferingCategory | null> {
  const existing = await getOfferingCategoryBySlug(slug);
  if (!existing) {
    return null;
  }

  const result = await withOfferingCatalogRetry(() =>
    query<OfferingCategoryRow>(
      `
        UPDATE offering_categories
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

  return result.rows[0] ? mapOfferingCategoryRow(result.rows[0]) : null;
}

export async function deleteOfferingCategory(slug: string): Promise<boolean> {
  return withOfferingCatalogRetry(() =>
    withTransaction(async (execute) => {
      const category = await execute<{ id: string }>(
        `
          SELECT id
          FROM offering_categories
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
          UPDATE offerings
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = $1
        `,
        [categoryId]
      );

      await execute(
        `
          UPDATE vendor_offering_submissions
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = $1
        `,
        [categoryId]
      );

      const result = await execute(
        `
          DELETE FROM offering_categories
          WHERE id = $1
        `,
        [categoryId]
      );

      return (result.rowCount ?? 0) > 0;
    })
  );
}

export async function updateOfferingCategoriesStatus(
  slugs: string[],
  status: "draft" | "published"
): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  const result = await withOfferingCatalogRetry(() =>
    query(
      `
        UPDATE offering_categories
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

export async function deleteOfferingCategories(slugs: string[]): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  return withOfferingCatalogRetry(() =>
    withTransaction(async (execute) => {
      const categories = await execute<{ id: string }>(
        `
          SELECT id
          FROM offering_categories
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
          UPDATE offerings
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = ANY($1::text[])
        `,
        [categoryIds]
      );

      await execute(
        `
          UPDATE vendor_offering_submissions
          SET
            category_id = NULL,
            updated_at = NOW()
          WHERE category_id = ANY($1::text[])
        `,
        [categoryIds]
      );

      const result = await execute(
        `
          DELETE FROM offering_categories
          WHERE id = ANY($1::text[])
        `,
        [categoryIds]
      );

      return result.rowCount ?? 0;
    })
  );
}
