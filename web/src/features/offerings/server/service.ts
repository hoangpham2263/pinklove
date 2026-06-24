import "server-only";

import {
  SYSTEM_OFFERING_TYPES,
  SYSTEM_TEMPLATE_ENGINES,
  SYSTEM_TEMPLATE_MODES,
  type Offering,
  type OfferingCategory,
  type OfferingFulfillmentType,
  type OfferingOwnerType,
  type OfferingStatus,
  type OfferingTemplateEngine,
  type OfferingTemplateMode,
  type OfferingType,
  type OfferingTypeDefinition,
  type OfferingTypeField,
  type OfferingTypeFieldGroup,
  type OfferingTypeRegistryDiff,
  type OfferingTypeRegistrySyncStatus,
} from "@/features/offerings/types";
import { getRegisteredOfferingType, REGISTERED_OFFERING_TYPES, type RegisteredOfferingType } from "@/features/offerings/type-registry";
import { ensureOfferingCatalogReady, query, withTransaction, type DbExecutor } from "@/lib/database";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { recordDomainEvent } from "@/features/platform/server/domain-events";
import { recordFieldChanges } from "@/features/platform/server/field-change-logs";
import { syncMediaAssetLinkForUrl } from "@/features/media/server/media-links";
import { upsertOfferingSearchDocument } from "@/features/offerings/server/search-documents";
import { upsertProviderServiceForOffering } from "@/features/providers/server/service";

type OfferingInput = {
  slug: string;
  categoryId?: string;
  name: string;
  excerpt?: string;
  description?: string;
  status?: OfferingStatus;
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
  providerSku?: string;
  allowProviderSupply?: boolean;
  ownerType?: OfferingOwnerType;
  ownerProviderId?: string;
  ownerProviderType?: string;
  actorId?: string;
  config?: Record<string, unknown>;
  crossSells?: string[];
  upsells?: string[];
};

type OfferingCategoryInput = {
  slug: string;
  name: string;
  description?: string;
  status?: "draft" | "published";
};

type OfferingRelationshipType = "cross_sell" | "upsell";

type OfferingTypeInput = {
  key: string;
  fieldSchema?: OfferingTypeField[];
};

type OfferingTypeRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  fulfillment_type: OfferingFulfillmentType;
  template_key: string;
  template_engine: string | null;
  template_mode: string | null;
  supports_inventory: boolean;
  supports_provider_supply: boolean;
  is_system: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type OfferingTypeRegistryMetadata = {
  label: string;
  description: string;
  fulfillmentType: OfferingFulfillmentType;
  templateKey: string;
  templateEngine: string;
  templateMode: string;
  supportsInventory: boolean;
  supportsProviderSupply: boolean;
  isSystem: boolean;
  isDefault: boolean;
};

function shouldStorePhysicalOfferingDetails({
  offeringType,
  fulfillmentType,
  supportsInventory,
  supportsProviderSupply,
  trackInventory,
  allowProviderSupply,
}: {
  offeringType: OfferingType;
  fulfillmentType?: OfferingFulfillmentType;
  supportsInventory?: boolean;
  supportsProviderSupply?: boolean;
  trackInventory?: boolean;
  allowProviderSupply?: boolean;
}) {
  if (offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) {
    return false;
  }

  return (
    fulfillmentType === "physical" ||
    Boolean(supportsInventory) ||
    Boolean(supportsProviderSupply) ||
    Boolean(trackInventory) ||
    Boolean(allowProviderSupply)
  );
}

type OfferingTypeFieldRow = {
  id: string;
  offering_type_id: string;
  group_id: string | null;
  field_key: string;
  field_label: string;
  field_type: OfferingTypeField["type"];
  is_required: boolean;
  default_value: unknown;
  validation_rules: Record<string, unknown> | null;
  ui_config: Record<string, unknown> | null;
  visibility_conditions: Record<string, unknown> | null;
  dependency_conditions: Record<string, unknown> | null;
  relation_target: string | null;
  relation_multiple: boolean;
  relation_config: Record<string, unknown> | null;
  sort_order: number;
};

type OfferingTypeFieldGroupRow = {
  id: string;
  offering_type_id: string;
  key: string;
  label: string;
  sort_order: number;
  ui_config: Record<string, unknown> | null;
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

const validOfferingFieldTypes = new Set<OfferingTypeField["type"]>([
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "select",
  "multiselect",
  "date",
  "datetime",
  "media",
  "gallery",
  "price",
  "location",
  "json",
  "repeater",
  "relation",
  "blocks",
  "url",
]);

function normalizeOfferingTypeFields(fields: OfferingTypeField[]): OfferingTypeField[] {
  const seenKeys = new Set<string>();

  return fields.map((field, index) => {
    const key = field.key.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      throw new Error("INVALID_OFFERING_FIELD_KEY");
    }

    if (seenKeys.has(key)) {
      throw new Error("DUPLICATE_OFFERING_FIELD_KEY");
    }
    seenKeys.add(key);

    const label = field.label.trim();
    if (!label) {
      throw new Error("MISSING_OFFERING_FIELD_LABEL");
    }

    if (!validOfferingFieldTypes.has(field.type)) {
      throw new Error("INVALID_OFFERING_FIELD_TYPE");
    }

    const validationRules = { ...(field.validationRules ?? {}) };
    const allowedValues = Array.isArray(validationRules.allowed_values)
      ? validationRules.allowed_values.map(String).map((value) => value.trim()).filter(Boolean)
      : Array.isArray(field.options)
        ? field.options.map(String).map((value) => value.trim()).filter(Boolean)
        : [];

    if ((field.type === "select" || field.type === "multiselect") && allowedValues.length === 0) {
      throw new Error("MISSING_OFFERING_FIELD_ALLOWED_VALUES");
    }

    if (allowedValues.length > 0) {
      validationRules.allowed_values = Array.from(new Set(allowedValues));
    }

    for (const ruleKey of ["min", "max"] as const) {
      if (validationRules[ruleKey] !== undefined && !Number.isFinite(Number(validationRules[ruleKey]))) {
        throw new Error("INVALID_OFFERING_FIELD_VALIDATION_RULE");
      }
    }

    if (validationRules.regex !== undefined) {
      try {
        new RegExp(String(validationRules.regex));
      } catch {
        throw new Error("INVALID_OFFERING_FIELD_REGEX");
      }
    }

    if (validationRules.unique !== undefined && typeof validationRules.unique !== "boolean") {
      throw new Error("INVALID_OFFERING_FIELD_VALIDATION_RULE");
    }

    return {
      ...field,
      key,
      label,
      validationRules,
      sortOrder: field.sortOrder ?? index,
    };
  });
}

function isFieldVisible(field: OfferingTypeField, values: Record<string, unknown>) {
  const conditions = field.visibilityConditions ?? {};
  const allConditions =
    Array.isArray(conditions.all) ? conditions.all :
    Array.isArray(conditions.conditions) ? conditions.conditions :
    [];

  if (allConditions.length === 0) {
    return true;
  }

  return allConditions.every((condition) => {
    if (!condition || typeof condition !== "object") {
      return true;
    }

    const conditionRecord = condition as Record<string, unknown>;
    const fieldKey = String(conditionRecord.field ?? conditionRecord.fieldKey ?? "");
    const operator = String(conditionRecord.operator ?? "equals");
    const expected = conditionRecord.value;
    const actual = values[fieldKey];

    switch (operator) {
      case "not_equals":
        return actual !== expected;
      case "in":
        return Array.isArray(expected) && expected.includes(actual);
      case "not_empty":
        return actual !== undefined && actual !== null && String(actual).trim() !== "";
      case "empty":
        return actual === undefined || actual === null || String(actual).trim() === "";
      case "equals":
      default:
        return actual === expected;
    }
  });
}

function coerceOfferingFieldValue(field: OfferingTypeField, rawValue: unknown) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }

  if (field.type === "number" || field.type === "price") {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      throw new Error(`INVALID_CUSTOM_FIELD:${field.key}`);
    }
    return value;
  }

  if (field.type === "boolean") {
    return Boolean(rawValue);
  }

  if (field.type === "multiselect") {
    return Array.isArray(rawValue) ? rawValue.map(String).filter(Boolean) : String(rawValue).split(",").map((value) => value.trim()).filter(Boolean);
  }

  if (field.type === "json" || field.type === "repeater" || field.type === "blocks" || field.type === "gallery") {
    if (typeof rawValue === "string") {
      try {
        return JSON.parse(rawValue) as unknown;
      } catch {
        throw new Error(`INVALID_CUSTOM_FIELD:${field.key}`);
      }
    }
    return rawValue;
  }

  return String(rawValue);
}

export async function validateOfferingCustomFields(input: {
  offeringTypeDefinition: OfferingTypeDefinition;
  values: Record<string, unknown>;
  excludeOfferingId?: string;
}): Promise<Record<string, unknown>> {
  const normalizedValues: Record<string, unknown> = {};

  for (const field of input.offeringTypeDefinition.fieldSchema) {
    if (!isFieldVisible(field, input.values)) {
      continue;
    }

    const value = coerceOfferingFieldValue(field, input.values[field.key]);
    const validationRules = field.validationRules ?? {};
    const required = Boolean(field.required || validationRules.required);

    if (required && (value === undefined || value === null || String(value).trim() === "")) {
      throw new Error(`REQUIRED_CUSTOM_FIELD:${field.key}`);
    }

    if (value === undefined) {
      continue;
    }

    if ((field.type === "number" || field.type === "price") && typeof value === "number") {
      if (validationRules.min !== undefined && value < Number(validationRules.min)) {
        throw new Error(`CUSTOM_FIELD_TOO_SMALL:${field.key}`);
      }
      if (validationRules.max !== undefined && value > Number(validationRules.max)) {
        throw new Error(`CUSTOM_FIELD_TOO_LARGE:${field.key}`);
      }
    }

    if (typeof value === "string") {
      if (validationRules.min !== undefined && value.length < Number(validationRules.min)) {
        throw new Error(`CUSTOM_FIELD_TOO_SHORT:${field.key}`);
      }
      if (validationRules.max !== undefined && value.length > Number(validationRules.max)) {
        throw new Error(`CUSTOM_FIELD_TOO_LONG:${field.key}`);
      }
      if (validationRules.regex !== undefined && !new RegExp(String(validationRules.regex)).test(value)) {
        throw new Error(`CUSTOM_FIELD_REGEX_FAILED:${field.key}`);
      }
    }

    const allowedValues = Array.isArray(validationRules.allowed_values)
      ? validationRules.allowed_values.map(String)
      : field.options ?? [];
    if (allowedValues.length > 0) {
      const values = Array.isArray(value) ? value.map(String) : [String(value)];
      if (values.some((item) => !allowedValues.includes(item))) {
        throw new Error(`CUSTOM_FIELD_NOT_ALLOWED:${field.key}`);
      }
    }

    if (validationRules.unique === true) {
      const duplicateResult = await query<{ count: string }>(
        `
          SELECT COUNT(*)::text AS count
          FROM offerings
          WHERE offering_type = $1
            AND config -> 'customFields' ->> $2 = $3
            AND ($4::text IS NULL OR id <> $4)
        `,
        [input.offeringTypeDefinition.key, field.key, String(value), input.excludeOfferingId ?? null]
      );
      if (Number(duplicateResult.rows[0]?.count ?? "0") > 0) {
        throw new Error(`CUSTOM_FIELD_NOT_UNIQUE:${field.key}`);
      }
    }

    normalizedValues[field.key] = value;
  }

  return normalizedValues;
}

function mapOfferingTypeFieldRow(row: OfferingTypeFieldRow): OfferingTypeField {
  const validationRules = row.validation_rules ?? {};
  const options = Array.isArray(validationRules.allowed_values) ? validationRules.allowed_values.map(String) : undefined;

  return {
    id: row.id,
    key: row.field_key,
    label: row.field_label,
    type: row.field_type,
    required: row.is_required,
    options,
    defaultValue: row.default_value ?? undefined,
    validationRules,
    uiConfig: row.ui_config ?? {},
    sortOrder: row.sort_order,
    groupId: row.group_id ?? undefined,
    visibilityConditions: row.visibility_conditions ?? {},
    dependencyConditions: row.dependency_conditions ?? {},
    relationTarget: row.relation_target ?? undefined,
    relationMultiple: row.relation_multiple,
    relationConfig: row.relation_config ?? {},
  };
}

function mapOfferingTypeFieldGroupRow(row: OfferingTypeFieldGroupRow): OfferingTypeFieldGroup {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    sortOrder: row.sort_order,
    uiConfig: row.ui_config ?? {},
  };
}

function mapOfferingTypeRow(
  row: OfferingTypeRow,
  fields: OfferingTypeField[] = [],
  fieldGroups: OfferingTypeFieldGroup[] = []
): OfferingTypeDefinition {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? undefined,
    fulfillmentType: row.fulfillment_type,
    templateKey: row.template_key,
    templateEngine: row.template_engine ? (row.template_engine as OfferingTemplateEngine) : undefined,
    templateMode: row.template_mode ? (row.template_mode as OfferingTemplateMode) : undefined,
    supportsInventory: row.supports_inventory,
    supportsProviderSupply: row.supports_provider_supply,
    isSystem: row.is_system,
    isDefault: row.is_default,
    fieldGroups,
    fieldSchema: fields,
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
  status: OfferingStatus;
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
  physical_provider_sku: string | null;
  physical_allow_provider_supply: boolean | null;
  physical_provider_id: string | null;
  physical_provider_type: string | null;
  config: Record<string, unknown> | null;
  cross_sells_json: string | null;
  upsells_json: string | null;
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
    if (type === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) {
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
  const { generalOffering: _generalOffering, ...baseConfig } = row.config ?? {};
  void _generalOffering;
  const ownerType = row.physical_provider_id ? "provider" : "internal";
  const ownerProviderId = ownerType === "provider" ? row.physical_provider_id ?? undefined : undefined;
  const ownerProviderType = ownerType === "provider" ? row.physical_provider_type ?? undefined : undefined;
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
  const providerSku = row.physical_provider_sku ?? "";
  const allowProviderSupply = row.physical_allow_provider_supply ?? false;
  const config: Record<string, unknown> = {
    ...baseConfig,
    ...(siteDefaults ? { siteDefaults } : {}),
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
    providerSku,
    allowProviderSupply,
    ownerType: ownerType as OfferingOwnerType,
    ownerProviderId,
    ownerProviderType,
    config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    crossSells: row.cross_sells_json ? (typeof row.cross_sells_json === "string" ? JSON.parse(row.cross_sells_json) : row.cross_sells_json) : undefined,
    upsells: row.upsells_json ? (typeof row.upsells_json === "string" ? JSON.parse(row.upsells_json) : row.upsells_json) : undefined,
  };
}

function normalizeRelationshipIds(ids: string[] | undefined, sourceOfferingId: string) {
  return Array.from(new Set((ids ?? []).map((id) => id.trim()).filter((id) => id && id !== sourceOfferingId)));
}

async function replaceOfferingRelationships(
  execute: DbExecutor,
  sourceOfferingId: string,
  relationshipType: OfferingRelationshipType,
  targetOfferingIds: string[] | undefined,
) {
  const normalizedIds = normalizeRelationshipIds(targetOfferingIds, sourceOfferingId);

  await execute(
    "DELETE FROM offering_relationships WHERE source_offering_id = $1 AND relationship_type = $2",
    [sourceOfferingId, relationshipType],
  );

  for (const [index, targetOfferingId] of normalizedIds.entries()) {
    await execute(
      `
        INSERT INTO offering_relationships (source_offering_id, target_offering_id, relationship_type, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (source_offering_id, target_offering_id, relationship_type)
        DO UPDATE SET sort_order = EXCLUDED.sort_order, updated_at = NOW()
      `,
      [sourceOfferingId, targetOfferingId, relationshipType, index],
    );
  }
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
    physical.provider_sku AS physical_provider_sku,
    physical.allow_provider_supply AS physical_allow_provider_supply,
    physical.provider_id AS physical_provider_id,
    physical.provider_type AS physical_provider_type,
    offerings.config,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.target_offering_id,
          'slug', rel_o.slug,
          'name', rel_o.name,
          'thumbnailUrl', rel_o.thumbnail_url,
          'price', rel_o.price
        )
        ORDER BY r.sort_order ASC
      )
      FROM offering_relationships r
      JOIN offerings rel_o ON rel_o.id = r.target_offering_id
      WHERE r.source_offering_id = offerings.id AND r.relationship_type = 'cross_sell'
    ) AS cross_sells_json,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.target_offering_id,
          'slug', rel_o.slug,
          'name', rel_o.name,
          'thumbnailUrl', rel_o.thumbnail_url,
          'price', rel_o.price
        )
        ORDER BY r.sort_order ASC
      )
      FROM offering_relationships r
      JOIN offerings rel_o ON rel_o.id = r.target_offering_id
      WHERE r.source_offering_id = offerings.id AND r.relationship_type = 'upsell'
    ) AS upsells_json,
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
  return (
    pgError?.code === "42P01" ||
    pgError?.code === "42703" ||
    /offering_categories|offering_type_fields|offering_type_field_groups|category_id/i.test(pgError?.message ?? "")
  );
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

async function listOfferingTypeFieldsByTypeIds(typeIds: string[]): Promise<Map<string, OfferingTypeField[]>> {
  const fieldsByTypeId = new Map<string, OfferingTypeField[]>();

  if (typeIds.length === 0) {
    return fieldsByTypeId;
  }

  const result = await query<OfferingTypeFieldRow>(
    `
      SELECT
        id,
        offering_type_id,
        group_id,
        field_key,
        field_label,
        field_type,
        is_required,
        default_value,
        validation_rules,
        ui_config,
        visibility_conditions,
        dependency_conditions,
        relation_target,
        relation_multiple,
        relation_config,
        sort_order
      FROM offering_type_fields
      WHERE offering_type_id = ANY($1::text[])
      ORDER BY sort_order ASC, field_label ASC, field_key ASC
    `,
    [typeIds]
  );

  for (const row of result.rows) {
    const fields = fieldsByTypeId.get(row.offering_type_id) ?? [];
    fields.push(mapOfferingTypeFieldRow(row));
    fieldsByTypeId.set(row.offering_type_id, fields);
  }

  return fieldsByTypeId;
}

async function listOfferingTypeFieldGroupsByTypeIds(typeIds: string[]): Promise<Map<string, OfferingTypeFieldGroup[]>> {
  const groupsByTypeId = new Map<string, OfferingTypeFieldGroup[]>();

  if (typeIds.length === 0) {
    return groupsByTypeId;
  }

  const result = await query<OfferingTypeFieldGroupRow>(
    `
      SELECT id, offering_type_id, key, label, sort_order, ui_config
      FROM offering_type_field_groups
      WHERE offering_type_id = ANY($1::text[])
      ORDER BY sort_order ASC, label ASC, key ASC
    `,
    [typeIds]
  );

  for (const row of result.rows) {
    const groups = groupsByTypeId.get(row.offering_type_id) ?? [];
    groups.push(mapOfferingTypeFieldGroupRow(row));
    groupsByTypeId.set(row.offering_type_id, groups);
  }

  return groupsByTypeId;
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

export async function listRelatedTemplateOfferings(currentOfferingId: string, limit?: number): Promise<Offering[]> {
  const shouldLimit = typeof limit === "number" && Number.isFinite(limit) && limit > 0;
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingRow>(
      `
        ${OFFERING_SELECT}
        WHERE offerings.status = 'published'
          AND (
            offerings.offering_type = 'digital_template'
            OR LOWER(offerings.slug) LIKE '%thiep%'
            OR LOWER(offerings.name) LIKE '%thiệp%'
          )
          AND offerings.id <> $1
        ORDER BY
          (
            SELECT COALESCE(SUM(items.quantity), 0)
            FROM commerce_order_items items
            INNER JOIN commerce_orders orders ON orders.id = items.order_id
            WHERE items.offering_id = offerings.id
              AND (
                orders.payment_status = 'paid'
                OR orders.status IN ('paid', 'processing', 'ready_to_ship', 'shipped', 'completed')
              )
          ) DESC,
          offerings.updated_at DESC,
          offerings.name ASC
        ${shouldLimit ? "LIMIT $2" : ""}
      `,
      shouldLimit ? [currentOfferingId, limit] : [currentOfferingId]
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

export async function listOfferingTypes(): Promise<OfferingTypeDefinition[]> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTypeRow>(
      `
        SELECT
          id,
          key,
          label,
          description,
          fulfillment_type,
          template_key,
          template_engine,
          template_mode,
          supports_inventory,
          supports_provider_supply,
          is_system,
          is_default,
          created_at,
          updated_at
        FROM offering_types
        ORDER BY is_default DESC, is_system DESC, label ASC, key ASC
      `
    )
  );

  const typeIds = result.rows.map((row) => row.id);
  const [fieldsByTypeId, groupsByTypeId] = await Promise.all([
    listOfferingTypeFieldsByTypeIds(typeIds),
    listOfferingTypeFieldGroupsByTypeIds(typeIds),
  ]);

  return result.rows.map((row) =>
    mapOfferingTypeRow(row, fieldsByTypeId.get(row.id) ?? [], groupsByTypeId.get(row.id) ?? [])
  );
}

function normalizeRegisteredOfferingType(type: RegisteredOfferingType): OfferingTypeRegistryMetadata {
  return {
    label: type.label,
    description: type.description,
    fulfillmentType: type.fulfillmentType,
    templateKey: type.templateKey,
    templateEngine: type.templateEngine ?? "",
    templateMode: type.templateMode ?? "",
    supportsInventory: type.supportsInventory,
    supportsProviderSupply: type.supportsProviderSupply,
    isSystem: true,
    isDefault: true,
  };
}

function normalizeOfferingTypeRowForRegistry(row: OfferingTypeRow): OfferingTypeRegistryMetadata {
  return {
    label: row.label,
    description: row.description ?? "",
    fulfillmentType: row.fulfillment_type,
    templateKey: row.template_key,
    templateEngine: row.template_engine ?? "",
    templateMode: row.template_mode ?? "",
    supportsInventory: row.supports_inventory,
    supportsProviderSupply: row.supports_provider_supply,
    isSystem: row.is_system,
    isDefault: row.is_default,
  };
}

function getRegistryMetadataDiffs(
  codeByKey: Map<string, OfferingTypeRegistryMetadata>,
  dbByKey: Map<string, OfferingTypeRegistryMetadata>
) {
  const diffs: OfferingTypeRegistryDiff[] = [];

  for (const [key, codeType] of codeByKey.entries()) {
    const dbType = dbByKey.get(key);
    if (!dbType) {
      continue;
    }

    for (const field of Object.keys(codeType) as Array<keyof OfferingTypeRegistryMetadata>) {
      if (codeType[field] !== dbType[field]) {
        diffs.push({
          key,
          field,
          codeValue: codeType[field],
          dbValue: dbType[field],
        });
      }
    }
  }

  return diffs;
}

export async function getOfferingTypeRegistrySyncStatus(): Promise<OfferingTypeRegistrySyncStatus> {
  const result = await withOfferingCatalogRetry(() =>
    query<OfferingTypeRow>(
      `
        SELECT
          id,
          key,
          label,
          description,
          fulfillment_type,
          template_key,
          template_engine,
          template_mode,
          supports_inventory,
          supports_provider_supply,
          is_system,
          is_default,
          created_at,
          updated_at
        FROM offering_types
        ORDER BY key ASC
      `
    )
  );

  const codeByKey = new Map(REGISTERED_OFFERING_TYPES.map((type) => [type.key, normalizeRegisteredOfferingType(type)]));
  const dbByKey = new Map(result.rows.map((row) => [row.key, normalizeOfferingTypeRowForRegistry(row)]));
  const codeKeys = Array.from(codeByKey.keys()).sort();
  const dbKeys = Array.from(dbByKey.keys()).sort();
  const missingInDb = codeKeys.filter((key) => !dbByKey.has(key));
  const extraInDb = dbKeys.filter((key) => !codeByKey.has(key));
  const metadataDiffs = getRegistryMetadataDiffs(codeByKey, dbByKey);

  return {
    isSynced: missingInDb.length === 0 && extraInDb.length === 0 && metadataDiffs.length === 0,
    codeKeys,
    dbKeys,
    missingInDb,
    extraInDb,
    metadataDiffs,
    checkedAt: new Date().toISOString(),
  };
}

export async function syncOfferingTypesFromRegistry(): Promise<OfferingTypeRegistrySyncStatus> {
  await withOfferingCatalogRetry(() =>
    withTransaction(async (execute) => {
      for (const type of REGISTERED_OFFERING_TYPES) {
        await execute(
          `
            INSERT INTO offering_types (
              key,
              label,
              description,
              fulfillment_type,
              template_key,
              template_engine,
              template_mode,
              supports_inventory,
              supports_provider_supply,
              is_system,
              is_default
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE)
            ON CONFLICT (key) DO UPDATE
            SET
              label = EXCLUDED.label,
              description = EXCLUDED.description,
              fulfillment_type = EXCLUDED.fulfillment_type,
              template_key = EXCLUDED.template_key,
              template_engine = EXCLUDED.template_engine,
              template_mode = EXCLUDED.template_mode,
              supports_inventory = EXCLUDED.supports_inventory,
              supports_provider_supply = EXCLUDED.supports_provider_supply,
              is_system = TRUE,
              is_default = TRUE,
              updated_at = NOW()
          `,
          [
            type.key,
            type.label,
            type.description,
            type.fulfillmentType,
            type.templateKey,
            type.templateEngine ?? "",
            type.templateMode ?? "",
            type.supportsInventory,
            type.supportsProviderSupply,
          ]
        );
      }

      const registeredKeys = REGISTERED_OFFERING_TYPES.map((type) => type.key);
      await execute(
        "DELETE FROM offerings WHERE offering_type <> $1 AND NOT (offering_type = ANY($2::text[]))",
        [SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE, registeredKeys]
      );
      await execute("DELETE FROM offering_types WHERE NOT (key = ANY($1::text[]))", [registeredKeys]);
    })
  );

  return getOfferingTypeRegistrySyncStatus();
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
          fulfillment_type,
          template_key,
          template_engine,
          template_mode,
          supports_inventory,
          supports_provider_supply,
          is_system,
          is_default,
          created_at,
          updated_at
        FROM offering_types
        WHERE key = $1
        LIMIT 1
      `,
      [key]
    )
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const [fieldsByTypeId, groupsByTypeId] = await Promise.all([
    listOfferingTypeFieldsByTypeIds([row.id]),
    listOfferingTypeFieldGroupsByTypeIds([row.id]),
  ]);

  return mapOfferingTypeRow(row, fieldsByTypeId.get(row.id) ?? [], groupsByTypeId.get(row.id) ?? []);
}

export async function saveOfferingType(input: OfferingTypeInput): Promise<OfferingTypeDefinition> {
  const key = input.key.trim().toLowerCase();
  if (!getRegisteredOfferingType(key)) {
    throw new Error("UNREGISTERED_OFFERING_TYPE");
  }

  const fieldSchema = normalizeOfferingTypeFields(Array.isArray(input.fieldSchema) ? input.fieldSchema : []);
  const savedType = await withOfferingCatalogRetry(() =>
    withTransaction(async (execute) => {
      const result = await execute<OfferingTypeRow>(
      `
        SELECT
          id,
          key,
          label,
          description,
          fulfillment_type,
          template_key,
          template_engine,
          template_mode,
          supports_inventory,
          supports_provider_supply,
          is_system,
          is_default,
          created_at,
          updated_at
        FROM offering_types
        WHERE key = $1
        LIMIT 1
      `,
      [key]
      );

      const typeRow = result.rows[0];
      if (!typeRow) {
        throw new Error("OFFERING_TYPE_NOT_SYNCED");
      }
      await execute("DELETE FROM offering_type_fields WHERE offering_type_id = $1", [typeRow.id]);

      for (const [index, field] of fieldSchema.entries()) {
        const validationRules = {
          ...(field.validationRules ?? {}),
          ...(Array.isArray(field.options) && field.options.length > 0 ? { allowed_values: field.options } : {}),
        };

        await execute(
          `
            INSERT INTO offering_type_fields (
              offering_type_id,
              group_id,
              field_key,
              field_label,
              field_type,
              is_required,
              default_value,
              validation_rules,
              ui_config,
              visibility_conditions,
              dependency_conditions,
              relation_target,
              relation_multiple,
              relation_config,
              sort_order
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7::jsonb,
              $8::jsonb,
              $9::jsonb,
              $10::jsonb,
              $11::jsonb,
              $12,
              $13,
              $14::jsonb,
              $15
            )
          `,
          [
            typeRow.id,
            field.groupId ?? null,
            field.key,
            field.label,
            field.type,
            Boolean(field.required),
            field.defaultValue === undefined ? null : JSON.stringify(field.defaultValue),
            JSON.stringify(validationRules),
            JSON.stringify(field.uiConfig ?? {}),
            JSON.stringify(field.visibilityConditions ?? {}),
            JSON.stringify(field.dependencyConditions ?? {}),
            field.relationTarget ?? null,
            Boolean(field.relationMultiple),
            JSON.stringify(field.relationConfig ?? {}),
            field.sortOrder ?? index,
          ]
        );
      }

      return typeRow;
    })
  );

  const fieldsByTypeId = await listOfferingTypeFieldsByTypeIds([savedType.id]);
  return mapOfferingTypeRow(savedType, fieldsByTypeId.get(savedType.id) ?? []);
}

function sanitizeOfferingConfig(config: Record<string, unknown> | undefined): Record<string, unknown> {
  const {
    inventory: _inventory,
    pricing_rules: _pricingRules,
    permissions: _permissions,
    analytics: _analytics,
    booking_logic: _bookingLogic,
    relational_data: _relationalData,
    siteDefaults: _siteDefaults,
    generalOffering: _generalOffering,
    ...safeConfig
  } = config ?? {};

  void _inventory;
  void _pricingRules;
  void _permissions;
  void _analytics;
  void _bookingLogic;
  void _relationalData;
  void _siteDefaults;
  void _generalOffering;

  return safeConfig;
}

async function resolveProviderOwner(input: Pick<OfferingInput, "ownerProviderId" | "ownerProviderType">) {
  if (input.ownerProviderId) {
    return {
      providerId: input.ownerProviderId,
      providerType: input.ownerProviderType ?? "provider",
    };
  }

  return {
    providerId: null,
    providerType: null,
  };
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
  offeringType: OfferingType | OfferingType[]
): Promise<Offering | null> {
  const normalizedFilter = normalizeOfferingTypeFilter(Array.isArray(offeringType) ? offeringType : [offeringType]);
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
  if (!input.categoryId) {
    throw new Error("OFFERING_CATEGORY_REQUIRED");
  }

  const safeConfig = sanitizeOfferingConfig(input.config);
  const ownerProvider = await resolveProviderOwner(input);
  const offeringTypeDefinition = await getOfferingTypeByKey(input.offeringType);
  const shouldStorePhysicalDetails = shouldStorePhysicalOfferingDetails({
    offeringType: input.offeringType,
    fulfillmentType: input.fulfillmentType,
    supportsInventory: offeringTypeDefinition?.supportsInventory,
    supportsProviderSupply: offeringTypeDefinition?.supportsProviderSupply,
    trackInventory: input.trackInventory,
    allowProviderSupply: input.allowProviderSupply,
  });
  const templateEngine = input.templateEngine ?? (input.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE ? SYSTEM_TEMPLATE_ENGINES.CODED : undefined);
  const templateMode = input.templateMode ?? (
    templateEngine === SYSTEM_TEMPLATE_ENGINES.BUILDER
      ? SYSTEM_TEMPLATE_MODES.EDITABLE
      : templateEngine
        ? SYSTEM_TEMPLATE_MODES.FIXED
        : undefined
  );

  if (input.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) {
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
          safeConfig,
        ]
      );

      const offeringId = created.rows[0]?.id;
      if (!offeringId) {
        throw new Error("OFFERING_CREATE_FAILED");
      }

      await execute("DELETE FROM digital_template_offerings WHERE offering_id = $1", [offeringId]);
      await execute("DELETE FROM physical_offerings WHERE offering_id = $1", [offeringId]);

      if (input.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) {
        const siteDefaults =
          typeof input.config?.siteDefaults === "object" && input.config.siteDefaults
            ? input.config.siteDefaults
            : {};

        await execute(
          `
            INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
            VALUES ($1, $2, $3, $4, $5::jsonb)
          `,
          [offeringId, input.templateKey, templateEngine ?? SYSTEM_TEMPLATE_ENGINES.CODED, templateMode ?? SYSTEM_TEMPLATE_MODES.FIXED, JSON.stringify(siteDefaults)]
        );
      }

      if (shouldStorePhysicalDetails) {
        const ownerType = input.ownerType === "provider" ? "provider" : "internal";
        const ownerProviderId = ownerType === "provider" ? ownerProvider.providerId : null;
        const ownerProviderType = ownerType === "provider" ? ownerProvider.providerType ?? "provider" : null;
        const costPrice = input.costPrice ?? 0;
        const providerSku = input.providerSku ?? "";

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
              provider_sku,
              allow_provider_supply,
              provider_type,
              provider_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          [
            offeringId,
            input.fulfillmentType ?? "digital",
            input.trackInventory ?? false,
            input.stockQuantity ?? 0,
            input.lowStockThreshold ?? 0,
            input.allowBackorder ?? false,
            costPrice,
            providerSku,
            input.allowProviderSupply ?? false,
            ownerProviderType,
            ownerProviderId,
          ]
        );

        if (ownerProviderId) {
          await upsertProviderServiceForOffering({
            providerId: ownerProviderId,
            offeringId,
            title: input.name,
            fulfillmentType: input.fulfillmentType ?? "digital",
            status: input.status === "archived" || input.status === "disabled" ? "paused" : "active",
            basePrice: input.price ?? 0,
            metadata: { source: "admin_offering_editor", provider_type: ownerProviderType },
            execute,
          });
        }
      }

      await replaceOfferingRelationships(execute, offeringId, "cross_sell", input.crossSells);
      await replaceOfferingRelationships(execute, offeringId, "upsell", input.upsells);
    })
  );

  const created = await getOfferingBySlug(input.slug);
  if (!created) {
    throw new Error("OFFERING_CREATE_FAILED");
  }

  await upsertOfferingSearchDocument(created);
  await syncMediaAssetLinkForUrl({
    url: created.thumbnailUrl,
    targetType: "offering",
    targetId: created.id,
    role: "thumbnail",
    metadata: { source: "offering_create" },
  });
  await recordDomainEvent({
    eventName: "offering.created",
    aggregateType: "offering",
    aggregateId: created.id,
    payload: { slug: created.slug, offeringType: created.offeringType },
  });

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
  const nextCategoryId = input.categoryId ?? existing.categoryId;
  if (!nextCategoryId) {
    throw new Error("OFFERING_CATEGORY_REQUIRED");
  }
  const offeringTypeDefinition = await getOfferingTypeByKey(nextOfferingType);
  const shouldStorePhysicalDetails = shouldStorePhysicalOfferingDetails({
    offeringType: nextOfferingType,
    fulfillmentType: input.fulfillmentType ?? existing.fulfillmentType,
    supportsInventory: offeringTypeDefinition?.supportsInventory,
    supportsProviderSupply: offeringTypeDefinition?.supportsProviderSupply,
    trackInventory: input.trackInventory ?? existing.trackInventory,
    allowProviderSupply: input.allowProviderSupply ?? existing.allowProviderSupply,
  });
  if (nextOfferingType !== existing.offeringType) {
    throw new Error("OFFERING_TYPE_LOCKED");
  }

  if (nextOfferingType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) {
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

  const nextConfig = input.config !== undefined ? sanitizeOfferingConfig(input.config) : sanitizeOfferingConfig(existing.config);
  const ownerProvider = await resolveProviderOwner({
    ownerProviderId: input.ownerProviderId ?? existing.ownerProviderId,
    ownerProviderType: input.ownerProviderType ?? existing.ownerProviderType,
  });
  const nextSiteDefaults =
    input.config !== undefined && typeof input.config.siteDefaults === "object" && input.config.siteDefaults
      ? input.config.siteDefaults
      : typeof existing.config.siteDefaults === "object" && existing.config.siteDefaults
        ? existing.config.siteDefaults
        : {};

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
          nextCategoryId,
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

      if (nextOfferingType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE) {
        await execute(
          `
            INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
            VALUES ($1, $2, $3, $4, $5::jsonb)
          `,
          [offeringId, nextTemplateKey, nextTemplateEngine ?? SYSTEM_TEMPLATE_ENGINES.CODED, nextTemplateMode ?? SYSTEM_TEMPLATE_MODES.FIXED, JSON.stringify(nextSiteDefaults)]
        );
      }

      if (shouldStorePhysicalDetails) {
        const ownerType = input.ownerType ?? existing.ownerType;
        const ownerProviderId = ownerType === "provider" ? ownerProvider.providerId : null;
        const ownerProviderType = ownerType === "provider" ? ownerProvider.providerType ?? "provider" : null;
        const costPrice = input.costPrice ?? existing.costPrice;
        const providerSku = input.providerSku ?? existing.providerSku;

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
              provider_sku,
              allow_provider_supply,
              provider_type,
              provider_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          [
            offeringId,
            input.fulfillmentType ?? existing.fulfillmentType,
            input.trackInventory ?? existing.trackInventory,
            input.stockQuantity ?? existing.stockQuantity,
            input.lowStockThreshold ?? existing.lowStockThreshold,
            input.allowBackorder ?? existing.allowBackorder,
            costPrice,
            providerSku,
            input.allowProviderSupply ?? existing.allowProviderSupply,
            ownerProviderType,
            ownerProviderId,
          ]
        );

        if (ownerProviderId) {
          await upsertProviderServiceForOffering({
            providerId: ownerProviderId,
            offeringId,
            title: input.name ?? existing.name,
            fulfillmentType: input.fulfillmentType ?? existing.fulfillmentType,
            status: input.status === "archived" || input.status === "disabled" ? "paused" : "active",
            basePrice: input.price ?? existing.price,
            metadata: { source: "admin_offering_editor", provider_type: ownerProviderType },
            execute,
          });
        }
      }

      if (input.crossSells !== undefined || input.upsells !== undefined) {
        if (input.crossSells !== undefined) {
          await replaceOfferingRelationships(execute, offeringId, "cross_sell", input.crossSells);
        }

        if (input.upsells !== undefined) {
          await replaceOfferingRelationships(execute, offeringId, "upsell", input.upsells);
        }
      }

      return updated.rows[0];
    })
  );

  if (!result) {
    return null;
  }

  const updatedOffering = await getOfferingBySlug(input.slug ?? slug);
  if (updatedOffering) {
    await upsertOfferingSearchDocument(updatedOffering);
    await syncMediaAssetLinkForUrl({
      url: updatedOffering.thumbnailUrl,
      targetType: "offering",
      targetId: updatedOffering.id,
      role: "thumbnail",
      metadata: { source: "offering_update" },
    });
    await recordFieldChanges([
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "slug", oldValue: existing.slug, newValue: updatedOffering.slug, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "categoryId", oldValue: existing.categoryId ?? null, newValue: updatedOffering.categoryId ?? null, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "name", oldValue: existing.name, newValue: updatedOffering.name, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "status", oldValue: existing.status, newValue: updatedOffering.status, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "price", oldValue: existing.price, newValue: updatedOffering.price, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "fulfillmentType", oldValue: existing.fulfillmentType, newValue: updatedOffering.fulfillmentType, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "thumbnailUrl", oldValue: existing.thumbnailUrl ?? null, newValue: updatedOffering.thumbnailUrl ?? null, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "ownerProviderId", oldValue: existing.ownerProviderId ?? null, newValue: updatedOffering.ownerProviderId ?? null, actorId: input.actorId },
      { targetType: "offering", targetId: updatedOffering.id, fieldKey: "config", oldValue: sanitizeOfferingConfig(existing.config), newValue: sanitizeOfferingConfig(updatedOffering.config), actorId: input.actorId },
    ]);
    await recordDomainEvent({
      eventName: "offering.updated",
      aggregateType: "offering",
      aggregateId: updatedOffering.id,
      payload: { slug: updatedOffering.slug, offeringType: updatedOffering.offeringType },
    });
  }

  return updatedOffering;
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
    if (fullOffering?.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE && fullOffering.templateEngine === SYSTEM_TEMPLATE_ENGINES.CODED) {
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
  status: OfferingStatus
): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  if (status === "published") {
    const missingCategory = await withOfferingCatalogRetry(() =>
      query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM offerings
            WHERE slug = ANY($1::text[])
              AND category_id IS NULL
          ) AS exists
        `,
        [slugs]
      )
    );
    if (missingCategory.rows[0]?.exists) {
      throw new Error("OFFERING_CATEGORY_REQUIRED");
    }
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
          UPDATE provider_offering_submissions
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
          UPDATE provider_offering_submissions
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
