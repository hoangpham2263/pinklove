import "server-only";

import { query } from "@/lib/database";

export type CreateAffiliateApplicationInput = {
  fullName: string;
  phone: string;
  email: string;
  preferredCode?: string;
  city?: string;
  channelLink?: string;
  audienceNote?: string;
  notes?: string;
};

function sanitizeAffiliateCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createAffiliateApplication(input: CreateAffiliateApplicationInput) {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const preferredCode = sanitizeAffiliateCode(input.preferredCode ?? "");
  const city = input.city?.trim() ?? "";
  const channelLink = input.channelLink?.trim() ?? "";
  const audienceNote = input.audienceNote?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  if (!fullName || !phone || !email) {
    throw new Error("MISSING_REQUIRED_FIELDS");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error("INVALID_EMAIL");
  }

  if (preferredCode && preferredCode.length < 3) {
    throw new Error("AFFILIATE_CODE_INVALID");
  }

  const existingByEmail = await query<{ id: string }>(
    `
      SELECT id
      FROM affiliate_applications
      WHERE lower(email) = lower($1)
        AND review_status IN ('pending_review', 'contacted', 'approved')
      LIMIT 1
    `,
    [email]
  );

  if (existingByEmail.rows[0]) {
    throw new Error("APPLICATION_ALREADY_EXISTS");
  }

  if (preferredCode) {
    const [takenByAccount, takenByApplication] = await Promise.all([
      query<{ user_id: string }>(
        "SELECT user_id FROM affiliate_accounts WHERE code = $1 LIMIT 1",
        [preferredCode]
      ),
      query<{ id: string }>(
        `
          SELECT id
          FROM affiliate_applications
          WHERE preferred_code = $1
            AND review_status IN ('pending_review', 'contacted', 'approved')
          LIMIT 1
        `,
        [preferredCode]
      ),
    ]);

    if (takenByAccount.rows[0] || takenByApplication.rows[0]) {
      throw new Error("AFFILIATE_CODE_TAKEN");
    }
  }

  const result = await query<{ id: string }>(
    `
      INSERT INTO affiliate_applications (
        full_name,
        phone,
        email,
        preferred_code,
        city,
        channel_link,
        audience_note,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      fullName,
      phone,
      email,
      preferredCode || null,
      city || null,
      channelLink || null,
      audienceNote || null,
      notes || null,
    ]
  );

  return result.rows[0]?.id ?? null;
}
