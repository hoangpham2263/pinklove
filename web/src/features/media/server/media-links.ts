import "server-only";

import { query, type DbExecutor } from "@/lib/database";
import { findMediaAssetByUrl } from "@/features/media/server/media-store";

export type MediaLinkTargetType =
  | "offering"
  | "provider"
  | "wedding_site"
  | "gallery"
  | "booking"
  | "organization"
  | "template";

export type MediaLinkRole = "thumbnail" | "hero" | "gallery" | "preview" | "video" | "music" | "background" | "avatar";

export async function linkMediaAssetToTarget(input: {
  mediaAssetId: string;
  targetType: MediaLinkTargetType;
  targetId: string;
  role: MediaLinkRole;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const execute = input.execute ?? query;
  await execute(
    `
      INSERT INTO media_asset_links (
        media_asset_id, target_type, target_id, role, sort_order, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT (media_asset_id, target_type, target_id, role)
      DO UPDATE SET
        sort_order = EXCLUDED.sort_order,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `,
    [
      input.mediaAssetId,
      input.targetType,
      input.targetId,
      input.role,
      input.sortOrder ?? 0,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

export async function syncMediaAssetLinkForUrl(input: {
  url?: string | null;
  targetType: MediaLinkTargetType;
  targetId: string;
  role: MediaLinkRole;
  metadata?: Record<string, unknown>;
  execute?: DbExecutor;
}) {
  const url = input.url?.trim();
  if (!url) return false;

  const execute = input.execute ?? query;
  const mediaAsset = await findMediaAssetByUrl(url, execute);
  if (!mediaAsset) return false;

  await linkMediaAssetToTarget({
    mediaAssetId: mediaAsset.id,
    targetType: input.targetType,
    targetId: input.targetId,
    role: input.role,
    metadata: input.metadata,
    execute,
  });

  return true;
}
