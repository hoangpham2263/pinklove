import "server-only";

import { query, withTransaction } from "@/lib/database";
import { adminUpdateRole, ensureProviderPortalSlug } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

export type CreateProviderApplicationInput = {
  userId: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  city?: string;
  categories?: string;
  website?: string;
  experience?: string;
  notes?: string;
};

export type ProviderApplicationReviewStatus = "pending_review" | "contacted" | "approved" | "rejected" | "archived";

export type ProviderApplication = {
  id: string;
  userId?: string;
  accountName?: string;
  accountRole?: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  city?: string;
  categories?: string;
  website?: string;
  experience?: string;
  notes?: string;
  reviewStatus: ProviderApplicationReviewStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type ProviderApplicationRow = {
  id: string;
  user_id: string | null;
  account_name: string | null;
  account_role: string | null;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string | null;
  categories: string | null;
  website: string | null;
  experience: string | null;
  notes: string | null;
  review_status: ProviderApplicationReviewStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapProviderApplicationRow(row: ProviderApplicationRow): ProviderApplication {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    accountName: row.account_name ?? undefined,
    accountRole: row.account_role ?? undefined,
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    city: row.city ?? undefined,
    categories: row.categories ?? undefined,
    website: row.website ?? undefined,
    experience: row.experience ?? undefined,
    notes: row.notes ?? undefined,
    reviewStatus: row.review_status,
    reviewNote: row.review_note ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createProviderApplication(input: CreateProviderApplicationInput) {
  const userId = input.userId.trim();
  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const city = input.city?.trim() ?? "";
  const categories = input.categories?.trim() ?? "";
  const website = input.website?.trim() ?? "";
  const experience = input.experience?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  if (!userId || !companyName || !contactName || !phone || !email) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error("INVALID_EMAIL");
  }

  const existing = await query<{ id: string }>(
    `
      SELECT id
      FROM provider_applications
      WHERE lower(email) = lower($1)
        AND review_status IN ('pending_review', 'contacted', 'approved')
      LIMIT 1
    `,
    [email]
  );

  if (existing.rows[0]) {
    throw new Error("APPLICATION_ALREADY_EXISTS");
  }

  return withTransaction(async (execute) => {
    const result = await execute<{ id: string }>(
      `
        INSERT INTO provider_applications (
          user_id,
          company_name,
          contact_name,
          phone,
          email,
          city,
          categories,
          website,
          experience,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        userId,
        companyName,
        contactName,
        phone,
        email,
        city || null,
        categories || null,
        website || null,
        experience || null,
        notes || null,
      ]
    );
    const applicationId = result.rows[0]?.id ?? null;

    if (applicationId) {
      const notification = await execute<{ id: string }>(
        `
          INSERT INTO notifications (title, body, link_url, audience_type, created_by_user_id, status)
          VALUES ($1, $2, $3, 'role', $4, 'sent')
          RETURNING id
        `,
        [
          "Có hồ sơ provider mới",
          `${companyName} vừa gửi hồ sơ xin quyền nhà cung cấp.`,
          ROUTES.ADMIN.PROVIDER_APPLICATIONS,
          userId,
        ]
      );
      const notificationId = notification.rows[0]?.id;
      if (notificationId) {
        await execute(
          "INSERT INTO notification_target_roles (notification_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [notificationId, USER_ROLES.ADMIN]
        );
        const adminUsers = await execute<{ id: string }>("SELECT id FROM users WHERE role = $1", [USER_ROLES.ADMIN]);
        for (const adminUser of adminUsers.rows) {
          await execute(
            "SELECT pg_notify($1, json_build_object('topic', $2::text, 'resourceId', $3::text)::text)",
            ["app_realtime", "notifications-user", adminUser.id]
          );
        }
      }
    }

    return applicationId;
  });
}

export async function listProviderApplications(): Promise<ProviderApplication[]> {
  const result = await query<ProviderApplicationRow>(`
    SELECT
      pa.id,
      COALESCE(pa.user_id, u.id) AS user_id,
      u.account_name,
      u.role AS account_role,
      pa.company_name,
      pa.contact_name,
      pa.phone,
      pa.email,
      pa.city,
      pa.categories,
      pa.website,
      pa.experience,
      pa.notes,
      pa.review_status,
      pa.review_note,
      pa.reviewed_at::text AS reviewed_at,
      pa.created_at::text AS created_at,
      pa.updated_at::text AS updated_at
    FROM provider_applications pa
    LEFT JOIN users u
      ON u.id = pa.user_id OR lower(u.email) = lower(pa.email)
    ORDER BY
      CASE pa.review_status
        WHEN 'pending_review' THEN 0
        WHEN 'contacted' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
      END,
      pa.created_at DESC
  `);

  return result.rows.map(mapProviderApplicationRow);
}

export async function getProviderApplicationSummary() {
  const result = await query<{
    pending_count: string;
    contacted_count: string;
    approved_count: string;
    rejected_count: string;
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM provider_applications WHERE review_status = 'pending_review') AS pending_count,
      (SELECT COUNT(*)::text FROM provider_applications WHERE review_status = 'contacted') AS contacted_count,
      (SELECT COUNT(*)::text FROM provider_applications WHERE review_status = 'approved') AS approved_count,
      (SELECT COUNT(*)::text FROM provider_applications WHERE review_status = 'rejected') AS rejected_count
  `);

  const row = result.rows[0];
  return {
    pendingCount: Number(row?.pending_count ?? "0"),
    contactedCount: Number(row?.contacted_count ?? "0"),
    approvedCount: Number(row?.approved_count ?? "0"),
    rejectedCount: Number(row?.rejected_count ?? "0"),
  };
}

export async function adminUpdateProviderApplication(input: {
  actorUserId: string;
  applicationId: string;
  status: ProviderApplicationReviewStatus;
  reviewNote?: string;
}) {
  if (!["pending_review", "contacted", "approved", "rejected", "archived"].includes(input.status)) {
    throw new Error("PROVIDER_APPLICATION_STATUS_INVALID");
  }

  const existing = await query<{ user_id: string | null; email: string }>(
    "SELECT user_id, email FROM provider_applications WHERE id = $1 LIMIT 1",
    [input.applicationId]
  );
  const application = existing.rows[0];
  if (!application) {
    throw new Error("PROVIDER_APPLICATION_NOT_FOUND");
  }

  const userResult = await query<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE id = $1 OR lower(email) = lower($2)
      ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
      LIMIT 1
    `,
    [application.user_id ?? "", application.email]
  );
  const targetUserId = userResult.rows[0]?.id ?? "";

  if (input.status === "approved") {
    if (!targetUserId) {
      throw new Error("PROVIDER_APPLICATION_USER_NOT_FOUND");
    }
    await adminUpdateRole(input.actorUserId, targetUserId, USER_ROLES.PROVIDER);
    await ensureProviderPortalSlug(targetUserId);
  }

  const result = await query<ProviderApplicationRow>(
    `
      UPDATE provider_applications
      SET
        user_id = COALESCE(user_id, NULLIF($4, '')),
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
        user_id,
        NULL::text AS account_name,
        NULL::text AS account_role,
        company_name,
        contact_name,
        phone,
        email,
        city,
        categories,
        website,
        experience,
        notes,
        review_status,
        review_note,
        reviewed_at::text AS reviewed_at,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `,
    [input.applicationId, input.status, input.reviewNote?.trim() || "", targetUserId]
  );

  return mapProviderApplicationRow(result.rows[0]);
}
