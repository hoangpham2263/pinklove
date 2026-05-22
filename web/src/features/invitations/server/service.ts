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

const WEDDING_SITE_DATA_SELECT = `
  COALESCE(
    (
      SELECT section.content
      FROM wedding_site_sections section
      WHERE section.wedding_site_id = ws.id
        AND section.section_type = 'template_data'
      ORDER BY section.sort_order ASC, section.created_at ASC
      LIMIT 1
    ),
    
    '{}'::jsonb
  ) AS custom_data
`;

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

async function syncWeddingSiteRelationalData(siteId: string, customData: Record<string, unknown>) {
  await query("DELETE FROM wedding_site_sections WHERE wedding_site_id = $1 AND section_type = 'template_data'", [siteId]);
  await query(
    `
      INSERT INTO wedding_site_sections (
        wedding_site_id, section_type, title, sort_order, content, settings
      )
      VALUES ($1, 'template_data', 'Template data', 0, $2::jsonb, '{}'::jsonb)
    `,
    [siteId, customData]
  );

  await query("DELETE FROM wedding_site_events WHERE wedding_site_id = $1", [siteId]);
  const events = asArray(customData.events);
  for (let index = 0; index < events.length; index += 1) {
    const event = asRecord(events[index]);
    const title = String(event.title ?? event.name ?? "").trim();
    if (!title) {
      continue;
    }
    await query(
      `
        INSERT INTO wedding_site_events (
          wedding_site_id, title, starts_at, ends_at, venue_name, address, sort_order, metadata
        )
        VALUES ($1, $2, NULLIF($3, '')::timestamptz, NULLIF($4, '')::timestamptz, $5, $6, $7, $8::jsonb)
      `,
      [
        siteId,
        title,
        String(event.startsAt ?? event.starts_at ?? event.date ?? ""),
        String(event.endsAt ?? event.ends_at ?? ""),
        String(event.venueName ?? event.venue_name ?? event.venue ?? ""),
        String(event.address ?? ""),
        index,
        event,
      ]
    );
  }

  await query("DELETE FROM wedding_site_guests WHERE wedding_site_id = $1", [siteId]);
  const guests = asArray(customData.guests);
  for (let index = 0; index < guests.length; index += 1) {
    const guest = asRecord(guests[index]);
    const fullName = String(guest.fullName ?? guest.full_name ?? guest.name ?? "").trim();
    if (!fullName) {
      continue;
    }
    await query(
      `
        INSERT INTO wedding_site_guests (
          wedding_site_id, full_name, phone, email, group_name, invite_code, status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7, $8::jsonb)
      `,
      [
        siteId,
        fullName,
        String(guest.phone ?? ""),
        String(guest.email ?? ""),
        String(guest.groupName ?? guest.group_name ?? ""),
        String(guest.inviteCode ?? guest.invite_code ?? ""),
        String(guest.status ?? "invited"),
        guest,
      ]
    );
  }

  await query("DELETE FROM wedding_site_rsvps WHERE wedding_site_id = $1", [siteId]);
  const rsvps = asArray(customData.rsvps);
  for (let index = 0; index < rsvps.length; index += 1) {
    const rsvp = asRecord(rsvps[index]);
    await query(
      `
        INSERT INTO wedding_site_rsvps (
          wedding_site_id, attendee_name, attendee_count, response_status, message, responded_at, metadata
        )
        VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::timestamptz, $7::jsonb)
      `,
      [
        siteId,
        String(rsvp.attendeeName ?? rsvp.attendee_name ?? rsvp.name ?? ""),
        Math.max(1, Number(rsvp.attendeeCount ?? rsvp.attendee_count ?? 1)),
        String(rsvp.responseStatus ?? rsvp.response_status ?? "pending"),
        String(rsvp.message ?? ""),
        String(rsvp.respondedAt ?? rsvp.responded_at ?? ""),
        rsvp,
      ]
    );
  }

  await query("UPDATE wedding_sites SET custom_data = '{}'::jsonb WHERE id = $1", [siteId]);
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
        ${WEDDING_SITE_DATA_SELECT},
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
        ${WEDDING_SITE_DATA_SELECT},
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
        ${WEDDING_SITE_DATA_SELECT},
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
        ${WEDDING_SITE_DATA_SELECT},
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
        ${WEDDING_SITE_DATA_SELECT},
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
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', '{}'::jsonb)
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
        '{}'::jsonb AS custom_data,
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
    ]
  );

  await syncWeddingSiteRelationalData(result.rows[0].id, defaults);
  return { ...mapInvitationRow(result.rows[0]), customData: defaults };
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
      VALUES ($1, NULL, $2, $3, 'editable', $4, 'draft', '{}'::jsonb)
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
        '{}'::jsonb AS custom_data,
        created_at,
        updated_at
    `,
    [userId, title, slug, BUILDER_KEY]
  );

  await syncWeddingSiteRelationalData(result.rows[0].id, defaults);
  return { ...mapInvitationRow(result.rows[0]), customData: defaults };
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
        custom_data = '{}'::jsonb,
        updated_at = NOW()
      WHERE id = $4
        AND user_id = $5
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
        '{}'::jsonb AS custom_data,
        created_at,
        updated_at
    `,
    [input.title.trim() || existing.title, safeSlug, input.status, input.siteId, input.userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  await syncWeddingSiteRelationalData(result.rows[0].id, input.customData);
  return { ...mapInvitationRow(result.rows[0]), customData: input.customData };
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
