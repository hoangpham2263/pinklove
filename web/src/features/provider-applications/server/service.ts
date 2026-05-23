import "server-only";

import { query } from "@/lib/database";

export type CreateProviderApplicationInput = {
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

export async function createProviderApplication(input: CreateProviderApplicationInput) {
  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const city = input.city?.trim() ?? "";
  const categories = input.categories?.trim() ?? "";
  const website = input.website?.trim() ?? "";
  const experience = input.experience?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  if (!companyName || !contactName || !phone || !email) {
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

  const result = await query<{ id: string }>(
    `
      INSERT INTO provider_applications (
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
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

  return result.rows[0]?.id ?? null;
}
