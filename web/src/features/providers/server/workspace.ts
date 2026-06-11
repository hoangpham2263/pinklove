import "server-only";

import { query } from "@/lib/database";

export async function listProviderPricing(providerId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        pricing.id,
        COALESCE(offering.name, 'General pricing') AS offering,
        pricing.price_type,
        pricing.amount::text,
        pricing.currency,
        pricing.updated_at::text
      FROM provider_pricing pricing
      LEFT JOIN offerings offering ON offering.id = pricing.offering_id
      WHERE pricing.provider_id = $1
      ORDER BY pricing.updated_at DESC
    `,
    [providerId]
  );
  return result.rows;
}

export async function deleteProviderPricing(providerId: string, pricingId: string) {
  const result = await query<{ id: string }>(
    "DELETE FROM provider_pricing WHERE provider_id = $1 AND id = $2 RETURNING id",
    [providerId, pricingId]
  );
  return Boolean(result.rows[0]);
}

export async function listProviderRegions(providerId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        region.id,
        region.name,
        region.region_type,
        provider_region.service_mode,
        provider_region.created_at::text
      FROM provider_regions provider_region
      INNER JOIN regions region ON region.id = provider_region.region_id
      WHERE provider_region.provider_id = $1
      ORDER BY region.name
    `,
    [providerId]
  );
  return result.rows;
}

export async function removeProviderRegion(providerId: string, regionId: string) {
  const result = await query<{ region_id: string }>(
    "DELETE FROM provider_regions WHERE provider_id = $1 AND region_id = $2 RETURNING region_id",
    [providerId, regionId]
  );
  return Boolean(result.rows[0]);
}

export async function listAvailableRegions() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT id, name, region_type
      FROM regions
      ORDER BY name
    `
  );
  return result.rows;
}

export async function listProviderReviews(providerId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        review.id,
        COALESCE(profile.display_name, account.username, 'Customer') AS customer,
        review.rating,
        review.status,
        review.content,
        review.created_at::text,
        review.updated_at::text
      FROM provider_reviews review
      LEFT JOIN users account ON account.id = review.user_id
      LEFT JOIN user_profiles profile ON profile.user_id = account.id
      WHERE review.provider_id = $1
      ORDER BY review.created_at DESC
    `,
    [providerId]
  );
  return result.rows;
}

export async function listAllProviderReviews() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        review.id,
        provider.display_name AS provider,
        COALESCE(profile.display_name, account.username, 'Customer') AS customer,
        review.rating,
        review.status,
        review.content,
        review.created_at::text,
        review.updated_at::text
      FROM provider_reviews review
      INNER JOIN providers provider ON provider.id = review.provider_id
      LEFT JOIN users account ON account.id = review.user_id
      LEFT JOIN user_profiles profile ON profile.user_id = account.id
      ORDER BY review.created_at DESC
    `
  );
  return result.rows;
}

export async function updateProviderReviewStatus(reviewId: string, status: string) {
  const normalized = ["pending", "published", "rejected"].includes(status) ? status : "pending";
  const result = await query<{ id: string }>(
    `
      UPDATE provider_reviews
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [reviewId, normalized]
  );
  return Boolean(result.rows[0]);
}

export async function listProviderOrganizations(ownerUserId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        organization.id,
        organization.name,
        organization.slug,
        organization.organization_type,
        organization.status,
        COUNT(member.id)::int AS members,
        organization.updated_at::text
      FROM organizations organization
      LEFT JOIN organization_members member ON member.organization_id = organization.id
      WHERE organization.owner_user_id = $1
      GROUP BY organization.id
      ORDER BY organization.updated_at DESC
    `,
    [ownerUserId]
  );
  return result.rows;
}

export async function createProviderOrganization(input: {
  ownerUserId: string;
  slug: string;
  name: string;
  organizationType?: string;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO organizations (slug, name, organization_type, owner_user_id, status)
      VALUES ($1, $2, $3, $4, 'active')
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name,
          organization_type = EXCLUDED.organization_type,
          owner_user_id = EXCLUDED.owner_user_id,
          updated_at = NOW()
      RETURNING id
    `,
    [input.slug, input.name, input.organizationType ?? "provider_group", input.ownerUserId]
  );
  const organizationId = result.rows[0]?.id ?? "";
  if (organizationId) {
    await query(
      `
        INSERT INTO organization_roles (organization_id, key, label, permissions, sort_order)
        VALUES ($1, 'owner', 'Owner', '["*"]'::jsonb, 0)
        ON CONFLICT (organization_id, key) DO NOTHING
      `,
      [organizationId]
    );
    await query(
      `
        INSERT INTO organization_members (organization_id, user_id, role_id, status)
        SELECT $1, $2, role.id, 'active'
        FROM organization_roles role
        WHERE role.organization_id = $1 AND role.key = 'owner'
        ON CONFLICT (organization_id, user_id) DO NOTHING
      `,
      [organizationId, input.ownerUserId]
    );
  }
  return organizationId;
}
