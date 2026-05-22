import "server-only";

import type { Offering } from "@/features/offerings/types";
import { query, withTransaction } from "@/lib/database";

type WishlistRow = {
  wishlist_offering_ids: unknown;
};

function normalizeWishlistOfferingIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export async function getUserWishlistOfferingIds(userId: string): Promise<string[]> {
  const result = await query<WishlistRow>(
    `
      SELECT wishlist_offering_ids
      FROM users
      WHERE id::text = $1::text
      LIMIT 1
    `,
    [userId]
  );

  return normalizeWishlistOfferingIds(result.rows[0]?.wishlist_offering_ids);
}

export async function setUserWishlistOfferingIds(userId: string, offeringIds: string[]) {
  const normalizedIds = Array.from(new Set(offeringIds.map((item) => item.trim()).filter(Boolean)));

  await query(
    `
      UPDATE users
      SET wishlist_offering_ids = $2::jsonb
      WHERE id::text = $1::text
    `,
    [userId, JSON.stringify(normalizedIds)]
  );

  return normalizedIds;
}

export async function toggleUserWishlistOffering(userId: string, offeringId: string) {
  return withTransaction(async (execute) => {
    const result = await execute<WishlistRow>(
      `
        SELECT wishlist_offering_ids
        FROM users
        WHERE id::text = $1::text
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    const wishlistOfferingIds = normalizeWishlistOfferingIds(result.rows[0]?.wishlist_offering_ids);
    const alreadyWishlisted = wishlistOfferingIds.includes(offeringId);
    const nextOfferingIds = alreadyWishlisted
      ? wishlistOfferingIds.filter((item) => item !== offeringId)
      : [...wishlistOfferingIds, offeringId];

    await execute(
      `
        UPDATE users
        SET wishlist_offering_ids = $2::jsonb
        WHERE id::text = $1::text
      `,
      [userId, JSON.stringify(nextOfferingIds)]
    );

    return {
      added: !alreadyWishlisted,
      offeringIds: nextOfferingIds,
    };
  });
}

export async function addUserWishlistOffering(userId: string, offeringId: string) {
  return withTransaction(async (execute) => {
    const result = await execute<WishlistRow>(
      `
        SELECT wishlist_offering_ids
        FROM users
        WHERE id::text = $1::text
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    const wishlistOfferingIds = normalizeWishlistOfferingIds(result.rows[0]?.wishlist_offering_ids);
    if (wishlistOfferingIds.includes(offeringId)) {
      return {
        added: false,
        offeringIds: wishlistOfferingIds,
      };
    }

    const nextOfferingIds = [...wishlistOfferingIds, offeringId];

    await execute(
      `
        UPDATE users
        SET wishlist_offering_ids = $2::jsonb
        WHERE id::text = $1::text
      `,
      [userId, JSON.stringify(nextOfferingIds)]
    );

    return {
      added: true,
      offeringIds: nextOfferingIds,
    };
  });
}

export async function removeUserWishlistOffering(userId: string, offeringId: string) {
  return withTransaction(async (execute) => {
    const result = await execute<WishlistRow>(
      `
        SELECT wishlist_offering_ids
        FROM users
        WHERE id::text = $1::text
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    const wishlistOfferingIds = normalizeWishlistOfferingIds(result.rows[0]?.wishlist_offering_ids);
    const nextOfferingIds = wishlistOfferingIds.filter((item) => item !== offeringId);

    await execute(
      `
        UPDATE users
        SET wishlist_offering_ids = $2::jsonb
        WHERE id::text = $1::text
      `,
      [userId, JSON.stringify(nextOfferingIds)]
    );

    return {
      removed: nextOfferingIds.length !== wishlistOfferingIds.length,
      offeringIds: nextOfferingIds,
    };
  });
}

export function sortOfferingsByWishlistOrder(offerings: Offering[], wishlistOfferingIds: string[]) {
  const orderMap = new Map(wishlistOfferingIds.map((id, index) => [id, index]));
  return [...offerings].sort((left, right) => {
    const leftIndex = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}
