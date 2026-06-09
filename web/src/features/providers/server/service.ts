import "server-only";

import { setProviderPricing } from "@/features/providers/server/marketplace";
import { query, type DbExecutor } from "@/lib/database";

export type ProviderType = "supplier" | "creator" | "studio" | "planner" | "makeup" | "photographer" | "florist" | "videographer";
export type ProviderStatus = "draft" | "published" | "archived";

export type ProviderRecord = {
  id: string;
  owner_user_id: string | null;
  organization_id: string | null;
  slug: string;
  display_name: string;
  provider_type: ProviderType;
  status: ProviderStatus;
  metadata: Record<string, unknown>;
  business_name?: string;
  contact_email?: string;
  phone?: string;
  bio?: string;
  description?: string;
};

export type ProviderInput = {
  userId?: string;
  organizationId?: string;
  slug: string;
  displayName: string;
  providerType?: ProviderType;
  status?: ProviderStatus;
  metadata?: Record<string, unknown>;
  profile?: {
    businessName?: string;
    contactEmail?: string;
    phone?: string;
    bio?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function upsertProviderServiceForOffering(input: {
  providerId: string;
  offeringId: string;
  title: string;
  fulfillmentType?: string;
  serviceKind?: string;
  durationMinutes?: number;
  serviceArea?: string;
  status?: "draft" | "active" | "paused" | "archived";
  basePrice?: number;
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  const metadata = {
    fulfillment_type: input.fulfillmentType ?? "service",
    service_kind: input.serviceKind ?? "general",
    service_location_mode: input.serviceKind ?? input.fulfillmentType ?? "service",
    duration_minutes: Math.max(0, input.durationMinutes ?? 0),
    service_area: input.serviceArea ?? "",
    ...(input.metadata ?? {}),
  };

  const result = await execute<{ id: string }>(
    `
      WITH updated AS (
        UPDATE provider_services
        SET
          title = $3,
          status = $4,
          base_price = $5,
          metadata = provider_services.metadata || $6::jsonb,
          updated_at = NOW()
        WHERE provider_id = $1 AND offering_id = $2
        RETURNING id
      ),
      inserted AS (
        INSERT INTO provider_services (
          provider_id, offering_id, title, status, base_price, metadata
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
      input.offeringId,
      input.title,
      input.status ?? "active",
      input.basePrice ?? 0,
      JSON.stringify(metadata),
    ]
  );

  await execute(
    `
      INSERT INTO provider_fulfillments (
        provider_id, offering_id, fulfillment_type, capacity, metadata
      )
      SELECT $1, $2, $3, 0, '{}'::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM provider_fulfillments
        WHERE provider_id = $1 AND offering_id = $2
      )
    `,
    [input.providerId, input.offeringId, input.fulfillmentType ?? "service"]
  );

  await setProviderPricing({
    providerId: input.providerId,
    offeringId: input.offeringId,
    priceType: "base",
    amount: input.basePrice ?? 0,
    metadata: { source: "provider_service" },
    execute,
  });

  return result.rows[0]?.id ?? "";
}

export async function saveProvider(input: ProviderInput) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO providers (
        owner_user_id, organization_id, slug, display_name, provider_type, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        owner_user_id = EXCLUDED.owner_user_id,
        organization_id = EXCLUDED.organization_id,
        display_name = EXCLUDED.display_name,
        provider_type = EXCLUDED.provider_type,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id
    `,
    [
      input.userId ?? null,
      input.organizationId ?? null,
      input.slug,
      input.displayName,
      input.providerType ?? "supplier",
      input.status ?? "draft",
      input.metadata ?? {},
    ]
  );
  const providerId = result.rows[0]?.id;
  if (!providerId) throw new Error("PROVIDER_SAVE_FAILED");

  if (input.profile) {
    await query(
      `
        INSERT INTO provider_profiles (
          provider_id, business_name, contact_email, phone, bio, description, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (provider_id) DO UPDATE
        SET
          business_name = EXCLUDED.business_name,
          contact_email = EXCLUDED.contact_email,
          phone = EXCLUDED.phone,
          bio = EXCLUDED.bio,
          description = EXCLUDED.description,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `,
      [
        providerId,
        input.profile.businessName ?? "",
        input.profile.contactEmail ?? "",
        input.profile.phone ?? "",
        input.profile.bio ?? "",
        input.profile.description ?? "",
        input.profile.metadata ?? {},
      ]
    );
  }

  return providerId;
}

export async function listProviders() {
  const result = await query<ProviderRecord>(
    `
      SELECT
        provider.*,
        profile.business_name,
        profile.contact_email,
        profile.phone,
        profile.bio,
        profile.description
      FROM providers provider
      LEFT JOIN provider_profiles profile ON profile.provider_id = provider.id
      ORDER BY provider.updated_at DESC
    `
  );

  return result.rows;
}

export async function listProvidersByUserIds(userIds: string[]): Promise<Map<string, ProviderRecord>> {
  if (userIds.length === 0) {
    return new Map<string, ProviderRecord>();
  }

  const result = await query<ProviderRecord & { owner_user_id: string }>(
    `
      SELECT
        provider.*,
        profile.business_name,
        profile.contact_email,
        profile.phone,
        profile.bio,
        profile.description
      FROM providers provider
      LEFT JOIN provider_profiles profile ON profile.provider_id = provider.id
      WHERE provider.owner_user_id = ANY($1::text[])
      ORDER BY provider.updated_at DESC
    `,
    [userIds]
  );

  const providersByUserId = new Map<string, ProviderRecord>();
  for (const provider of result.rows) {
    if (!providersByUserId.has(provider.owner_user_id)) {
      providersByUserId.set(provider.owner_user_id, provider);
    }
  }

  return providersByUserId;
}

export async function getProviderByUserId(userId: string) {
  const providers = await listProvidersByUserIds([userId]);
  return providers.get(userId) ?? null;
}

export async function syncProviderAccountProvider(input: {
  userId: string;
  slug: string;
  displayName: string;
  status?: ProviderStatus;
  profile?: ProviderInput["profile"];
}) {
  return saveProvider({
    userId: input.userId,
    slug: input.slug,
    displayName: input.displayName,
    providerType: "supplier",
    status: input.status ?? "published",
    profile: input.profile,
  });
}
