import "server-only";

import { query } from "@/lib/database";

export type InternalAccount = {
  id: string;
  platform: string;
  label: string;
  loginUsername: string;
  loginPassword: string;
  loginUrl: string;
  notes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type InternalAccountRow = {
  id: string;
  platform: string;
  label: string;
  login_username: string;
  login_password: string;
  login_url: string;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapInternalAccount(row: InternalAccountRow): InternalAccount {
  return {
    id: row.id,
    platform: row.platform,
    label: row.label,
    loginUsername: row.login_username,
    loginPassword: row.login_password,
    loginUrl: row.login_url,
    notes: row.notes,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = normalizeText(value);
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function listInternalAccounts(): Promise<InternalAccount[]> {
  const result = await query<InternalAccountRow>(
    `
      SELECT
        id,
        platform,
        label,
        login_username,
        login_password,
        login_url,
        notes,
        sort_order,
        created_at,
        updated_at
      FROM internal_accounts
      ORDER BY sort_order ASC, updated_at DESC, created_at DESC
    `
  );

  return result.rows.map(mapInternalAccount);
}

export async function getInternalAccount(id: string): Promise<InternalAccount | null> {
  const accountId = normalizeText(id);
  if (!accountId) return null;
  const result = await query<InternalAccountRow>(
    `
      SELECT id,platform,label,login_username,login_password,login_url,notes,sort_order,created_at,updated_at
      FROM internal_accounts
      WHERE id = $1
    `,
    [accountId]
  );
  return result.rows[0] ? mapInternalAccount(result.rows[0]) : null;
}

export async function createInternalAccount(input: {
  platform: string;
  label: string;
  loginUsername?: string;
  loginPassword?: string;
  loginUrl?: string;
  notes?: string;
  sortOrder?: number;
}): Promise<InternalAccount> {
  const platform = normalizeText(input.platform) || "Khác";
  const label = normalizeText(input.label) || platform;
  const loginUsername = normalizeText(input.loginUsername);
  const loginPassword = normalizeText(input.loginPassword);
  const loginUrl = normalizeUrl(input.loginUrl);
  const notes = normalizeText(input.notes);
  const sortOrder = Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0;

  const result = await query<InternalAccountRow>(
    `
      INSERT INTO internal_accounts (
        platform,
        label,
        login_username,
        login_password,
        login_url,
        notes,
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        platform,
        label,
        login_username,
        login_password,
        login_url,
        notes,
        sort_order,
        created_at,
        updated_at
    `,
    [platform, label, loginUsername, loginPassword, loginUrl, notes, sortOrder]
  );

  return mapInternalAccount(result.rows[0]);
}

export async function updateInternalAccount(input: {
  id: string;
  platform: string;
  label: string;
  loginUsername?: string;
  loginPassword?: string;
  loginUrl?: string;
  notes?: string;
  sortOrder?: number;
}): Promise<InternalAccount | null> {
  const id = normalizeText(input.id);
  if (!id) {
    return null;
  }

  const platform = normalizeText(input.platform) || "Khác";
  const label = normalizeText(input.label) || platform;
  const loginUsername = normalizeText(input.loginUsername);
  const loginPassword = normalizeText(input.loginPassword);
  const loginUrl = normalizeUrl(input.loginUrl);
  const notes = normalizeText(input.notes);
  const sortOrder = Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0;

  const result = await query<InternalAccountRow>(
    `
      UPDATE internal_accounts
      SET
        platform = $2,
        label = $3,
        login_username = $4,
        login_password = $5,
        login_url = $6,
        notes = $7,
        sort_order = $8,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        platform,
        label,
        login_username,
        login_password,
        login_url,
        notes,
        sort_order,
        created_at,
        updated_at
    `,
    [id, platform, label, loginUsername, loginPassword, loginUrl, notes, sortOrder]
  );

  return result.rows[0] ? mapInternalAccount(result.rows[0]) : null;
}

export async function deleteInternalAccount(id: string): Promise<boolean> {
  const accountId = normalizeText(id);
  if (!accountId) {
    return false;
  }

  const result = await query<{ id: string }>(
    `
      DELETE FROM internal_accounts
      WHERE id = $1
      RETURNING id
    `,
    [accountId]
  );

  return Boolean(result.rows[0]);
}
