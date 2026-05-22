import "server-only";

import type {
  Offering,
  OfferingCategory,
  OfferingFulfillmentType,
  OfferingOwnerType,
  OfferingTemplateEngine,
  OfferingTemplateMode,
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
  templateEngine?: OfferingTemplateEngine;
  templateMode?: OfferingTemplateMode;
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
  templateEngine?: OfferingTemplateEngine;
  templateMode?: OfferingTemplateMode;
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
  template_engine: string | null;
  template_mode: string | null;
  supports_inventory: boolean;
  supports_vendor_supply: boolean;
  is_system: boolean;
  field_schema: OfferingTypeField[] | null;
  created_at: string;
  updated_at: string;
};

type OfferingCatalogFilterInput = {
  offeringTypes: OfferingType[];
  templateEngines?: OfferingTemplateEngine[];
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
    templateEngine: row.template_engine ? (row.template_engine as OfferingTemplateEngine) : undefined,
    templateMode: row.template_mode ? (row.template_mode as OfferingTemplateMode) : undefined,
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
  template_engine: string | null;
  template_mode: string | null;
  thumbnail_url: string | null;
  price: string;
  fulfillment_type: OfferingFulfillmentType;
  track_inventory: boolean;
  stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  digital_template_key: string | null;
  digital_template_engine: OfferingTemplateEngine | null;
  digital_template_mode: OfferingTemplateMode | null;
  digital_site_defaults: Record<string, unknown> | null;
  physical_fulfillment_type: OfferingFulfillmentType | null;
  physical_track_inventory: boolean | null;
  physical_stock_quantity: string | null;
  physical_low_stock_threshold: string | null;
  physical_allow_backorder: boolean | null;
  physical_cost_price: string | null;
  physical_vendor_sku: string | null;
  physical_owner_type: OfferingOwnerType | null;
  physical_owner_vendor_user_id: string | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type OfferingTemplateUsageRow = {
  slug: string;
  name: string;
};

function normalizeOfferingTypeFilter(offeringTypes: OfferingType[]) {
  const mappedTypes = new Set<OfferingType>();
  const templateEngines = new Set<OfferingTemplateEngine>();
  let restrictTemplateEngine = false;

  for (const type of offeringTypes) {
    mappedTypes.add(type);
    if (type === "digital_template") {
      restrictTemplateEngine = false;
    }
  }

  return {
    offeringTypes: Array.from(mappedTypes),
    templateEngines: restrictTemplateEngine ? Array.from(templateEngines) : null,
  };
}

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
    row.physical_owner_type === "vendor" || rawGeneralOfferingConfig?.ownerType === "vendor"
      ? "vendor"
      : "internal";
  const ownerVendorUserId =
    ownerType === "vendor"
      ? row.physical_owner_vendor_user_id ??
        (typeof rawGeneralOfferingConfig?.vendorUserId === "string" ? rawGeneralOfferingConfig.vendorUserId : undefined)
      : undefined;
  const templateKey = row.digital_template_key ?? row.template_key;
  const templateEngine = (row.digital_template_engine ?? row.template_engine ?? undefined) as OfferingTemplateEngine | undefined;
  const templateMode = (row.digital_template_mode ?? row.template_mode ?? undefined) as OfferingTemplateMode | undefined;
  const siteDefaults = row.digital_site_defaults;
  const fulfillmentType = row.physical_fulfillment_type ?? row.fulfillment_type;
  const trackInventory = row.physical_track_inventory ?? row.track_inventory;
  const stockQuantity = row.physical_stock_quantity ?? row.stock_quantity;
  const lowStockThreshold = row.physical_low_stock_threshold ?? row.low_stock_threshold;
  const allowBackorder = row.physical_allow_backorder ?? row.allow_backorder;
  const costPrice = row.physical_cost_price ?? "0";
  const vendorSku = row.physical_vendor_sku ?? "";
  const config: Record<string, unknown> = {
    ...baseConfig,
    ...(siteDefaults ? { siteDefaults } : {}),
    ...(row.offering_type === "physical_product"
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
    templateEngine,
    templateMode,
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
    offerings.template_engine,
    offerings.template_mode,
    offerings.thumbnail_url,
    offerings.price::text,
    offerings.fulfillment_type,
    offerings.track_inventory,
    offerings.stock_quantity::text,
    offerings.low_stock_threshold::text,
    offerings.allow_backorder,
    digital.template_key AS digital_template_key,
    digital.template_engine AS digital_template_engine,
    digital.template_mode AS digital_template_mode,
    digital.site_defaults AS digital_site_defaults,
    physical.fulfillment_type AS physical_fulfillment_type,
    physical.track_inventory AS physical_track_inventory,
    physical.stock_quantity::text AS physical_stock_quantity,
    physical.low_stock_threshold::text AS physical_low_stock_threshold,
    physical.allow_backorder AS physical_allow_backorder,
    physical.cost_price::text AS physical_cost_price,
    physical.vendor_sku AS physical_vendor_sku,
    physical.owner_type AS physical_owner_type,
    physical.owner_vendor_user_id AS physical_owner_vendor_user_id,
    offerings.config,
    offerings.created_at,
    offerings.updated_at
  FROM offerings
  LEFT JOIN offering_categories categories ON categories.id = offerings.category_id
  LEFT JOIN digital_template_offerings digital ON digital.offering_id = offerings.id
  LEFT JOIN physical_offerings physical ON physical.offering_id = offerings.id
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
  templateEngine?: OfferingTemplateEngine;
  excludeSlug?: string;
}) {
  if (!input.templateKey) {
    return null;
  }

  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTemplateUsageRow>(
      `
        SELECT offerings.slug, offerings.name
        FROM offerings
        INNER JOIN digital_template_offerings digital ON digital.offering_id = offerings.id
        WHERE digital.template_key = $1
          AND offerings.offering_type = 'digital_template'
          AND ($2::text IS NULL OR digital.template_engine = $2)
          AND ($3::text IS NULL OR offerings.slug <> $3)
        LIMIT 1
      `,
      [input.templateKey, input.templateEngine ?? null, input.excludeSlug ?? null]
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

  const normalizedFilter = normalizeOfferingTypeFilter(input.offeringTypes);
  const templateEngines = input.templateEngines?.length ? input.templateEngines : normalizedFilter.templateEngines;
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
          AND ($5::text[] IS NULL OR COALESCE(digital.template_engine, offerings.template_engine) = ANY($5::text[]))
        ORDER BY ${orderBy}
      `,
      [normalizedFilter.offeringTypes, categorySlug, minPrice, maxPrice, templateEngines]
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
          template_engine,
          template_mode,
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
          template_engine,
          template_mode,
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
          template_engine,
          template_mode,
          supports_inventory,
          supports_vendor_supply,
          is_system,
          field_schema
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11::jsonb)
        ON CONFLICT (key) DO UPDATE
        SET
          label = EXCLUDED.label,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          fulfillment_type = EXCLUDED.fulfillment_type,
          template_key = EXCLUDED.template_key,
          template_engine = EXCLUDED.template_engine,
          template_mode = EXCLUDED.template_mode,
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
          template_engine,
          template_mode,
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
        input.templateEngine?.trim() || "",
        input.templateMode?.trim() || "",
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
  const normalizedFilter = normalizeOfferingTypeFilter([offeringType]);
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.slug = $1
          AND offerings.status = 'published'
          AND offerings.offering_type = ANY($2::text[])
          AND ($3::text[] IS NULL OR COALESCE(digital.template_engine, offerings.template_engine) = ANY($3::text[]))
        LIMIT 1
      `,
      [slug, normalizedFilter.offeringTypes, normalizedFilter.templateEngines]
    )
  );

  if (!result) {
    return null;
  }

  return (await mapOfferingRows(result.rows))[0] ?? null;
}

export async function getPublishedDigitalTemplateOfferingBySlug(
  slug: string,
  templateEngine: OfferingTemplateEngine
): Promise<Offering | null> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.slug = $1
          AND offerings.status = 'published'
          AND offerings.offering_type = 'digital_template'
          AND COALESCE(digital.template_engine, offerings.template_engine) = $2
        LIMIT 1
      `,
      [slug, templateEngine]
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
  const templateEngine = input.templateEngine ?? (input.offeringType === "digital_template" ? "coded" : undefined);
  const templateMode = input.templateMode ?? (templateEngine === "builder" ? "editable" : templateEngine ? "fixed" : undefined);

  if (input.offeringType === "digital_template") {
    const existingTemplateOffering = await getOfferingUsingTemplateKey({
      templateKey: input.templateKey,
      offeringType: input.offeringType,
      templateEngine,
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
            slug, category_id, name, excerpt, description, status, offering_type, template_key, template_engine, template_mode, thumbnail_url, price, fulfillment_type, track_inventory, stock_quantity, low_stock_threshold, allow_backorder, config
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
          templateEngine ?? "",
          templateMode ?? "",
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

      await execute("DELETE FROM digital_template_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM physical_offerings WHERE offering_id = $1", [offeringId]);

      if (input.offeringType === "digital_template") {
        const siteDefaults =
          typeof input.config?.siteDefaults === "object" && input.config.siteDefaults
            ? input.config.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
            VALUES ($1, $2, $3, $4, $5::jsonb)
          `,
          [offeringId, input.templateKey, templateEngine ?? "coded", templateMode ?? "fixed", JSON.stringify(siteDefaults)]
        );
      }

      if (input.offeringType === "physical_product") {
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
            INSERT INTO physical_offerings (
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
  const nextTemplateEngine = input.templateEngine ?? existing.templateEngine;
  const nextTemplateMode = input.templateMode ?? existing.templateMode;
  if (nextOfferingType !== existing.offeringType) {
    throw new Error("OFFERING_TYPE_LOCKED");
  }

  if (nextOfferingType === "digital_template") {
    const existingTemplateOffering = await getOfferingUsingTemplateKey({
      templateKey: nextTemplateKey,
      offeringType: nextOfferingType,
      templateEngine: nextTemplateEngine,
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
            template_engine = COALESCE($9, template_engine),
            template_mode = COALESCE($10, template_mode),
            thumbnail_url = $11,
            price = COALESCE($12, price),
            fulfillment_type = COALESCE($13, fulfillment_type),
            track_inventory = COALESCE($14, track_inventory),
            stock_quantity = COALESCE($15, stock_quantity),
            low_stock_threshold = COALESCE($16, low_stock_threshold),
            allow_backorder = COALESCE($17, allow_backorder),
            config = $18,
            updated_at = NOW()
          WHERE slug = $19
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
          input.templateEngine,
          input.templateMode,
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

      await execute("DELETE FROM digital_template_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM physical_offerings WHERE offering_id = $1", [offeringId]);

      if (nextOfferingType === "digital_template") {
        const siteDefaults =
          typeof nextConfig?.siteDefaults === "object" && nextConfig.siteDefaults
            ? nextConfig.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
            VALUES ($1, $2, $3, $4, $5::jsonb)
          `,
          [offeringId, nextTemplateKey, nextTemplateEngine ?? "coded", nextTemplateMode ?? "fixed", JSON.stringify(siteDefaults)]
        );
      }

      if (nextOfferingType === "physical_product") {
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
            INSERT INTO physical_offerings (
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

    const fullOffering = await getOfferingBySlug(slug);
    if (fullOffering?.offeringType === "digital_template" && fullOffering.templateEngine === "coded") {
      throw new Error("SYSTEM_TEMPLATE_DELETE_BLOCKED");
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
          LEFT JOIN digital_template_offerings digital ON digital.offering_id = offerings.id
          WHERE slug = ANY($1::text[])
            AND offerings.offering_type = 'digital_template'
            AND COALESCE(digital.template_engine, offerings.template_engine) = 'coded'
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
      throw new Error("SYSTEM_TEMPLATE_DELETE_BLOCKED");
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
