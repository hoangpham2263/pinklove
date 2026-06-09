import "server-only";

import { query, type DbExecutor } from "@/lib/database";

export type RegionType = "country" | "province" | "city" | "district" | "ward" | "zone";

export async function saveRegion(input: {
  slug: string;
  name: string;
  regionType?: RegionType;
  parentId?: string | null;
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  const result = await execute<{ id: string }>(
    `
      INSERT INTO regions (
        slug, name, region_type, parent_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        name = EXCLUDED.name,
        region_type = EXCLUDED.region_type,
        parent_id = EXCLUDED.parent_id,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id
    `,
    [
      input.slug,
      input.name,
      input.regionType ?? "city",
      input.parentId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function assignProviderRegion(input: {
  providerId: string;
  regionId: string;
  serviceMode?: "available" | "travel" | "remote" | "unavailable";
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  await execute(
    `
      INSERT INTO provider_regions (
        provider_id, region_id, service_mode
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (provider_id, region_id) DO UPDATE
      SET service_mode = EXCLUDED.service_mode
    `,
    [input.providerId, input.regionId, input.serviceMode ?? "available"]
  );
}

export async function setProviderPricing(input: {
  providerId: string;
  offeringId?: string | null;
  priceType?: "base" | "starting_at" | "package" | "hourly" | "custom";
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  const result = await execute<{ id: string }>(
    `
      WITH updated AS (
        UPDATE provider_pricing
        SET
          amount = $4,
          currency = $5,
          metadata = $6::jsonb,
          updated_at = NOW()
        WHERE provider_id = $1
          AND offering_id IS NOT DISTINCT FROM $2::text
          AND price_type = $3
        RETURNING id
      ),
      inserted AS (
        INSERT INTO provider_pricing (
          provider_id, offering_id, price_type, amount, currency, metadata
        )
        SELECT $1, $2, $3, $4, $5, $6::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM updated)
        RETURNING id
      )
      SELECT id FROM updated
      UNION ALL
      SELECT id FROM inserted
      LIMIT 1
    `,
    [
      input.providerId,
      input.offeringId ?? null,
      input.priceType ?? "base",
      Math.max(0, input.amount),
      input.currency ?? "VND",
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function createProviderReview(input: {
  providerId: string;
  userId?: string | null;
  rating: number;
  content?: string;
  status?: "pending" | "published" | "rejected";
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  const result = await execute<{ id: string }>(
    `
      INSERT INTO provider_reviews (
        provider_id, user_id, rating, content, status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      input.providerId,
      input.userId ?? null,
      Math.min(5, Math.max(1, Math.round(input.rating))),
      input.content ?? "",
      input.status ?? "published",
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function assignServiceRegion(input: {
  offeringId: string;
  regionId: string;
  availabilityStatus?: "available" | "limited" | "unavailable";
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  await execute(
    `
      INSERT INTO service_regions (
        offering_id, region_id, availability_status, metadata
      )
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (offering_id, region_id) DO UPDATE
      SET
        availability_status = EXCLUDED.availability_status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `,
    [
      input.offeringId,
      input.regionId,
      input.availabilityStatus ?? "available",
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

export async function saveShippingRegion(input: {
  regionId: string;
  label: string;
  baseFee?: number;
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  const result = await execute<{ id: string }>(
    `
      INSERT INTO shipping_regions (
        region_id, label, base_fee, metadata
      )
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id
    `,
    [
      input.regionId,
      input.label,
      Math.max(0, input.baseFee ?? 0),
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function getProviderMarketplaceSummary(providerId: string) {
  const result = await query<{
    region_count: string;
    review_count: string;
    average_rating: string | null;
    pricing_count: string;
  }>(
    `
      SELECT
        (SELECT COUNT(*)::text FROM provider_regions WHERE provider_id = $1) AS region_count,
        (SELECT COUNT(*)::text FROM provider_reviews WHERE provider_id = $1 AND status = 'published') AS review_count,
        (SELECT AVG(rating)::text FROM provider_reviews WHERE provider_id = $1 AND status = 'published') AS average_rating,
        (SELECT COUNT(*)::text FROM provider_pricing WHERE provider_id = $1) AS pricing_count
    `,
    [providerId]
  );

  const row = result.rows[0];
  return {
    regionCount: Number(row?.region_count ?? "0"),
    reviewCount: Number(row?.review_count ?? "0"),
    averageRating: row?.average_rating ? Number(row.average_rating) : null,
    pricingCount: Number(row?.pricing_count ?? "0"),
  };
}
