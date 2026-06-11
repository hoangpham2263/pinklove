import "server-only";

import { CONVERSION_GOAL_KEYS, recordConversion } from "@/features/analytics/server/conversions";
import { createBooking } from "@/features/bookings/server/service";
import { query, withTransaction } from "@/lib/database";

export const VENDOR_LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost", "closed"] as const;
export const VENDOR_QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

export async function listVendorLeadsForAdmin() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        lead.id,
        provider.display_name AS provider,
        COALESCE(profile.display_name, account.username) AS customer,
        offering.name AS offering,
        lead.budget::text,
        lead.event_date::text,
        lead.status,
        quote.amount::text AS quote_amount,
        quote.status AS quote_status,
        lead.created_at,
        lead.updated_at
      FROM vendor_leads lead
      INNER JOIN providers provider ON provider.id = lead.provider_id
      LEFT JOIN users account ON account.id = lead.user_id
      LEFT JOIN user_profiles profile ON profile.user_id = account.id
      LEFT JOIN offerings offering ON offering.id = lead.offering_id
      LEFT JOIN LATERAL (
        SELECT amount, status
        FROM vendor_quotes
        WHERE lead_id = lead.id
        ORDER BY created_at DESC
        LIMIT 1
      ) quote ON TRUE
      ORDER BY lead.updated_at DESC
    `
  );
  return result.rows;
}

export async function listVendorLeadTargets() {
  const result = await query<{
    provider_id: string;
    provider_name: string;
    offering_id: string | null;
    offering_name: string | null;
  }>(
    `
      SELECT
        provider.id AS provider_id,
        provider.display_name AS provider_name,
        service.offering_id,
        COALESCE(offering.name, service.title) AS offering_name
      FROM providers provider
      LEFT JOIN provider_services service
        ON service.provider_id = provider.id
       AND service.status = 'active'
      LEFT JOIN offerings offering
        ON offering.id = service.offering_id
       AND offering.status = 'published'
      WHERE provider.status = 'published'
      ORDER BY provider.display_name, offering.name NULLS FIRST, service.title NULLS FIRST
    `
  );
  return result.rows;
}

export async function createVendorLead(input: {
  providerId: string;
  userId?: string | null;
  offeringId?: string | null;
  budget?: number;
  eventDate?: string | null;
  message: string;
}) {
  const target = await query<{ provider_id: string }>(
    `
      SELECT provider.id AS provider_id
      FROM providers provider
      LEFT JOIN provider_services service
        ON service.provider_id = provider.id
       AND service.offering_id = $2
       AND service.status = 'active'
      WHERE provider.id = $1
        AND provider.status = 'published'
        AND ($2::text IS NULL OR service.id IS NOT NULL)
      LIMIT 1
    `,
    [input.providerId, input.offeringId ?? null]
  );
  if (!target.rows[0]) throw new Error("VENDOR_LEAD_TARGET_NOT_FOUND");

  const result = await query<{ id: string }>(
    `
      INSERT INTO vendor_leads (
        provider_id, user_id, offering_id, budget, event_date, message, status
      )
      VALUES ($1, $2, $3, $4, $5::date, $6, 'new')
      RETURNING id
    `,
    [
      input.providerId,
      input.userId ?? null,
      input.offeringId ?? null,
      Math.max(0, input.budget ?? 0),
      input.eventDate || null,
      input.message,
    ]
  );
  const leadId = result.rows[0]?.id;
  if (!leadId) throw new Error("VENDOR_LEAD_CREATE_FAILED");

  await recordConversion({
    goalKey: CONVERSION_GOAL_KEYS.LEAD_CREATED,
    userId: input.userId,
    targetType: "vendor_lead",
    targetId: leadId,
  });
  await recordConversion({
    goalKey: CONVERSION_GOAL_KEYS.CONTACT_VENDOR,
    userId: input.userId,
    targetType: "vendor_lead",
    targetId: leadId,
  });
  return leadId;
}

export async function listVendorLeadsForProvider(providerId: string) {
  const result = await query<{
    id: string;
    provider_id: string;
    user_id: string | null;
    offering_id: string | null;
    budget: string;
    event_date: string | null;
    message: string;
    status: string;
    created_at: string;
    customer_name: string | null;
    offering_name: string | null;
    quote_id: string | null;
    quote_amount: string | null;
    quote_status: string | null;
  }>(
    `
      SELECT
        lead.*,
        COALESCE(profile.display_name, users.username) AS customer_name,
        offering.name AS offering_name,
        quote.id AS quote_id,
        quote.amount::text AS quote_amount,
        quote.status AS quote_status
      FROM vendor_leads lead
      LEFT JOIN users ON users.id = lead.user_id
      LEFT JOIN user_profiles profile ON profile.user_id = users.id
      LEFT JOIN offerings offering ON offering.id = lead.offering_id
      LEFT JOIN LATERAL (
        SELECT id, amount, status
        FROM vendor_quotes
        WHERE lead_id = lead.id
        ORDER BY created_at DESC
        LIMIT 1
      ) quote ON TRUE
      WHERE lead.provider_id = $1
      ORDER BY lead.created_at DESC
    `,
    [providerId]
  );
  return result.rows;
}

export async function listVendorLeadsForUser(userId: string) {
  const result = await query<{
    id: string;
    provider_name: string;
    offering_name: string | null;
    message: string;
    status: string;
    quote_amount: string | null;
    quote_status: string | null;
  }>(
    `
      SELECT
        lead.*,
        provider.display_name AS provider_name,
        offering.name AS offering_name,
        quote.amount::text AS quote_amount,
        quote.status AS quote_status
      FROM vendor_leads lead
      INNER JOIN providers provider ON provider.id = lead.provider_id
      LEFT JOIN offerings offering ON offering.id = lead.offering_id
      LEFT JOIN LATERAL (
        SELECT amount, status
        FROM vendor_quotes
        WHERE lead_id = lead.id
        ORDER BY created_at DESC
        LIMIT 1
      ) quote ON TRUE
      WHERE lead.user_id = $1
      ORDER BY lead.created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function updateVendorLeadStatus(providerId: string, leadId: string, status: string) {
  const result = await query<{ id: string }>(
    `
      UPDATE vendor_leads
      SET status = $3, updated_at = NOW()
      WHERE id = $1 AND provider_id = $2
      RETURNING id
    `,
    [leadId, providerId, status]
  );
  return Boolean(result.rows[0]);
}

export async function createVendorQuote(input: {
  providerId: string;
  leadId: string;
  amount: number;
  message?: string;
  status?: string;
}) {
  return withTransaction(async (execute) => {
    const lead = await execute<{ id: string }>(
      "SELECT id FROM vendor_leads WHERE id = $1 AND provider_id = $2 LIMIT 1",
      [input.leadId, input.providerId]
    );
    if (!lead.rows[0]) throw new Error("VENDOR_LEAD_NOT_FOUND");

    const result = await execute<{ id: string }>(
      `
        INSERT INTO vendor_quotes (lead_id, provider_id, amount, message, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [input.leadId, input.providerId, Math.max(0, input.amount), input.message ?? "", input.status ?? "sent"]
    );
    await execute("UPDATE vendor_leads SET status = 'quoted', updated_at = NOW() WHERE id = $1", [input.leadId]);
    return result.rows[0]?.id ?? "";
  });
}

export async function acceptVendorQuote(input: { userId: string; leadId: string }) {
  const leadResult = await query<{
    id: string;
    provider_id: string;
    offering_id: string | null;
    offering_name: string | null;
    amount: string;
    quote_id: string;
  }>(
    `
      SELECT
        lead.id,
        lead.provider_id,
        lead.offering_id,
        offering.name AS offering_name,
        quote.amount::text,
        quote.id AS quote_id
      FROM vendor_leads lead
      INNER JOIN LATERAL (
        SELECT id, amount
        FROM vendor_quotes
        WHERE lead_id = lead.id AND status = 'sent'
        ORDER BY created_at DESC
        LIMIT 1
      ) quote ON TRUE
      LEFT JOIN offerings offering ON offering.id = lead.offering_id
      WHERE lead.id = $1 AND lead.user_id = $2
      LIMIT 1
    `,
    [input.leadId, input.userId]
  );
  const lead = leadResult.rows[0];
  if (!lead) throw new Error("VENDOR_QUOTE_NOT_FOUND");

  const booking = await createBooking({
    userId: input.userId,
    items: [{
      offeringId: lead.offering_id,
      providerId: lead.provider_id,
      title: lead.offering_name || "Vendor service",
      unitPrice: Number(lead.amount),
    }],
    metadata: { vendorLeadId: lead.id, vendorQuoteId: lead.quote_id },
    actorUserId: input.userId,
  });

  await withTransaction(async (execute) => {
    await execute("UPDATE vendor_quotes SET status = 'accepted', updated_at = NOW() WHERE id = $1", [lead.quote_id]);
    await execute("UPDATE vendor_leads SET status = 'won', updated_at = NOW() WHERE id = $1", [lead.id]);
  });
  return booking;
}

export async function syncProviderSearchDocument(providerId: string) {
  await query(
    `
      INSERT INTO provider_search_documents (provider_id, search_text, filter_json, updated_at)
      SELECT
        provider.id,
        concat_ws(
          ' ',
          provider.display_name,
          provider.provider_type,
          profile.business_name,
          profile.bio,
          profile.description,
          string_agg(DISTINCT service.title, ' ')
        ),
        jsonb_build_object(
          'providerType', provider.provider_type,
          'status', provider.status
        ),
        NOW()
      FROM providers provider
      LEFT JOIN provider_profiles profile ON profile.provider_id = provider.id
      LEFT JOIN provider_services service ON service.provider_id = provider.id AND service.status = 'active'
      WHERE provider.id = $1
      GROUP BY provider.id, profile.business_name, profile.bio, profile.description
      ON CONFLICT (provider_id) DO UPDATE
      SET search_text = EXCLUDED.search_text,
          filter_json = EXCLUDED.filter_json,
          updated_at = NOW()
    `,
    [providerId]
  );
}
