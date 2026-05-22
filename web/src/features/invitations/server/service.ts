import "server-only";

import type { Offering } from "@/features/offerings/types";
import { query } from "@/lib/database";
import { slugify } from "@/lib/utils";
import {
  getInvitationTemplateDefaults,
  getInvitationTemplateFields,
} from "@/features/invitations/templates/registry";
import { ensureBuilderDocument } from "@/features/invitations/builder/utils";
import type { InvitationSite, InvitationStatus, InvitationType } from "@/features/invitations/types";

const BUILDER_KEY = "freeform_sections";

type InvitationRow = {
  id: string;
  user_id: string;
  offering_id: string | null;
  offering_name: string | null;
  offering_thumbnail_url: string | null;
  title: string;
  slug: string;
  site_type: InvitationType;
  template_key: string;
  status: InvitationStatus;
  custom_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapInvitationRow(row: InvitationRow): InvitationSite {
  return {
    id: row.id,
    userId: row.user_id,
    offeringId: row.offering_id ?? undefined,
    offeringName: row.offering_name ?? undefined,
    offeringThumbnailUrl: row.offering_thumbnail_url ?? undefined,
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

async function ensureUniqueInvitationSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || "thiep-cuoi";

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index}`;
    const result = await query<{ id: string }>(
      `
        SELECT id
        FROM wedding_sites
        WHERE slug = $1
          AND ($2::text IS NULL OR id::text <> $2::text)
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

export async function listInvitationsForUser(userId: string): Promise<InvitationSite[]> {
  const result = await query<InvitationRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.offering_id,
        p.name AS offering_name,
        p.thumbnail_url AS offering_thumbnail_url,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN offerings p ON p.id = ws.offering_id
      WHERE ws.user_id = $1
      ORDER BY ws.updated_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapInvitationRow);
}

export async function getInvitationByIdForUser(userId: string, siteId: string): Promise<InvitationSite | null> {
  const result = await query<InvitationRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.offering_id,
        p.name AS offering_name,
        p.thumbnail_url AS offering_thumbnail_url,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN offerings p ON p.id = ws.offering_id
      WHERE ws.id = $1
        AND ws.user_id = $2
      LIMIT 1
    `,
    [siteId, userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapInvitationRow(result.rows[0]);
}

export async function getInvitationById(siteId: string): Promise<InvitationSite | null> {
  const result = await query<InvitationRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.offering_id,
        p.name AS offering_name,
        p.thumbnail_url AS offering_thumbnail_url,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN offerings p ON p.id = ws.offering_id
      WHERE ws.id = $1
      LIMIT 1
    `,
    [siteId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapInvitationRow(result.rows[0]);
}

export async function getPublicInvitationBySlug(slug: string): Promise<InvitationSite | null> {
  const result = await query<InvitationRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.offering_id,
        p.name AS offering_name,
        p.thumbnail_url AS offering_thumbnail_url,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN offerings p ON p.id = ws.offering_id
      WHERE ws.slug = $1
      LIMIT 1
    `,
    [slug]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapInvitationRow(result.rows[0]);
}

export async function listPublishedInvitations(): Promise<InvitationSite[]> {
  const result = await query<InvitationRow>(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.offering_id,
        p.name AS offering_name,
        p.thumbnail_url AS offering_thumbnail_url,
        ws.title,
        ws.slug,
        ws.site_type,
        ws.template_key,
        ws.status,
        ws.custom_data,
        ws.created_at,
        ws.updated_at
      FROM wedding_sites ws
      LEFT JOIN offerings p ON p.id = ws.offering_id
      WHERE ws.status = 'published'
      ORDER BY ws.updated_at DESC
    `
  );

  return result.rows.map(mapInvitationRow);
}

export async function createInvitationFromOffering(input: {
  userId: string;
  offering: Offering;
  title?: string;
  customData?: Record<string, unknown>;
}): Promise<InvitationSite> {
  if (input.offering.offeringType === "physical_product") {
    throw new Error("INVITATION_NOT_SUPPORTED_FOR_GENERAL_OFFERING");
  }

  const templateKey = input.offering.templateEngine === "builder"
    ? BUILDER_KEY
    : input.offering.templateKey;
  const defaults = {
    ...getInvitationTemplateDefaults(templateKey),
    ...((input.offering.config.siteDefaults as Record<string, unknown> | undefined) ?? {}),
    ...(input.offering.thumbnailUrl ? { previewImage: input.offering.thumbnailUrl } : {}),
    ...(input.customData ?? {}),
  };
  const title = input.title || input.offering.name;
  const slug = await ensureUniqueInvitationSlug(title);
  const siteType = input.offering.templateEngine === "builder" ? "editable" : "coded";

  const result = await query<InvitationRow>(
    `
      INSERT INTO wedding_sites (
        user_id, offering_id, title, slug, site_type, template_key, status, custom_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
      RETURNING
        id,
        user_id,
        offering_id,
        NULL::text AS offering_name,
        NULL::text AS offering_thumbnail_url,
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
      input.offering.id,
      title,
      slug,
      siteType,
      templateKey,
      defaults,
    ]
  );

  return mapInvitationRow(result.rows[0]);
}

export async function createBuilderInvitation(userId: string): Promise<InvitationSite> {
  const title = "Thiệp cưới tự tạo";
  const slug = await ensureUniqueInvitationSlug(title);
  const defaults = getInvitationTemplateDefaults(BUILDER_KEY);

  const result = await query<InvitationRow>(
    `
      INSERT INTO wedding_sites (
        user_id, offering_id, title, slug, site_type, template_key, status, custom_data
      )
      VALUES ($1, NULL, $2, $3, 'editable', $4, 'draft', $5)
      RETURNING
        id,
        user_id,
        offering_id,
        NULL::text AS offering_name,
        NULL::text AS offering_thumbnail_url,
        title,
        slug,
        site_type,
        template_key,
        status,
        custom_data,
        created_at,
        updated_at
    `,
    [userId, title, slug, BUILDER_KEY, defaults]
  );

  return mapInvitationRow(result.rows[0]);
}

function normalizeTemplateFieldValue(field: {
  name: string;
  type: "text" | "textarea" | "media" | "wysiwyg" | "switch" | "checkbox" | "offering-select";
  multiple?: boolean;
}, formData: FormData) {
  if (field.type === "media" && field.multiple) {
    return formData
      .getAll(field.name)
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  if (field.type === "switch" || field.type === "checkbox") {
    return formData.get(field.name) === "on";
  }

  return String(formData.get(field.name) ?? "");
}

export async function updateInvitationForUser(input: {
  userId: string;
  siteId: string;
  title: string;
  slug: string;
  status: InvitationStatus;
  customData: Record<string, unknown>;
}): Promise<InvitationSite | null> {
  const existing = await getInvitationByIdForUser(input.userId, input.siteId);
  if (!existing) {
    return null;
  }

  const safeSlug = await ensureUniqueInvitationSlug(input.slug || input.title, input.siteId);
  const result = await query<InvitationRow>(
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
        offering_id,
        NULL::text AS offering_name,
        NULL::text AS offering_thumbnail_url,
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

  return mapInvitationRow(result.rows[0]);
}

export function buildInvitationPayload(formData: FormData, templateKey: string) {
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

  for (const field of getInvitationTemplateFields(templateKey)) {
    if ("name" in field && field.type !== "repeater") {
      payload[field.name] = normalizeTemplateFieldValue(field, formData);
    }
  }

  return payload;
}
