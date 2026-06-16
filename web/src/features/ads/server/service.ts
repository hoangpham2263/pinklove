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
        updated_at::text AS updated_at
      FROM advertisers
      ORDER BY updated_at DESC
    `
  );
  return result.rows;
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
        max_items,
        is_active,
        updated_at::text AS updated_at
      FROM ad_placements
      ORDER BY surface, key
    `
  );
  return result.rows;
}

export async function listAdCreatives() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        creative.id,
        creative.title,
        COALESCE(advertiser.name, 'PinkLove') AS advertiser,
        creative.creative_type,
        creative.status,
        creative.image_url,
        COALESCE(creative.target_url, '') AS target_url,
        creative.updated_at::text AS updated_at
      FROM ad_creatives creative
      LEFT JOIN advertisers advertiser ON advertiser.id = creative.advertiser_id
      ORDER BY creative.updated_at DESC
    `
  );
  return result.rows;
}

export async function listAdCampaigns() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        campaign.id,
        campaign.name,
        advertiser.name AS advertiser,
        placement.key AS placement,
        COALESCE(creative.title, '') AS creative,
        campaign.status,
        campaign.payment_status,
        campaign.price::text AS price,
        COALESCE(campaign.starts_at::text, '') AS starts_at,
        COALESCE(campaign.ends_at::text, '') AS ends_at,
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

export async function listProviderPromotionPlans() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        plan.id,
        plan.key,
        plan.name,
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

export async function listProviderPromotionsForAdmin() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        promotion.id,
        promotion.title,
        provider.display_name AS provider,
        COALESCE(plan.name, '') AS plan,
        COALESCE(placement.key, '') AS placement,
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
      GROUP BY promotion.id, provider.display_name, plan.name, placement.key
      ORDER BY promotion.updated_at DESC
    `
  );
  return result.rows;
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
        placement.key AS placement_key,
        creative.title AS creative_title,
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
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("ADVERTISER_NAME_REQUIRED");

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
  const key = String(formData.get("key") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!key || !label) throw new Error("PLACEMENT_REQUIRED");

  await query(
    `
      INSERT INTO ad_placements (key, label, placement_type, surface, description, max_items, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (key) DO UPDATE
      SET
        label = EXCLUDED.label,
        placement_type = EXCLUDED.placement_type,
        surface = EXCLUDED.surface,
        description = EXCLUDED.description,
        max_items = EXCLUDED.max_items,
        is_active = EXCLUDED.is_active,
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
    ]
  );
}

export async function createAdCreative(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!title || !imageUrl) throw new Error("CREATIVE_REQUIRED");

  await query(
    `
      INSERT INTO ad_creatives (
        advertiser_id, title, creative_type, image_url, mobile_image_url, target_url,
        alt_text, headline, body, cta_label, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
    ]
  );
}

export async function createAdCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const advertiserId = String(formData.get("advertiserId") ?? "").trim();
  const placementId = String(formData.get("placementId") ?? "").trim();
  if (!name || !advertiserId || !placementId) throw new Error("AD_CAMPAIGN_REQUIRED");

  await query(
    `
      INSERT INTO ad_campaigns (
        advertiser_id, placement_id, creative_id, name, target_url, status,
        payment_status, price, starts_at, ends_at, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, $11)
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
    ]
  );
}

export async function createProviderPromotionPlan(formData: FormData) {
  const key = String(formData.get("key") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!key || !name) throw new Error("PROMOTION_PLAN_REQUIRED");

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
  const providerId = String(formData.get("providerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!providerId || !title) throw new Error("PROVIDER_PROMOTION_REQUIRED");

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
