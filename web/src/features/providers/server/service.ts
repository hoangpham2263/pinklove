import "server-only";

import { query } from "@/lib/database";

export type ProviderType = "vendor" | "creator" | "studio" | "planner" | "makeup" | "photographer" | "florist";
export type ProviderStatus = "draft" | "published" | "archived";

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

export async function saveProvider(input: ProviderInput) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO providers (
        user_id, organization_id, slug, display_name, provider_type, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        user_id = EXCLUDED.user_id,
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
      input.providerType ?? "vendor",
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
  const result = await query(
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

export async function listProvidersByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, Record<string, unknown>>();
  }

  const result = await query<Record<string, unknown> & { user_id: string }>(
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
      WHERE provider.user_id = ANY($1::text[])
      ORDER BY provider.updated_at DESC
    `,
    [userIds]
  );

  const providersByUserId = new Map<string, Record<string, unknown>>();
  for (const provider of result.rows) {
    if (!providersByUserId.has(provider.user_id)) {
      providersByUserId.set(provider.user_id, provider);
    }
  }

  return providersByUserId;
}

export async function syncVendorAccountProvider(input: {
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
    providerType: "vendor",
    status: input.status ?? "published",
    profile: input.profile,
  });
}
