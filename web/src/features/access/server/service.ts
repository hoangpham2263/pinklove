import "server-only";

import { query, withTransaction } from "@/lib/database";
import { recordFieldChanges } from "@/features/platform/server/field-change-logs";

export type AdminPermission = {
  id: string;
  key: string;
  label: string;
  description: string;
  module: string;
};

export type AdminRole = {
  id: string;
  key: string;
  label: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissionIds: string[];
};

export type AdminAccessContext = {
  roleId: string;
  roleKey: string;
  isSuperAdmin: boolean;
  permissionKeys: string[];
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function getAdminAccessContext(userId: string): Promise<AdminAccessContext | null> {
  const result = await query<{
    role_id: string;
    role_key: string;
    is_active: boolean;
    permission_keys: string[];
  }>(
    `
      SELECT role.id AS role_id,role.key AS role_key,role.is_active,
        COALESCE(ARRAY_AGG(permission.key ORDER BY permission.sort_order)
          FILTER (WHERE permission.key IS NOT NULL),ARRAY[]::text[]) AS permission_keys
      FROM users account
      INNER JOIN admin_roles role ON role.id=account.admin_role_id
      LEFT JOIN admin_role_permissions link ON link.role_id=role.id
      LEFT JOIN admin_permissions permission ON permission.id=link.permission_id
      WHERE account.id=$1 AND account.role='ADMIN'
      GROUP BY role.id
    `,
    [userId]
  );
  const row = result.rows[0];
  if (!row?.is_active) return null;
  return {
    roleId: row.role_id,
    roleKey: row.role_key,
    isSuperAdmin: row.role_key === "super_admin",
    permissionKeys: row.permission_keys,
  };
}

export async function hasAdminPermission(userId: string, permissionKey: string) {
  const access = await getAdminAccessContext(userId);
  return Boolean(access && (access.isSuperAdmin || access.permissionKeys.includes(permissionKey)));
}

export async function listAdminPermissions(): Promise<AdminPermission[]> {
  const result = await query<AdminPermission>(
    `SELECT id,key,label,description,module FROM admin_permissions ORDER BY module,sort_order,label`
  );
  return result.rows;
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  const result = await query<{
    id: string;
    key: string;
    label: string;
    description: string;
    is_system: boolean;
    is_active: boolean;
    permission_ids: string[];
  }>(
    `
      SELECT role.id,role.key,role.label,role.description,role.is_system,role.is_active,
        COALESCE(ARRAY_AGG(link.permission_id ORDER BY permission.sort_order)
          FILTER (WHERE link.permission_id IS NOT NULL),ARRAY[]::text[]) AS permission_ids
      FROM admin_roles role
      LEFT JOIN admin_role_permissions link ON link.role_id=role.id
      LEFT JOIN admin_permissions permission ON permission.id=link.permission_id
      GROUP BY role.id
      ORDER BY role.sort_order,role.label
    `
  );
  return result.rows.map((row) => ({
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    isSystem: row.is_system,
    isActive: row.is_active,
    permissionIds: row.permission_ids,
  }));
}

export async function getAdminRole(id: string): Promise<AdminRole | null> {
  const roles = await listAdminRoles();
  return roles.find((role) => role.id === id) ?? null;
}

export async function saveAdminRole(input: {
  id?: string;
  key: string;
  label: string;
  description?: string;
  isActive?: boolean;
  permissionIds: string[];
  actorId: string;
}) {
  const id = text(input.id);
  const key = text(input.key).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const label = text(input.label);
  if (!key || !label || key === "super_admin") throw new Error("INVALID_ROLE");

  return withTransaction(async (execute) => {
    const previous = id
      ? (await execute<Record<string, unknown>>("SELECT * FROM admin_roles WHERE id=$1", [id])).rows[0]
      : undefined;
    if (previous?.is_system) throw new Error("SYSTEM_ROLE");
    const result = await execute<{ id: string }>(
      id
        ? `UPDATE admin_roles SET key=$2,label=$3,description=$4,is_active=$5,updated_at=NOW()
           WHERE id=$1 RETURNING id`
        : `INSERT INTO admin_roles (key,label,description,is_active,sort_order)
           VALUES ($1,$2,$3,$4,100) RETURNING id`,
      id
        ? [id, key, label, text(input.description), input.isActive !== false]
        : [key, label, text(input.description), input.isActive !== false]
    );
    const roleId = result.rows[0]?.id;
    if (!roleId) throw new Error("ROLE_NOT_FOUND");
    await execute("DELETE FROM admin_role_permissions WHERE role_id=$1", [roleId]);
    for (const permissionId of [...new Set(input.permissionIds.filter(Boolean))]) {
      await execute(
        `INSERT INTO admin_role_permissions (role_id,permission_id)
         SELECT $1,id FROM admin_permissions WHERE id=$2 ON CONFLICT DO NOTHING`,
        [roleId, permissionId]
      );
    }
    await recordFieldChanges([{
      targetType: "admin_role",
      targetId: roleId,
      fieldKey: id ? "updated" : "created",
      oldValue: previous ?? null,
      newValue: { key, label, permissionIds: input.permissionIds },
      actorId: input.actorId,
    }], execute);
    return roleId;
  });
}

export async function deleteAdminRole(id: string, actorId: string) {
  return withTransaction(async (execute) => {
    const role = (await execute<Record<string, unknown>>(
      "SELECT * FROM admin_roles WHERE id=$1 AND is_system=FALSE",
      [id]
    )).rows[0];
    if (!role) throw new Error("ROLE_NOT_FOUND");
    const usage = await execute<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE admin_role_id=$1", [id]);
    if (Number(usage.rows[0]?.count ?? "0") > 0) throw new Error("ROLE_IN_USE");
    await execute("DELETE FROM admin_roles WHERE id=$1", [id]);
    await recordFieldChanges([{
      targetType: "admin_role",
      targetId: id,
      fieldKey: "deleted",
      oldValue: role,
      newValue: null,
      actorId,
    }], execute);
  });
}

export async function assignAdminRole(userId: string, roleId: string | null, actorId: string) {
  if (userId === actorId) throw new Error("CANNOT_CHANGE_SELF_ROLE");
  const previous = await query<{ admin_role_id: string | null; role_key: string | null }>(
    `SELECT account.admin_role_id,role.key AS role_key
     FROM users account LEFT JOIN admin_roles role ON role.id=account.admin_role_id
     WHERE account.id=$1`,
    [userId]
  );
  if (!previous.rows[0]) throw new Error("USER_NOT_FOUND");
  if (previous.rows[0].role_key === "super_admin" && roleId !== previous.rows[0].admin_role_id) {
    const count = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users account
       INNER JOIN admin_roles role ON role.id=account.admin_role_id
       WHERE account.role='ADMIN' AND role.key='super_admin'`
    );
    if (Number(count.rows[0]?.count ?? "0") <= 1) throw new Error("LAST_SUPER_ADMIN");
  }
  if (roleId) {
    const role = await query<{ id: string }>("SELECT id FROM admin_roles WHERE id=$1 AND is_active=TRUE", [roleId]);
    if (!role.rows[0]) throw new Error("ROLE_NOT_FOUND");
  }
  await query("UPDATE users SET admin_role_id=$2 WHERE id=$1", [userId, roleId]);
  await recordFieldChanges([{
    targetType: "user",
    targetId: userId,
    fieldKey: "admin_role_id",
    oldValue: previous.rows[0].admin_role_id,
    newValue: roleId,
    actorId,
  }]);
}
