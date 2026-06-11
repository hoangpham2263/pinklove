import "server-only";

import { query, withTransaction } from "@/lib/database";

export type MediaCollection = {
  id: string;
  name: string;
  target_type: string;
  target_id: string;
  description: string;
  target_label: string;
  media_urls: string[];
};

export const MEDIA_COLLECTION_TARGET_TYPES = ["wedding_site", "provider", "offering", "landing"] as const;
export type MediaCollectionTargetType = (typeof MEDIA_COLLECTION_TARGET_TYPES)[number];

export type MediaCollectionTarget = {
  type: MediaCollectionTargetType;
  id: string;
  label: string;
};

export async function listMediaCollectionTargets() {
  const result = await query<MediaCollectionTarget>(
    `
      SELECT 'wedding_site'::text AS type, id, title AS label FROM wedding_sites
      UNION ALL
      SELECT 'provider'::text AS type, id, display_name AS label FROM providers
      UNION ALL
      SELECT 'offering'::text AS type, id, name AS label FROM offerings
      UNION ALL
      SELECT 'landing'::text AS type, id, name AS label FROM landing_pages
      ORDER BY type, label
    `
  );
  return result.rows;
}

export async function listMediaCollections(targetType?: string, targetId?: string) {
  const result = await query<MediaCollection & { item_count: number }>(
    `
      SELECT
        collection.*,
        COALESCE(
          wedding_site.title,
          provider.display_name,
          offering.name,
          landing.name,
          collection.target_id
        ) AS target_label,
        COUNT(item.media_asset_id)::int AS item_count,
        COALESCE(
          jsonb_agg(asset.url ORDER BY item.sort_order)
            FILTER (WHERE asset.id IS NOT NULL),
          '[]'::jsonb
        ) AS media_urls
      FROM media_collections collection
      LEFT JOIN media_collection_items item ON item.collection_id = collection.id
      LEFT JOIN media_assets asset ON asset.id = item.media_asset_id
      LEFT JOIN wedding_sites wedding_site
        ON collection.target_type = 'wedding_site' AND wedding_site.id = collection.target_id
      LEFT JOIN providers provider
        ON collection.target_type = 'provider' AND provider.id = collection.target_id
      LEFT JOIN offerings offering
        ON collection.target_type = 'offering' AND offering.id = collection.target_id
      LEFT JOIN landing_pages landing
        ON collection.target_type = 'landing' AND landing.id = collection.target_id
      WHERE ($1::text IS NULL OR collection.target_type = $1)
        AND ($2::text IS NULL OR collection.target_id = $2)
      GROUP BY collection.id, wedding_site.title, provider.display_name, offering.name, landing.name
      ORDER BY collection.updated_at DESC
    `,
    [targetType ?? null, targetId ?? null]
  );
  return result.rows;
}

export async function getMediaCollection(id: string) {
  const result = await query<MediaCollection>(
    `
      SELECT
        collection.*,
        COALESCE(
          wedding_site.title,
          provider.display_name,
          offering.name,
          landing.name,
          collection.target_id
        ) AS target_label,
        COALESCE(
          jsonb_agg(asset.url ORDER BY item.sort_order)
            FILTER (WHERE asset.id IS NOT NULL),
          '[]'::jsonb
        ) AS media_urls
      FROM media_collections collection
      LEFT JOIN media_collection_items item ON item.collection_id = collection.id
      LEFT JOIN media_assets asset ON asset.id = item.media_asset_id
      LEFT JOIN wedding_sites wedding_site
        ON collection.target_type = 'wedding_site' AND wedding_site.id = collection.target_id
      LEFT JOIN providers provider
        ON collection.target_type = 'provider' AND provider.id = collection.target_id
      LEFT JOIN offerings offering
        ON collection.target_type = 'offering' AND offering.id = collection.target_id
      LEFT JOIN landing_pages landing
        ON collection.target_type = 'landing' AND landing.id = collection.target_id
      WHERE collection.id = $1
      GROUP BY collection.id, wedding_site.title, provider.display_name, offering.name, landing.name
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function saveMediaCollection(input: {
  id?: string;
  name: string;
  targetType: string;
  targetId: string;
  description?: string;
  mediaAssetIds?: string[];
  mediaUrls?: string[];
}) {
  return withTransaction(async (execute) => {
    if (!MEDIA_COLLECTION_TARGET_TYPES.includes(input.targetType as MediaCollectionTargetType)) {
      throw new Error("MEDIA_COLLECTION_TARGET_INVALID");
    }

    const targetQueries: Record<MediaCollectionTargetType, string> = {
      wedding_site: "SELECT id FROM wedding_sites WHERE id = $1",
      provider: "SELECT id FROM providers WHERE id = $1",
      offering: "SELECT id FROM offerings WHERE id = $1",
      landing: "SELECT id FROM landing_pages WHERE id = $1",
    };
    const target = await execute<{ id: string }>(
      targetQueries[input.targetType as MediaCollectionTargetType],
      [input.targetId]
    );
    if (!target.rows[0]) throw new Error("MEDIA_COLLECTION_TARGET_NOT_FOUND");

    const result = input.id
      ? await execute<{ id: string }>(
          `
            UPDATE media_collections
            SET name = $2, target_type = $3, target_id = $4, description = $5, updated_at = NOW()
            WHERE id = $1
            RETURNING id
          `,
          [input.id, input.name, input.targetType, input.targetId, input.description ?? ""]
        )
      : await execute<{ id: string }>(
          `
            INSERT INTO media_collections (id, name, target_type, target_id, description)
            VALUES (app_random_id(), $1, $2, $3, $4)
            RETURNING id
          `,
          [input.name, input.targetType, input.targetId, input.description ?? ""]
        );
    const collectionId = result.rows[0]?.id;
    if (!collectionId) throw new Error("MEDIA_COLLECTION_SAVE_FAILED");

    const selectedAssetIds = input.mediaAssetIds ?? (
      input.mediaUrls
        ? (await execute<{ id: string }>(
            `
              SELECT asset.id
              FROM unnest($1::text[]) WITH ORDINALITY selected(url, position)
              INNER JOIN media_assets asset ON asset.url = selected.url
              ORDER BY selected.position
            `,
            [input.mediaUrls]
          )).rows.map((row) => row.id)
        : undefined
    );

    if (selectedAssetIds) {
      await execute("DELETE FROM media_collection_items WHERE collection_id = $1", [collectionId]);
      for (let index = 0; index < selectedAssetIds.length; index += 1) {
        await execute(
          `
            INSERT INTO media_collection_items (collection_id, media_asset_id, sort_order)
            VALUES ($1, $2, $3)
          `,
          [collectionId, selectedAssetIds[index], index]
        );
      }
    }

    return collectionId;
  });
}

export async function deleteMediaCollection(id: string) {
  const result = await query<{ id: string }>(
    "DELETE FROM media_collections WHERE id = $1 RETURNING id",
    [id]
  );
  return Boolean(result.rows[0]);
}
