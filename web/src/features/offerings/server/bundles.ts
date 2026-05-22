import "server-only";

import { query, withTransaction } from "@/lib/database";

export type OfferingBundleInput = {
  slug: string;
  name: string;
  description?: string;
  status?: "draft" | "published" | "archived";
  price?: number;
  currency?: string;
  config?: Record<string, unknown>;
  items?: Array<{ offeringId: string; quantity?: number; sortOrder?: number; pricingConfig?: Record<string, unknown> }>;
};

export async function saveOfferingBundle(input: OfferingBundleInput) {
  return withTransaction(async (execute) => {
    const result = await execute<{ id: string }>(
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
      [
        input.slug,
        input.name,
        input.description ?? "",
        input.status ?? "draft",
        input.price ?? 0,
        input.currency ?? "VND",
        input.config ?? {},
      ]
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

export async function listOfferingBundles() {
  const result = await query(
    `
      SELECT
        bundle.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', item.id,
              'offeringId', item.offering_id,
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
      GROUP BY bundle.id
      ORDER BY bundle.updated_at DESC
    `
  );

  return result.rows;
}
