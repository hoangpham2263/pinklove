import "server-only";

import { query, withTransaction } from "@/lib/database";

export type OfferingBundleStatus = "draft" | "published" | "archived";

export type OfferingBundleInput = {
  slug: string;
  name: string;
  description?: string;
  status?: OfferingBundleStatus;
  price?: number;
  currency?: string;
  config?: Record<string, unknown>;
  items?: Array<{ offeringId: string; quantity?: number; sortOrder?: number; pricingConfig?: Record<string, unknown> }>;
};

export type OfferingBundleItem = {
  id: string;
  offeringId: string;
  offeringName?: string;
  offeringSlug?: string;
  quantity: number;
  sortOrder: number;
  pricingConfig: Record<string, unknown>;
};

export type OfferingBundle = {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: OfferingBundleStatus;
  price: number;
  currency: string;
  config: Record<string, unknown>;
  itemCount: number;
  items: OfferingBundleItem[];
  createdAt: string;
  updatedAt: string;
};

type OfferingBundleRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: OfferingBundleStatus;
  price: string | number;
  currency: string;
  config: Record<string, unknown> | null;
  item_count: number;
  items: OfferingBundleItem[];
  created_at: string;
  updated_at: string;
};

function mapBundleRow(row: OfferingBundleRow): OfferingBundle {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    price: Number(row.price ?? 0),
    currency: row.currency,
    config: row.config ?? {},
    itemCount: Number(row.item_count ?? 0),
    items: row.items ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveOfferingBundle(input: OfferingBundleInput, currentSlug?: string) {
  return withTransaction(async (execute) => {
    const values = [
      input.slug,
      input.name,
      input.description ?? "",
      input.status ?? "draft",
      input.price ?? 0,
      input.currency ?? "VND",
      input.config ?? {},
    ];
    const result = currentSlug
      ? await execute<{ id: string }>(
          `
            UPDATE offering_bundles
            SET
              slug = $1,
              name = $2,
              description = $3,
              status = $4,
              price = $5,
              currency = $6,
              config = $7::jsonb,
              updated_at = NOW()
            WHERE slug = $8
            RETURNING id
          `,
          [...values, currentSlug]
        )
      : await execute<{ id: string }>(
          `
            INSERT INTO offering_bundles (
              slug, name, description, status, price, currency, config
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
            ON CONFLICT (slug) DO UPDATE
            SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              status = EXCLUDED.status,
              price = EXCLUDED.price,
              currency = EXCLUDED.currency,
              config = EXCLUDED.config,
              updated_at = NOW()
            RETURNING id
          `,
          values
        );
    const bundleId = result.rows[0]?.id;
    if (!bundleId) throw new Error("BUNDLE_SAVE_FAILED");

    await execute("DELETE FROM offering_bundle_items WHERE bundle_id = $1", [bundleId]);
    for (const [index, item] of (input.items ?? []).entries()) {
      await execute(
        `
          INSERT INTO offering_bundle_items (
            bundle_id, offering_id, quantity, sort_order, pricing_config
          )
          VALUES ($1, $2, $3, $4, $5::jsonb)
        `,
        [bundleId, item.offeringId, item.quantity ?? 1, item.sortOrder ?? index, item.pricingConfig ?? {}]
      );
    }

    return bundleId;
  });
}

const BUNDLE_SELECT = `
  SELECT
    bundle.*,
    COUNT(item.id)::int AS item_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', item.id,
          'offeringId', item.offering_id,
          'offeringName', offering.name,
          'offeringSlug', offering.slug,
          'quantity', item.quantity,
          'sortOrder', item.sort_order,
          'pricingConfig', item.pricing_config
        )
        ORDER BY item.sort_order ASC
      ) FILTER (WHERE item.id IS NOT NULL),
      '[]'::jsonb
    ) AS items
  FROM offering_bundles bundle
  LEFT JOIN offering_bundle_items item ON item.bundle_id = bundle.id
  LEFT JOIN offerings offering ON offering.id = item.offering_id
`;

export async function listOfferingBundles(): Promise<OfferingBundle[]> {
  const result = await query<OfferingBundleRow>(
    `
      ${BUNDLE_SELECT}
      GROUP BY bundle.id
      ORDER BY bundle.updated_at DESC
    `
  );

  return result.rows.map(mapBundleRow);
}

export async function getOfferingBundleBySlug(slug: string): Promise<OfferingBundle | null> {
  const result = await query<OfferingBundleRow>(
    `
      ${BUNDLE_SELECT}
      WHERE bundle.slug = $1
      GROUP BY bundle.id
      LIMIT 1
    `,
    [slug]
  );

  return result.rows[0] ? mapBundleRow(result.rows[0]) : null;
}

export async function deleteOfferingBundle(slug: string) {
  await query("DELETE FROM offering_bundles WHERE slug = $1", [slug]);
}
