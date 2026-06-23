import "server-only";

import { randomUUID } from "node:crypto";
import type {
  AffiliateAccount,
  AffiliateApplication,
  AffiliateApplicationReviewStatus,
  AffiliateClick,
  AffiliateCommissionType,
  AffiliateConversion,
  AffiliateConversionStatus,
  AffiliateStatus,
} from "@/features/affiliate/types";
import { query } from "@/lib/database";

export const AFFILIATE_REF_COOKIE_NAME = "pinklove_affiliate_ref";
export const AFFILIATE_VISITOR_COOKIE_NAME = "pinklove_affiliate_visitor";
export const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type AffiliateAccountRow = {
  user_id: string;
  accountName: string;
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
  accountName?: string | null;
  affiliate_code: string;
  external_order_ref: string | null;
  order_value: string;
  commission_amount: string;
  status: AffiliateConversionStatus;
  created_at: string;
  updated_at: string;
};

type AffiliateApplicationRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  preferred_code: string | null;
  city: string | null;
  channel_link: string | null;
  audience_note: string | null;
  notes: string | null;
  review_status: AffiliateApplicationReviewStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapAffiliateAccountRow(row: AffiliateAccountRow): AffiliateAccount {
  return {
    userId: row.user_id,
    accountName: row.accountName,
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
    accountName: row.accountName ?? undefined,
    affiliateCode: row.affiliate_code,
    externalOrderRef: row.external_order_ref ?? undefined,
    orderValue: Number(row.order_value ?? "0"),
    commissionAmount: Number(row.commission_amount ?? "0"),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAffiliateApplicationRow(row: AffiliateApplicationRow): AffiliateApplication {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    preferredCode: row.preferred_code ?? undefined,
    city: row.city ?? undefined,
    channelLink: row.channel_link ?? undefined,
    audienceNote: row.audience_note ?? undefined,
    notes: row.notes ?? undefined,
    reviewStatus: row.review_status,
    reviewNote: row.review_note ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
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
  const root = sanitizeAffiliateCode(base) || "affiliate";

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
      u.account_name AS "accountName",
      aa.code,
      aa.status,
      aa.commission_type,
      aa.commission_value::text,
      aa.notes,
      approver.account_name AS approved_by_username,
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

export async function listAffiliateApplications(): Promise<AffiliateApplication[]> {
  const result = await query<AffiliateApplicationRow>(`
    SELECT
      id,
      full_name,
      phone,
      email,
      preferred_code,
      city,
      channel_link,
      audience_note,
      notes,
      review_status,
      review_note,
      reviewed_at,
      created_at,
      updated_at
    FROM affiliate_applications
    ORDER BY
      CASE review_status
        WHEN 'pending_review' THEN 0
        WHEN 'contacted' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
      END,
      created_at DESC
  `);

  return result.rows.map(mapAffiliateApplicationRow);
}

export async function getAffiliateApplicationSummary() {
  const result = await query<{
    pending_count: string;
    contacted_count: string;
    approved_count: string;
    rejected_count: string;
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM affiliate_applications WHERE review_status = 'pending_review') AS pending_count,
      (SELECT COUNT(*)::text FROM affiliate_applications WHERE review_status = 'contacted') AS contacted_count,
      (SELECT COUNT(*)::text FROM affiliate_applications WHERE review_status = 'approved') AS approved_count,
      (SELECT COUNT(*)::text FROM affiliate_applications WHERE review_status = 'rejected') AS rejected_count
  `);

  const row = result.rows[0];
  return {
    pendingCount: Number(row?.pending_count ?? "0"),
    contactedCount: Number(row?.contacted_count ?? "0"),
    approvedCount: Number(row?.approved_count ?? "0"),
    rejectedCount: Number(row?.rejected_count ?? "0"),
  };
}

export async function adminUpdateAffiliateApplication(input: {
  applicationId: string;
  status: AffiliateApplicationReviewStatus;
  reviewNote?: string;
}) {
  if (!["pending_review", "contacted", "approved", "rejected", "archived"].includes(input.status)) {
    throw new Error("AFFILIATE_APPLICATION_STATUS_INVALID");
  }

  const result = await query<AffiliateApplicationRow>(
    `
      UPDATE affiliate_applications
      SET
        review_status = $2,
        review_note = $3,
        reviewed_at = CASE
          WHEN $2 IN ('contacted', 'approved', 'rejected', 'archived') THEN NOW()
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        full_name,
        phone,
        email,
        preferred_code,
        city,
        channel_link,
        audience_note,
        notes,
        review_status,
        review_note,
        reviewed_at,
        created_at,
        updated_at
    `,
    [input.applicationId, input.status, input.reviewNote?.trim() || ""]
  );

  if (!result.rows[0]) {
    throw new Error("AFFILIATE_APPLICATION_NOT_FOUND");
  }

  return mapAffiliateApplicationRow(result.rows[0]);
}

export async function applyForAffiliate(input: {
  userId: string;
  accountName: string;
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
    code = await generateUniqueAffiliateCode(input.accountName);
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

  if (!["pending", "active", "rejected", "blocked"].includes(input.status)) {
    throw new Error("AFFILIATE_STATUS_INVALID");
  }

  if (!["percent", "fixed"].includes(input.commissionType)) {
    throw new Error("AFFILIATE_COMMISSION_TYPE_INVALID");
  }

  if (!Number.isFinite(input.commissionValue) || input.commissionValue < 0) {
    throw new Error("AFFILIATE_COMMISSION_INVALID");
  }

  if (input.commissionType === "percent" && input.commissionValue > 100) {
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

export async function listAffiliateConversions(limit = 100): Promise<AffiliateConversion[]> {
  const result = await query<AffiliateConversionRow>(
    `
      SELECT
        conv.id,
        conv.affiliate_user_id,
        u.account_name AS "accountName",
        conv.affiliate_code,
        conv.external_order_ref,
        conv.order_value::text,
        conv.commission_amount::text,
        conv.status,
        conv.created_at,
        conv.updated_at
      FROM affiliate_conversions conv
      JOIN users u ON u.id = conv.affiliate_user_id
      ORDER BY
        CASE conv.status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          WHEN 'paid' THEN 2
          WHEN 'rejected' THEN 3
          ELSE 4
        END,
        conv.created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapAffiliateConversionRow);
}

export async function adminUpdateAffiliateConversion(input: {
  conversionId: string;
  status: AffiliateConversionStatus;
}): Promise<void> {
  if (!["pending", "approved", "rejected", "paid"].includes(input.status)) {
    throw new Error("AFFILIATE_CONVERSION_STATUS_INVALID");
  }

  const result = await query<{ id: string }>(
    `
      UPDATE affiliate_conversions
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [input.conversionId, input.status]
  );

  if (!result.rows[0]) {
    throw new Error("AFFILIATE_CONVERSION_NOT_FOUND");
  }
}

export async function recordAffiliateClick(input: {
  code: string;
  landingPath: string;
  referrer?: string;
  userAgent?: string;
  visitorToken?: string;
  excludeUserId?: string;
}) {
  const account = await getAffiliateAccountByCode(input.code);
  if (!account || account.status !== "active") {
    return null;
  }

  if (input.excludeUserId && account.userId === input.excludeUserId) {
    return null;
  }

  const visitorToken = input.visitorToken?.trim() || randomUUID();
  const landingPath = input.landingPath.trim() || "/";

  const existing = await query<{ id: string }>(
    `
      SELECT id
      FROM affiliate_clicks
      WHERE affiliate_user_id = $1
        AND affiliate_code = $2
        AND visitor_token = $3
        AND landing_path = $4
        AND created_at >= NOW() - INTERVAL '24 hours'
      LIMIT 1
    `,
    [account.userId, account.code, visitorToken, landingPath]
  );

  if (existing.rows[0]) {
    return { account, visitorToken };
  }

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
