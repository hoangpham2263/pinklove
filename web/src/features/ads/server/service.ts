import "server-only";

import { query } from "@/lib/database";

type OptionRow = {
  id: string;
  label: string;
};

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toNullableString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function toNullableDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function toBoolean(value: FormDataEntryValue | null, defaultValue = false) {
  if (value === null) return defaultValue;
  return String(value) === "true" || String(value) === "on";
}

function toStringList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function listAdvertisers() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        id,
        name,
        COALESCE(contact_name, '') AS contact_name,
        COALESCE(contact_email, '') AS contact_email,
        COALESCE(contact_phone, '') AS contact_phone,
        COALESCE(website_url, '') AS website_url,
        status,
        COALESCE(notes, '') AS notes,
        updated_at::text AS updated_at
      FROM advertisers
      ORDER BY updated_at DESC
    `
  );
  return result.rows;
}

export async function getAdvertiserById(id: string) {
  const rows = await listAdvertisers();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listAdPlacements() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        id,
        key,
        label,
        placement_type,
        surface,
        COALESCE(description, '') AS description,
        max_items,
        is_active,
        metadata,
        COALESCE(metadata->>'displayMode', placement_type) AS display_mode,
        COALESCE(metadata->>'position', '') AS position,
        COALESCE(metadata->>'targetPages', '') AS target_pages,
        updated_at::text AS updated_at
      FROM ad_placements
      ORDER BY surface, key
    `
  );
  return result.rows;
}

export async function getAdPlacementById(id: string) {
  const rows = await listAdPlacements();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listAdCreatives() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        creative.id,
        COALESCE(creative.advertiser_id, '') AS advertiser_id,
        creative.title,
        COALESCE(advertiser.name, 'PinkLove') AS advertiser,
        creative.creative_type,
        creative.status,
        creative.image_url,
        COALESCE(creative.mobile_image_url, '') AS mobile_image_url,
        COALESCE(creative.target_url, '') AS target_url,
        COALESCE(creative.alt_text, '') AS alt_text,
        COALESCE(creative.headline, '') AS headline,
        COALESCE(creative.body, '') AS body,
        COALESCE(creative.cta_label, '') AS cta_label,
        creative.metadata,
        COALESCE(creative.metadata->>'badgeLabel', '') AS badge_label,
        creative.updated_at::text AS updated_at
      FROM ad_creatives creative
      LEFT JOIN advertisers advertiser ON advertiser.id = creative.advertiser_id
      ORDER BY creative.updated_at DESC
    `
  );
  return result.rows;
}

export async function getAdCreativeById(id: string) {
  const rows = await listAdCreatives();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listAdCampaigns() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        campaign.id,
        campaign.advertiser_id,
        campaign.placement_id,
        COALESCE(campaign.creative_id, '') AS creative_id,
        campaign.name,
        advertiser.name AS advertiser,
        placement.key AS placement,
        COALESCE(creative.title, '') AS creative,
        campaign.status,
        campaign.payment_status,
        campaign.price::text AS price,
        COALESCE(campaign.starts_at::text, '') AS starts_at,
        COALESCE(campaign.ends_at::text, '') AS ends_at,
        COALESCE(campaign.target_url, '') AS target_url,
        COALESCE(campaign.notes, '') AS notes,
        campaign.metadata,
        COALESCE(campaign.metadata->>'priority', '0') AS priority,
        COALESCE(campaign.metadata->>'isSponsored', 'false') AS is_sponsored,
        COUNT(event.id) FILTER (WHERE event.event_type = 'impression')::int AS impressions,
        COUNT(event.id) FILTER (WHERE event.event_type = 'click')::int AS clicks
      FROM ad_campaigns campaign
      INNER JOIN advertisers advertiser ON advertiser.id = campaign.advertiser_id
      INNER JOIN ad_placements placement ON placement.id = campaign.placement_id
      LEFT JOIN ad_creatives creative ON creative.id = campaign.creative_id
      LEFT JOIN ad_events event ON event.campaign_id = campaign.id
      GROUP BY campaign.id, advertiser.name, placement.key, creative.title
      ORDER BY campaign.updated_at DESC
    `
  );
  return result.rows;
}

export async function getAdCampaignById(id: string) {
  const rows = await listAdCampaigns();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listProviderPromotionPlans() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        plan.id,
        plan.key,
        plan.name,
        COALESCE(plan.description, '') AS description,
        COALESCE(plan.placement_id, '') AS placement_id,
        COALESCE(placement.key, '') AS placement,
        plan.price::text AS price,
        plan.duration_days,
        plan.priority_weight,
        plan.is_active,
        plan.updated_at::text AS updated_at
      FROM provider_promotion_plans plan
      LEFT JOIN ad_placements placement ON placement.id = plan.placement_id
      ORDER BY plan.priority_weight DESC, plan.name
    `
  );
  return result.rows;
}

export async function getProviderPromotionPlanById(id: string) {
  const rows = await listProviderPromotionPlans();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listProviderPromotionsForAdmin() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        promotion.id,
        promotion.provider_id,
        COALESCE(promotion.plan_id, '') AS plan_id,
        COALESCE(promotion.placement_id, '') AS placement_id,
        promotion.title,
        provider.display_name AS provider,
        COALESCE(plan.name, '') AS plan,
        COALESCE(placement.key, '') AS placement,
        promotion.target_type,
        COALESCE(promotion.target_id, '') AS target_id,
        promotion.status,
        promotion.payment_status,
        promotion.priority_weight,
        promotion.price::text AS price,
        COALESCE(promotion.starts_at::text, '') AS starts_at,
        COALESCE(promotion.ends_at::text, '') AS ends_at,
        COALESCE(promotion.admin_notes, '') AS admin_notes,
        COUNT(event.id) FILTER (WHERE event.event_type = 'impression')::int AS impressions,
        COUNT(event.id) FILTER (WHERE event.event_type = 'click')::int AS clicks,
        COUNT(event.id) FILTER (WHERE event.event_type = 'lead')::int AS leads,
        COUNT(event.id) FILTER (WHERE event.event_type = 'booking')::int AS bookings
      FROM provider_promotions promotion
      INNER JOIN providers provider ON provider.id = promotion.provider_id
      LEFT JOIN provider_promotion_plans plan ON plan.id = promotion.plan_id
      LEFT JOIN ad_placements placement ON placement.id = promotion.placement_id
      LEFT JOIN provider_promotion_events event ON event.promotion_id = promotion.id
      GROUP BY promotion.id, provider.display_name, plan.name, placement.key
      ORDER BY promotion.updated_at DESC
    `
  );
  return result.rows;
}

export async function getProviderPromotionById(id: string) {
  const rows = await listProviderPromotionsForAdmin();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listProviderPromotionsForUser(userId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        promotion.id,
        promotion.title,
        COALESCE(plan.name, '') AS plan,
        COALESCE(placement.label, '') AS placement,
        promotion.target_type,
        promotion.status,
        promotion.payment_status,
        promotion.priority_weight,
        promotion.price::text AS price,
        COALESCE(promotion.starts_at::text, '') AS starts_at,
        COALESCE(promotion.ends_at::text, '') AS ends_at,
        COUNT(event.id) FILTER (WHERE event.event_type = 'impression')::int AS impressions,
        COUNT(event.id) FILTER (WHERE event.event_type = 'click')::int AS clicks,
        COUNT(event.id) FILTER (WHERE event.event_type = 'lead')::int AS leads,
        COUNT(event.id) FILTER (WHERE event.event_type = 'booking')::int AS bookings
      FROM provider_promotions promotion
      INNER JOIN providers provider ON provider.id = promotion.provider_id
      LEFT JOIN provider_promotion_plans plan ON plan.id = promotion.plan_id
      LEFT JOIN ad_placements placement ON placement.id = promotion.placement_id
      LEFT JOIN provider_promotion_events event ON event.promotion_id = promotion.id
      WHERE provider.owner_user_id = $1
      GROUP BY promotion.id, plan.name, placement.label
      ORDER BY promotion.updated_at DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function listAdvertiserOptions(): Promise<OptionRow[]> {
  const result = await query<OptionRow>("SELECT id, name AS label FROM advertisers WHERE status <> 'archived' ORDER BY name");
  return result.rows;
}

export async function listPlacementOptions(): Promise<OptionRow[]> {
  const result = await query<OptionRow>("SELECT id, label || ' (' || key || ')' AS label FROM ad_placements WHERE is_active = TRUE ORDER BY surface, key");
  return result.rows;
}

export async function listCreativeOptions(): Promise<OptionRow[]> {
  const result = await query<OptionRow>("SELECT id, title AS label FROM ad_creatives WHERE status IN ('draft', 'pending', 'approved') ORDER BY title");
  return result.rows;
}

export async function listProviderOptions(): Promise<OptionRow[]> {
  const result = await query<OptionRow>("SELECT id, display_name AS label FROM providers WHERE status <> 'archived' ORDER BY display_name");
  return result.rows;
}

export async function listProviderPromotionPlanOptions(): Promise<OptionRow[]> {
  const result = await query<OptionRow>("SELECT id, name AS label FROM provider_promotion_plans WHERE is_active = TRUE ORDER BY priority_weight DESC, name");
  return result.rows;
}

export async function listActiveAdsForPlacement(placementKey: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        campaign.id,
        campaign.name,
        campaign.placement_id,
        placement.key AS placement_key,
        creative.title AS creative_title,
        placement.placement_type,
        placement.max_items,
        placement.metadata AS placement_metadata,
        campaign.metadata AS campaign_metadata,
        creative.metadata AS creative_metadata,
        creative.image_url,
        COALESCE(creative.mobile_image_url, '') AS mobile_image_url,
        COALESCE(campaign.target_url, creative.target_url, '') AS target_url,
        COALESCE(creative.alt_text, campaign.name) AS alt_text,
        COALESCE(creative.headline, '') AS headline,
        COALESCE(creative.body, '') AS body,
        COALESCE(creative.cta_label, '') AS cta_label
      FROM ad_campaigns campaign
      INNER JOIN ad_placements placement ON placement.id = campaign.placement_id
      INNER JOIN ad_creatives creative ON creative.id = campaign.creative_id
      WHERE placement.key = $1
        AND placement.is_active = TRUE
        AND campaign.status = 'active'
        AND campaign.payment_status IN ('paid', 'waived')
        AND creative.status = 'approved'
        AND (campaign.starts_at IS NULL OR campaign.starts_at <= NOW())
        AND (campaign.ends_at IS NULL OR campaign.ends_at >= NOW())
      ORDER BY campaign.updated_at DESC
      LIMIT COALESCE((SELECT max_items FROM ad_placements WHERE key = $1 LIMIT 1), 1)
    `,
    [placementKey]
  );
  return result.rows;
}

export async function listActiveAdsForPlacements(placementKeys: string[]) {
  const normalizedKeys = Array.from(new Set(placementKeys.map((key) => key.trim()).filter(Boolean)));
  if (!normalizedKeys.length) return [];

  const result = await query<Record<string, unknown>>(
    `
      WITH eligible AS (
        SELECT
          campaign.id,
          campaign.name,
          campaign.placement_id,
          placement.key AS placement_key,
          placement.placement_type,
          placement.max_items,
          placement.metadata AS placement_metadata,
          campaign.metadata AS campaign_metadata,
          creative.metadata AS creative_metadata,
          creative.title AS creative_title,
          creative.image_url,
          COALESCE(creative.mobile_image_url, '') AS mobile_image_url,
          COALESCE(campaign.target_url, creative.target_url, '') AS target_url,
          COALESCE(creative.alt_text, campaign.name) AS alt_text,
          COALESCE(creative.headline, '') AS headline,
          COALESCE(creative.body, '') AS body,
          COALESCE(creative.cta_label, '') AS cta_label,
          ROW_NUMBER() OVER (
            PARTITION BY placement.id
            ORDER BY COALESCE(NULLIF(campaign.metadata->>'priority', '')::int, 0) DESC, campaign.updated_at DESC
          ) AS placement_rank
        FROM ad_campaigns campaign
        INNER JOIN ad_placements placement ON placement.id = campaign.placement_id
        INNER JOIN ad_creatives creative ON creative.id = campaign.creative_id
        WHERE placement.key = ANY($1)
          AND placement.is_active = TRUE
          AND campaign.status = 'active'
          AND campaign.payment_status IN ('paid', 'waived')
          AND creative.status = 'approved'
          AND (campaign.starts_at IS NULL OR campaign.starts_at <= NOW())
          AND (campaign.ends_at IS NULL OR campaign.ends_at >= NOW())
      )
      SELECT *
      FROM eligible
      WHERE placement_rank <= max_items
      ORDER BY placement_key, placement_rank
    `,
    [normalizedKeys]
  );
  return result.rows;
}

export async function listActiveProviderPromotions(input: {
  placementKey?: string;
  targetType?: string;
  targetId?: string;
  limit?: number;
}) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        promotion.id,
        promotion.provider_id,
        provider.display_name AS provider,
        promotion.title,
        promotion.target_type,
        COALESCE(promotion.target_id, '') AS target_id,
        COALESCE(placement.key, '') AS placement_key,
        promotion.priority_weight,
        COALESCE(plan.name, '') AS plan
      FROM provider_promotions promotion
      INNER JOIN providers provider ON provider.id = promotion.provider_id
      LEFT JOIN provider_promotion_plans plan ON plan.id = promotion.plan_id
      LEFT JOIN ad_placements placement ON placement.id = promotion.placement_id
      WHERE promotion.status = 'active'
        AND promotion.payment_status IN ('paid', 'waived')
        AND (promotion.starts_at IS NULL OR promotion.starts_at <= NOW())
        AND (promotion.ends_at IS NULL OR promotion.ends_at >= NOW())
        AND ($1::text IS NULL OR placement.key = $1)
        AND ($2::text IS NULL OR promotion.target_type = $2)
        AND ($3::text IS NULL OR promotion.target_id = $3 OR promotion.target_id IS NULL)
      ORDER BY promotion.priority_weight DESC, promotion.updated_at DESC
      LIMIT $4
    `,
    [
      input.placementKey ?? null,
      input.targetType ?? null,
      input.targetId ?? null,
      Math.max(1, input.limit ?? 10),
    ]
  );
  return result.rows;
}

export async function createProviderPromotionRequestForUser(userId: string, formData: FormData) {
  const providerResult = await query<{ id: string; display_name: string }>(
    `
      SELECT id, display_name
      FROM providers
      WHERE owner_user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [userId]
  );
  const provider = providerResult.rows[0];
  if (!provider) throw new Error("PROVIDER_NOT_FOUND");

  const title = String(formData.get("title") ?? "").trim() || `Yêu cầu ưu tiên - ${provider.display_name}`;

  await query(
    `
      INSERT INTO provider_promotions (
        provider_id, plan_id, placement_id, target_type, target_id, title, status,
        payment_status, priority_weight, price, admin_notes
      )
      VALUES ($1, $2, $3, 'provider', $1, $4, 'pending', 'unpaid', 0, 0, $5)
    `,
    [
      provider.id,
      toNullableString(formData.get("planId")),
      toNullableString(formData.get("placementId")),
      title,
      toNullableString(formData.get("notes")),
    ]
  );
}

export async function trackAdEvent(input: {
  campaignId: string;
  placementId?: string;
  eventType: "impression" | "click" | "lead" | "booking" | "conversion";
  userId?: string;
  sessionId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await query(
    `
      INSERT INTO ad_events (campaign_id, placement_id, event_type, user_id, session_id, target_type, target_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [
      input.campaignId,
      input.placementId ?? null,
      input.eventType,
      input.userId ?? null,
      input.sessionId ?? null,
      input.targetType ?? null,
      input.targetId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

export async function trackProviderPromotionEvent(input: {
  promotionId: string;
  providerId?: string;
  eventType: "impression" | "click" | "lead" | "booking" | "conversion";
  userId?: string;
  sessionId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await query(
    `
      INSERT INTO provider_promotion_events (promotion_id, provider_id, event_type, user_id, session_id, target_type, target_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [
      input.promotionId,
      input.providerId ?? null,
      input.eventType,
      input.userId ?? null,
      input.sessionId ?? null,
      input.targetType ?? null,
      input.targetId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

export async function createAdvertiser(formData: FormData) {
  const intent = String(formData.get("intent") ?? "create");
  const id = String(formData.get("id") ?? "").trim();
  if (intent === "archive" && id) {
    await query("UPDATE advertisers SET status = 'archived', updated_at = NOW() WHERE id = $1", [id]);
    return;
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("ADVERTISER_NAME_REQUIRED");
  if (intent === "update" && id) {
    await query(
      `
        UPDATE advertisers
        SET name = $2, contact_name = $3, contact_email = $4, contact_phone = $5,
            website_url = $6, status = $7, notes = $8, updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        name,
        toNullableString(formData.get("contactName")),
        toNullableString(formData.get("contactEmail")),
        toNullableString(formData.get("contactPhone")),
        toNullableString(formData.get("websiteUrl")),
        String(formData.get("status") ?? "active"),
        toNullableString(formData.get("notes")),
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO advertisers (name, contact_name, contact_email, contact_phone, website_url, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      name,
      toNullableString(formData.get("contactName")),
      toNullableString(formData.get("contactEmail")),
      toNullableString(formData.get("contactPhone")),
      toNullableString(formData.get("websiteUrl")),
      String(formData.get("status") ?? "active"),
      toNullableString(formData.get("notes")),
    ]
  );
}

export async function createAdPlacement(formData: FormData) {
  const intent = String(formData.get("intent") ?? "create");
  const id = String(formData.get("id") ?? "").trim();
  if (intent === "archive" && id) {
    await query("UPDATE ad_placements SET is_active = FALSE, updated_at = NOW() WHERE id = $1", [id]);
    return;
  }

  const key = String(formData.get("key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!key || !label) throw new Error("PLACEMENT_REQUIRED");

  const displayMode = String(formData.get("displayMode") ?? formData.get("placementType") ?? "banner");
  const metadata = {
    displayMode,
    position: String(formData.get("position") ?? "").trim() || undefined,
    globalEnabled: toBoolean(formData.get("globalEnabled"), false),
    showDelayMs: Math.max(0, toNumber(formData.get("showDelayMs") ?? 0)),
    dismissMode: String(formData.get("dismissMode") ?? "session"),
    dismissTtlHours: Math.max(0, toNumber(formData.get("dismissTtlHours") ?? 24)),
    pageRules: {
      include: toStringList(formData.get("includeRules")),
      exclude: toStringList(formData.get("excludeRules")),
    },
    targetPages: toStringList(formData.get("targetPages")),
    deviceRules: String(formData.get("deviceRules") ?? "all"),
    defaultPageBehavior: displayMode === "modal" || displayMode === "floating" ? "none" : "global_if_enabled",
  };

  if (intent === "update" && id) {
    await query(
      `
        UPDATE ad_placements
        SET key = $2, label = $3, placement_type = $4, surface = $5, description = $6,
            max_items = $7, is_active = $8, metadata = $9::jsonb, updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        key,
        label,
        String(formData.get("placementType") ?? "banner"),
        String(formData.get("surface") ?? "website"),
        toNullableString(formData.get("description")),
        Math.max(1, toNumber(formData.get("maxItems") ?? 1)),
        formData.get("isActive") !== "false",
        JSON.stringify(metadata),
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO ad_placements (key, label, placement_type, surface, description, max_items, is_active, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      ON CONFLICT (key) DO UPDATE
      SET
        label = EXCLUDED.label,
        placement_type = EXCLUDED.placement_type,
        surface = EXCLUDED.surface,
        description = EXCLUDED.description,
        max_items = EXCLUDED.max_items,
        is_active = EXCLUDED.is_active,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `,
    [
      key,
      label,
      String(formData.get("placementType") ?? "banner"),
      String(formData.get("surface") ?? "website"),
      toNullableString(formData.get("description")),
      Math.max(1, toNumber(formData.get("maxItems") ?? 1)),
      formData.get("isActive") !== "false",
      JSON.stringify(metadata),
    ]
  );
}

export async function createAdCreative(formData: FormData) {
  const intent = String(formData.get("intent") ?? "create");
  const id = String(formData.get("id") ?? "").trim();
  if (intent === "archive" && id) {
    await query("UPDATE ad_creatives SET status = 'archived', updated_at = NOW() WHERE id = $1", [id]);
    return;
  }

  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!title || !imageUrl) throw new Error("CREATIVE_REQUIRED");
  const metadata = {
    layout: String(formData.get("layout") ?? "image_text"),
    badgeLabel: String(formData.get("badgeLabel") ?? "").trim(),
  };

  if (intent === "update" && id) {
    await query(
      `
        UPDATE ad_creatives
        SET advertiser_id = $2, title = $3, creative_type = $4, image_url = $5,
            mobile_image_url = $6, target_url = $7, alt_text = $8, headline = $9,
            body = $10, cta_label = $11, status = $12, metadata = $13::jsonb,
            updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        toNullableString(formData.get("advertiserId")),
        title,
        String(formData.get("creativeType") ?? "image"),
        imageUrl,
        toNullableString(formData.get("mobileImageUrl")),
        toNullableString(formData.get("targetUrl")),
        toNullableString(formData.get("altText")),
        toNullableString(formData.get("headline")),
        toNullableString(formData.get("body")),
        toNullableString(formData.get("ctaLabel")),
        String(formData.get("status") ?? "draft"),
        JSON.stringify(metadata),
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO ad_creatives (
        advertiser_id, title, creative_type, image_url, mobile_image_url, target_url,
        alt_text, headline, body, cta_label, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
    `,
    [
      toNullableString(formData.get("advertiserId")),
      title,
      String(formData.get("creativeType") ?? "image"),
      imageUrl,
      toNullableString(formData.get("mobileImageUrl")),
      toNullableString(formData.get("targetUrl")),
      toNullableString(formData.get("altText")),
      toNullableString(formData.get("headline")),
      toNullableString(formData.get("body")),
      toNullableString(formData.get("ctaLabel")),
      String(formData.get("status") ?? "draft"),
      JSON.stringify(metadata),
    ]
  );
}

export async function createAdCampaign(formData: FormData) {
  const intent = String(formData.get("intent") ?? "create");
  const id = String(formData.get("id") ?? "").trim();
  if (intent === "archive" && id) {
    await query("UPDATE ad_campaigns SET status = 'archived', updated_at = NOW() WHERE id = $1", [id]);
    return;
  }

  const name = String(formData.get("name") ?? "").trim();
  const advertiserId = String(formData.get("advertiserId") ?? "").trim();
  const placementId = String(formData.get("placementId") ?? "").trim();
  if (!name || !advertiserId || !placementId) throw new Error("AD_CAMPAIGN_REQUIRED");
  const metadata = {
    priority: Math.max(0, toNumber(formData.get("priority") ?? 0)),
    isDismissible: formData.get("isDismissible") !== "false",
    showCloseButton: formData.get("showCloseButton") !== "false",
    theme: String(formData.get("theme") ?? "default"),
    isSponsored: toBoolean(formData.get("isSponsored"), true),
  };

  if (intent === "update" && id) {
    await query(
      `
        UPDATE ad_campaigns
        SET advertiser_id = $2, placement_id = $3, creative_id = $4, name = $5,
            target_url = $6, status = $7, payment_status = $8, price = $9,
            starts_at = $10::timestamptz, ends_at = $11::timestamptz,
            notes = $12, metadata = $13::jsonb, updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        advertiserId,
        placementId,
        toNullableString(formData.get("creativeId")),
        name,
        toNullableString(formData.get("targetUrl")),
        String(formData.get("status") ?? "draft"),
        String(formData.get("paymentStatus") ?? "unpaid"),
        Math.max(0, toNumber(formData.get("price"))),
        toNullableDate(formData.get("startsAt")),
        toNullableDate(formData.get("endsAt")),
        toNullableString(formData.get("notes")),
        JSON.stringify(metadata),
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO ad_campaigns (
        advertiser_id, placement_id, creative_id, name, target_url, status,
        payment_status, price, starts_at, ends_at, notes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11, $12::jsonb)
    `,
    [
      advertiserId,
      placementId,
      toNullableString(formData.get("creativeId")),
      name,
      toNullableString(formData.get("targetUrl")),
      String(formData.get("status") ?? "draft"),
      String(formData.get("paymentStatus") ?? "unpaid"),
      Math.max(0, toNumber(formData.get("price"))),
      toNullableDate(formData.get("startsAt")),
      toNullableDate(formData.get("endsAt")),
      toNullableString(formData.get("notes")),
      JSON.stringify(metadata),
    ]
  );
}

export async function createProviderPromotionPlan(formData: FormData) {
  const intent = String(formData.get("intent") ?? "create");
  const id = String(formData.get("id") ?? "").trim();
  if (intent === "archive" && id) {
    await query("UPDATE provider_promotion_plans SET is_active = FALSE, updated_at = NOW() WHERE id = $1", [id]);
    return;
  }

  const key = String(formData.get("key") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!key || !name) throw new Error("PROMOTION_PLAN_REQUIRED");
  if (intent === "update" && id) {
    await query(
      `
        UPDATE provider_promotion_plans
        SET key = $2, name = $3, description = $4, placement_id = $5,
            price = $6, duration_days = $7, priority_weight = $8,
            is_active = $9, updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        key,
        name,
        toNullableString(formData.get("description")),
        toNullableString(formData.get("placementId")),
        Math.max(0, toNumber(formData.get("price"))),
        Math.max(1, toNumber(formData.get("durationDays") ?? 30)),
        Math.max(0, toNumber(formData.get("priorityWeight") ?? 100)),
        formData.get("isActive") !== "false",
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO provider_promotion_plans (
        key, name, description, placement_id, price, duration_days, priority_weight, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (key) DO UPDATE
      SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        placement_id = EXCLUDED.placement_id,
        price = EXCLUDED.price,
        duration_days = EXCLUDED.duration_days,
        priority_weight = EXCLUDED.priority_weight,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `,
    [
      key,
      name,
      toNullableString(formData.get("description")),
      toNullableString(formData.get("placementId")),
      Math.max(0, toNumber(formData.get("price"))),
      Math.max(1, toNumber(formData.get("durationDays") ?? 30)),
      Math.max(0, toNumber(formData.get("priorityWeight") ?? 100)),
      formData.get("isActive") !== "false",
    ]
  );
}

export async function createProviderPromotion(formData: FormData) {
  const intent = String(formData.get("intent") ?? "create");
  const id = String(formData.get("id") ?? "").trim();
  if (intent === "archive" && id) {
    await query("UPDATE provider_promotions SET status = 'archived', updated_at = NOW() WHERE id = $1", [id]);
    return;
  }

  const providerId = String(formData.get("providerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!providerId || !title) throw new Error("PROVIDER_PROMOTION_REQUIRED");
  if (intent === "update" && id) {
    await query(
      `
        UPDATE provider_promotions
        SET provider_id = $2, plan_id = $3, placement_id = $4, target_type = $5,
            target_id = $6, title = $7, status = $8, payment_status = $9,
            priority_weight = $10, price = $11, starts_at = $12::timestamptz,
            ends_at = $13::timestamptz, admin_notes = $14, updated_at = NOW()
        WHERE id = $1
      `,
      [
        id,
        providerId,
        toNullableString(formData.get("planId")),
        toNullableString(formData.get("placementId")),
        String(formData.get("targetType") ?? "provider"),
        toNullableString(formData.get("targetId")),
        title,
        String(formData.get("status") ?? "pending"),
        String(formData.get("paymentStatus") ?? "unpaid"),
        Math.max(0, toNumber(formData.get("priorityWeight") ?? 100)),
        Math.max(0, toNumber(formData.get("price"))),
        toNullableDate(formData.get("startsAt")),
        toNullableDate(formData.get("endsAt")),
        toNullableString(formData.get("adminNotes")),
      ]
    );
    return;
  }

  await query(
    `
      INSERT INTO provider_promotions (
        provider_id, plan_id, placement_id, target_type, target_id, title, status,
        payment_status, priority_weight, price, starts_at, ends_at, admin_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12::timestamptz, $13)
    `,
    [
      providerId,
      toNullableString(formData.get("planId")),
      toNullableString(formData.get("placementId")),
      String(formData.get("targetType") ?? "provider"),
      toNullableString(formData.get("targetId")),
      title,
      String(formData.get("status") ?? "pending"),
      String(formData.get("paymentStatus") ?? "unpaid"),
      Math.max(0, toNumber(formData.get("priorityWeight") ?? 100)),
      Math.max(0, toNumber(formData.get("price"))),
      toNullableDate(formData.get("startsAt")),
      toNullableDate(formData.get("endsAt")),
      toNullableString(formData.get("adminNotes")),
    ]
  );
}
