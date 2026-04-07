import "server-only";

import { randomUUID } from "node:crypto";
import type {
  AffiliateAccount,
  AffiliateClick,
  AffiliateCommissionType,
  AffiliateConversion,
  AffiliateConversionStatus,
  AffiliateStatus,
} from "@/features/affiliate/types";
import { query } from "@/lib/db";

export const AFFILIATE_REF_COOKIE_NAME = "pinklove_affiliate_ref";
export const AFFILIATE_VISITOR_COOKIE_NAME = "pinklove_affiliate_visitor";
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type AffiliateAccountRow = {
  user_id: string;
  username: string;
  code: string;
  status: AffiliateStatus;
  commission_type: AffiliateCommissionType;
  commission_value: string;
  notes: string | null;
  approved_by_username: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  click_count: string;
  conversion_count: string;
  earned_commission: string;
};

type AffiliateClickRow = {
  id: string;
  affiliate_user_id: string;
  affiliate_code: string;
  landing_path: string;
  referrer: string | null;
  visitor_token: string | null;
  user_agent: string | null;
  created_at: string;
};

type AffiliateConversionRow = {
  id: string;
  affiliate_user_id: string;
  affiliate_code: string;
  external_order_ref: string | null;
  order_value: string;
  commission_amount: string;
  status: AffiliateConversionStatus;
  created_at: string;
  updated_at: string;
};

function mapAffiliateAccountRow(row: AffiliateAccountRow): AffiliateAccount {
  return {
    userId: row.user_id,
    username: row.username,
    code: row.code,
    status: row.status,
    commissionType: row.commission_type,
    commissionValue: Number(row.commission_value ?? "0"),
    notes: row.notes ?? undefined,
    approvedByUsername: row.approved_by_username ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clickCount: Number(row.click_count ?? "0"),
    conversionCount: Number(row.conversion_count ?? "0"),
    earnedCommission: Number(row.earned_commission ?? "0"),
  };
}

function mapAffiliateClickRow(row: AffiliateClickRow): AffiliateClick {
  return {
    id: row.id,
    affiliateUserId: row.affiliate_user_id,
    affiliateCode: row.affiliate_code,
    landingPath: row.landing_path,
    referrer: row.referrer ?? undefined,
    visitorToken: row.visitor_token ?? undefined,
    userAgent: row.user_agent ?? undefined,
    createdAt: row.created_at,
  };
}

function mapAffiliateConversionRow(row: AffiliateConversionRow): AffiliateConversion {
  return {
    id: row.id,
    affiliateUserId: row.affiliate_user_id,
    affiliateCode: row.affiliate_code,
    externalOrderRef: row.external_order_ref ?? undefined,
    orderValue: Number(row.order_value ?? "0"),
    commissionAmount: Number(row.commission_amount ?? "0"),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeAffiliateCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueAffiliateCode(base: string): Promise<string> {
  const root = sanitizeAffiliateCode(base) || "partner";

  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? root : `${root}-${index}`;
    const exists = await query<{ user_id: string }>(
      "SELECT user_id FROM affiliate_accounts WHERE code = $1 LIMIT 1",
      [candidate]
    );
    if (!exists.rows[0]) {
      return candidate;
    }
  }

  return `${root}-${randomUUID().slice(0, 8)}`;
}

function getAffiliateAccountBaseQuery() {
  return `
    SELECT
      aa.user_id,
      u.username,
      aa.code,
      aa.status,
      aa.commission_type,
      aa.commission_value::text,
      aa.notes,
      approver.username AS approved_by_username,
      aa.approved_at,
      aa.created_at,
      aa.updated_at,
      (
        SELECT COUNT(*)::text
        FROM affiliate_clicks ac
        WHERE ac.affiliate_user_id = aa.user_id
      ) AS click_count,
      (
        SELECT COUNT(*)::text
        FROM affiliate_conversions conv
        WHERE conv.affiliate_user_id = aa.user_id
          AND conv.status IN ('approved', 'paid')
      ) AS conversion_count,
      (
        SELECT COALESCE(SUM(conv.commission_amount), 0)::text
        FROM affiliate_conversions conv
        WHERE conv.affiliate_user_id = aa.user_id
          AND conv.status IN ('approved', 'paid')
      ) AS earned_commission
    FROM affiliate_accounts aa
    JOIN users u ON u.id = aa.user_id
    LEFT JOIN users approver ON approver.id = aa.approved_by
  `;
}

export async function getAffiliateAccountForUser(userId: string): Promise<AffiliateAccount | null> {
  const result = await query<AffiliateAccountRow>(
    `${getAffiliateAccountBaseQuery()} WHERE aa.user_id = $1 LIMIT 1`,
    [userId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapAffiliateAccountRow(result.rows[0]);
}

export async function getAffiliateAccountByCode(code: string): Promise<AffiliateAccount | null> {
  const normalized = sanitizeAffiliateCode(code);
  if (!normalized) return null;

  const result = await query<AffiliateAccountRow>(
    `${getAffiliateAccountBaseQuery()} WHERE aa.code = $1 LIMIT 1`,
    [normalized]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapAffiliateAccountRow(result.rows[0]);
}

export async function listAffiliateAccounts(): Promise<AffiliateAccount[]> {
  const result = await query<AffiliateAccountRow>(
    `${getAffiliateAccountBaseQuery()} ORDER BY
      CASE aa.status
        WHEN 'pending' THEN 0
        WHEN 'active' THEN 1
        WHEN 'blocked' THEN 2
        ELSE 3
      END,
      aa.created_at DESC`
  );

  return result.rows.map(mapAffiliateAccountRow);
}

export async function getAffiliateProgramSummary() {
  const result = await query<{
    pending_count: string;
    active_count: string;
    click_count: string;
    conversion_count: string;
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM affiliate_accounts WHERE status = 'pending') AS pending_count,
      (SELECT COUNT(*)::text FROM affiliate_accounts WHERE status = 'active') AS active_count,
      (SELECT COUNT(*)::text FROM affiliate_clicks) AS click_count,
      (SELECT COUNT(*)::text FROM affiliate_conversions) AS conversion_count
  `);

  const row = result.rows[0];
  return {
    pendingCount: Number(row?.pending_count ?? "0"),
    activeCount: Number(row?.active_count ?? "0"),
    clickCount: Number(row?.click_count ?? "0"),
    conversionCount: Number(row?.conversion_count ?? "0"),
  };
}

export async function applyForAffiliate(input: {
  userId: string;
  username: string;
  preferredCode?: string;
}): Promise<AffiliateAccount> {
  const existing = await getAffiliateAccountForUser(input.userId);
  if (existing) {
    throw new Error("AFFILIATE_ALREADY_EXISTS");
  }

  const requested = sanitizeAffiliateCode(input.preferredCode ?? "");
  let code = requested;

  if (requested) {
    const taken = await query<{ user_id: string }>(
      "SELECT user_id FROM affiliate_accounts WHERE code = $1 LIMIT 1",
      [requested]
    );
    if (taken.rows[0]) {
      throw new Error("AFFILIATE_CODE_TAKEN");
    }
  } else {
    code = await generateUniqueAffiliateCode(input.username);
  }

  if (!code || code.length < 3) {
    throw new Error("AFFILIATE_CODE_INVALID");
  }

  await query(
    `
      INSERT INTO affiliate_accounts (
        user_id, code, status, commission_type, commission_value, notes
      ) VALUES ($1, $2, 'pending', 'percent', 0, NULL)
    `,
    [input.userId, code]
  );

  const account = await getAffiliateAccountForUser(input.userId);
  if (!account) {
    throw new Error("AFFILIATE_CREATE_FAILED");
  }

  return account;
}

export async function adminUpdateAffiliateAccount(input: {
  actorId: string;
  userId: string;
  status: AffiliateStatus;
  commissionType: AffiliateCommissionType;
  commissionValue: number;
  notes?: string;
}): Promise<void> {
  const existing = await getAffiliateAccountForUser(input.userId);
  if (!existing) {
    throw new Error("AFFILIATE_NOT_FOUND");
  }

  if (!Number.isFinite(input.commissionValue) || input.commissionValue < 0) {
    throw new Error("AFFILIATE_COMMISSION_INVALID");
  }

  const approvedBy = input.status === "active" ? input.actorId : null;
  const approvedAt = input.status === "active" ? "NOW()" : "NULL";

  await query(
    `
      UPDATE affiliate_accounts
      SET
        status = $1,
        commission_type = $2,
        commission_value = $3,
        notes = $4,
        approved_by = $5,
        approved_at = ${approvedAt},
        updated_at = NOW()
      WHERE user_id = $6
    `,
    [
      input.status,
      input.commissionType,
      input.commissionValue,
      input.notes?.trim() || null,
      approvedBy,
      input.userId,
    ]
  );
}

export async function listAffiliateClicksForUser(userId: string, limit = 20): Promise<AffiliateClick[]> {
  const result = await query<AffiliateClickRow>(
    `
      SELECT id, affiliate_user_id, affiliate_code, landing_path, referrer, visitor_token, user_agent, created_at
      FROM affiliate_clicks
      WHERE affiliate_user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows.map(mapAffiliateClickRow);
}

export async function listAffiliateConversionsForUser(
  userId: string,
  limit = 20
): Promise<AffiliateConversion[]> {
  const result = await query<AffiliateConversionRow>(
    `
      SELECT id, affiliate_user_id, affiliate_code, external_order_ref, order_value::text, commission_amount::text, status, created_at, updated_at
      FROM affiliate_conversions
      WHERE affiliate_user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows.map(mapAffiliateConversionRow);
}

export async function recordAffiliateClick(input: {
  code: string;
  landingPath: string;
  referrer?: string;
  userAgent?: string;
  visitorToken?: string;
}) {
  const account = await getAffiliateAccountByCode(input.code);
  if (!account || account.status !== "active") {
    return null;
  }

  const visitorToken = input.visitorToken?.trim() || randomUUID();
  const landingPath = input.landingPath.trim() || "/";

  await query(
    `
      INSERT INTO affiliate_clicks (
        affiliate_user_id, affiliate_code, landing_path, referrer, visitor_token, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      account.userId,
      account.code,
      landingPath,
      input.referrer?.trim() || null,
      visitorToken,
      input.userAgent?.trim() || null,
    ]
  );

  return { account, visitorToken };
}

export function buildAffiliateLink(code: string, origin = "", path = "/"): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${origin}${path}${separator}ref=${encodeURIComponent(code)}`;
}
