import "server-only";

import type { Offering } from "@/features/offerings/types";
import { query } from "@/lib/database";

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(stringifyValue).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(stringifyValue).join(" ");
  return String(value);
}

export async function upsertOfferingSearchDocument(offering: Offering) {
  const customFields = typeof offering.config.customFields === "object" && offering.config.customFields
    ? (offering.config.customFields as Record<string, unknown>)
    : {};
  const searchText = [
    offering.name,
    offering.slug,
    offering.excerpt,
    offering.description,
    offering.categoryName,
    offering.offeringType,
    offering.templateKey,
    offering.templateEngine,
    stringifyValue(customFields),
  ].filter(Boolean).join(" ");
  const filterJson = {
    status: offering.status,
    offeringType: offering.offeringType,
    fulfillmentType: offering.fulfillmentType,
    categoryId: offering.categoryId ?? null,
    categorySlug: offering.categorySlug ?? null,
    price: offering.price,
    templateEngine: offering.templateEngine ?? null,
    templateMode: offering.templateMode ?? null,
    customFields,
  };

  await query(
    `
      INSERT INTO offering_search_documents (
        offering_id, search_text, filter_json, embedding
      )
      VALUES ($1, $2, $3::jsonb, NULL)
      ON CONFLICT (offering_id) DO UPDATE
      SET
        search_text = EXCLUDED.search_text,
        filter_json = EXCLUDED.filter_json,
        updated_at = NOW()
    `,
    [offering.id, searchText, filterJson]
  );
}

export async function rebuildOfferingSearchDocuments() {
  const { listAllOfferings } = await import("@/features/offerings/server/service");
  const offerings = await listAllOfferings();
  for (const offering of offerings) {
    await upsertOfferingSearchDocument(offering);
  }
  return offerings.length;
}
