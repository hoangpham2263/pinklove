import "server-only";

import type { Product } from "@/features/products/types";
import { query } from "@/lib/db";
import { slugify } from "@/lib/utils";
import {
  getWeddingTemplateDefaults,
  getWeddingTemplateFields,
} from "@/features/sites/templates";
import { ensureBuilderDocument } from "@/features/sites/builder/utils";
import type { WeddingSite, WeddingSiteStatus, WeddingSiteType } from "@/features/sites/types";

type WeddingSiteRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string | null;
  title: string;
  slug: string;
  site_type: WeddingSiteType;
  template_key: string;
  status: WeddingSiteStatus;
  custom_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapWeddingSiteRow(row: WeddingSiteRow): WeddingSite {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id ?? undefined,
    productName: row.product_name ?? undefined,
    title: row.title,
    slug: row.slug,
    siteType: row.site_type,
    templateKey: row.template_key,
    status: row.status,
    customData: row.custom_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureUniqueWeddingSiteSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "thiep-cuoi";

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index}`;
    const result = await query<{ id: string }>(
      `
        SELECT id
        FROM wedding_sites
        WHERE slug = $1
          AND ($2::text IS NULL OR id <> $2)
        LIMIT 1
      `,
      [candidate, ignoreId ?? null]
    );

    if (!result.rows[0]) {
      return candidate;
    }
  }

  return `${root}-${Date.now()}`;
}

export async function listWeddingSitesForUser(userId: string): Promise<WeddingSite[]> {
  const result = await query<WeddingSiteRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.product_id,
        p.name AS product_name,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN products p ON p.id = ws.product_id
      WHERE ws.user_id = $1
      ORDER BY ws.updated_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapWeddingSiteRow);
}

export async function getWeddingSiteByIdForUser(userId: string, siteId: string): Promise<WeddingSite | null> {
  const result = await query<WeddingSiteRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.product_id,
        p.name AS product_name,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN products p ON p.id = ws.product_id
      WHERE ws.id = $1
        AND ws.user_id = $2
      LIMIT 1
    `,
    [siteId, userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapWeddingSiteRow(result.rows[0]);
}

export async function getWeddingSiteById(siteId: string): Promise<WeddingSite | null> {
  const result = await query<WeddingSiteRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.product_id,
        p.name AS product_name,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN products p ON p.id = ws.product_id
      WHERE ws.id = $1
      LIMIT 1
    `,
    [siteId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapWeddingSiteRow(result.rows[0]);
}

export async function getPublicWeddingSiteBySlug(slug: string): Promise<WeddingSite | null> {
  const result = await query<WeddingSiteRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.product_id,
        p.name AS product_name,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN products p ON p.id = ws.product_id
      WHERE ws.slug = $1
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapWeddingSiteRow(result.rows[0]);
}

export async function createWeddingSiteFromProduct(input: {
  userId: string;
  product: Product;
}): Promise<WeddingSite> {
  const defaults = {
    ...getWeddingTemplateDefaults(input.product.templateKey),
    ...((input.product.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
  };
  const title = input.product.name;
  const slug = await ensureUniqueWeddingSiteSlug(title);

  const result = await query<WeddingSiteRow>(
    `
      INSERT INTO wedding_sites (
        user_id, product_id, title, slug, site_type, template_key, status, custom_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
      RETURNING
        id,
        user_id,
        product_id,
        NULL::text AS product_name,
        title,
        slug,
        site_type,
        template_key,
        status,
        custom_data,
        created_at,
        updated_at
    `,
    [
      input.userId,
      input.product.id,
      title,
      slug,
      input.product.productType,
      input.product.templateKey,
      defaults,
    ]
  );

  return mapWeddingSiteRow(result.rows[0]);
}

export async function createBuilderWeddingSite(userId: string): Promise<WeddingSite> {
  const title = "Thiệp cưới tự tạo";
  const slug = await ensureUniqueWeddingSiteSlug(title);
  const defaults = getWeddingTemplateDefaults("freeform_sections");

  const result = await query<WeddingSiteRow>(
    `
      INSERT INTO wedding_sites (
        user_id, product_id, title, slug, site_type, template_key, status, custom_data
      )
      VALUES ($1, NULL, $2, $3, 'builder_template', 'freeform_sections', 'draft', $4)
      RETURNING
        id,
        user_id,
        product_id,
        NULL::text AS product_name,
        title,
        slug,
        site_type,
        template_key,
        status,
        custom_data,
        created_at,
        updated_at
    `,
    [userId, title, slug, defaults]
  );

  return mapWeddingSiteRow(result.rows[0]);
}

function parseGalleryInput(input: string) {
  return input
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTemplateFieldValue(name: string, value: FormDataEntryValue | null) {
  if (name === "gallery") {
    return parseGalleryInput(String(value ?? ""));
  }

  return String(value ?? "");
}

export async function updateWeddingSiteForUser(input: {
  userId: string;
  siteId: string;
  title: string;
  slug: string;
  status: WeddingSiteStatus;
  customData: Record<string, unknown>;
}): Promise<WeddingSite | null> {
  const existing = await getWeddingSiteByIdForUser(input.userId, input.siteId);
  if (!existing) {
    return null;
  }

  const safeSlug = await ensureUniqueWeddingSiteSlug(input.slug || input.title, input.siteId);
  const result = await query<WeddingSiteRow>(
    `
      UPDATE wedding_sites
      SET
        title = $1,
        slug = $2,
        status = $3,
        custom_data = $4,
        updated_at = NOW()
      WHERE id = $5
        AND user_id = $6
      RETURNING
        id,
        user_id,
        product_id,
        NULL::text AS product_name,
        title,
        slug,
        site_type,
        template_key,
        status,
        custom_data,
        created_at,
        updated_at
    `,
    [input.title.trim() || existing.title, safeSlug, input.status, input.customData, input.siteId, input.userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapWeddingSiteRow(result.rows[0]);
}

export function buildWeddingSitePayload(formData: FormData, templateKey: string) {
  if (templateKey === "freeform_sections") {
    try {
      return {
        builderDocument: ensureBuilderDocument(
          JSON.parse(
            String(
              formData.get("builderDocument") ??
              formData.get("builderCanvas") ??
              "{}"
            )
          )
        ),
      };
    } catch {
      return {
        builderDocument: ensureBuilderDocument(null),
      };
    }
  }

  const payload: Record<string, unknown> = {};

  for (const field of getWeddingTemplateFields(templateKey)) {
    payload[field.name] = normalizeTemplateFieldValue(field.name, formData.get(field.name));
  }

  return payload;
}
