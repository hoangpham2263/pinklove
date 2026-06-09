import "server-only";

import { query, withTransaction, type DbExecutor } from "@/lib/database";

export type OrganizationType = "studio" | "agency" | "provider_group" | "creator_group" | "wedding_team";

export type OrganizationRecord = {
  id: string;
  slug: string;
  name: string;
  organization_type: OrganizationType;
  owner_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function saveOrganization(input: {
  slug: string;
  name: string;
  organizationType?: OrganizationType;
  ownerUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO organizations (
        slug, name, organization_type, owner_user_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        name = EXCLUDED.name,
        organization_type = EXCLUDED.organization_type,
        owner_user_id = EXCLUDED.owner_user_id,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id
    `,
    [
      input.slug,
      input.name,
      input.organizationType ?? "provider_group",
      input.ownerUserId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function ensureOrganizationRole(input: {
  organizationId: string;
  key: string;
  label: string;
  permissions?: string[];
  sortOrder?: number;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  const result = await execute<{ id: string }>(
    `
      INSERT INTO organization_roles (
        organization_id, key, label, permissions, sort_order
      )
      VALUES ($1, $2, $3, $4::jsonb, $5)
      ON CONFLICT (organization_id, key) DO UPDATE
      SET
        label = EXCLUDED.label,
        permissions = EXCLUDED.permissions,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
      RETURNING id
    `,
    [
      input.organizationId,
      input.key,
      input.label,
      JSON.stringify(input.permissions ?? []),
      input.sortOrder ?? 0,
    ]
  );

  return result.rows[0]?.id ?? "";
}

export async function addOrganizationMember(input: {
  organizationId: string;
  userId: string;
  roleKey?: string;
  roleLabel?: string;
  status?: "active" | "invited" | "disabled";
  metadata?: Record<string, unknown>;
}) {
  return withTransaction(async (execute) => {
    const roleId = input.roleKey
      ? await ensureOrganizationRole({
          organizationId: input.organizationId,
          key: input.roleKey,
          label: input.roleLabel ?? input.roleKey,
          execute,
        })
      : null;

    const result = await execute<{ id: string }>(
      `
        INSERT INTO organization_members (
          organization_id, user_id, role_id, status, metadata
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (organization_id, user_id) DO UPDATE
        SET
          role_id = EXCLUDED.role_id,
          status = EXCLUDED.status,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING id
      `,
      [
        input.organizationId,
        input.userId,
        roleId,
        input.status ?? "active",
        JSON.stringify(input.metadata ?? {}),
      ]
    );

    return result.rows[0]?.id ?? "";
  });
}

export async function listOrganizations() {
  const result = await query<OrganizationRecord>(
    `
      SELECT id, slug, name, organization_type, owner_user_id, metadata, created_at::text, updated_at::text
      FROM organizations
      ORDER BY updated_at DESC
    `
  );

  return result.rows;
}
