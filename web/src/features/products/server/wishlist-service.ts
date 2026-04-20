import "server-only";

import type { Product } from "@/features/products/types";
import { query, withTransaction } from "@/lib/database";

type WishlistRow = {
  wishlist_product_ids: unknown;
};

function normalizeWishlistProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export async function getUserWishlistProductIds(userId: string): Promise<string[]> {
  const result = await query<WishlistRow>(
    `
      SELECT wishlist_product_ids
      FROM users
      WHERE id::text = $1::text
      LIMIT 1
    `,
    [userId]
  );

  return normalizeWishlistProductIds(result.rows[0]?.wishlist_product_ids);
}

export async function setUserWishlistProductIds(userId: string, productIds: string[]) {
  const normalizedIds = Array.from(new Set(productIds.map((item) => item.trim()).filter(Boolean)));

  await query(
    `
      UPDATE users
      SET wishlist_product_ids = $2::jsonb
      WHERE id::text = $1::text
    `,
    [userId, JSON.stringify(normalizedIds)]
  );

  return normalizedIds;
}

export async function toggleUserWishlistProduct(userId: string, productId: string) {
  return withTransaction(async (execute) => {
    const result = await execute<WishlistRow>(
      `
        SELECT wishlist_product_ids
        FROM users
        WHERE id::text = $1::text
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    const wishlistProductIds = normalizeWishlistProductIds(result.rows[0]?.wishlist_product_ids);
    const alreadyWishlisted = wishlistProductIds.includes(productId);
    const nextProductIds = alreadyWishlisted
      ? wishlistProductIds.filter((item) => item !== productId)
      : [...wishlistProductIds, productId];

    await execute(
      `
        UPDATE users
        SET wishlist_product_ids = $2::jsonb
        WHERE id::text = $1::text
      `,
      [userId, JSON.stringify(nextProductIds)]
    );

    return {
      added: !alreadyWishlisted,
      productIds: nextProductIds,
    };
  });
}

export async function addUserWishlistProduct(userId: string, productId: string) {
  return withTransaction(async (execute) => {
    const result = await execute<WishlistRow>(
      `
        SELECT wishlist_product_ids
        FROM users
        WHERE id::text = $1::text
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    const wishlistProductIds = normalizeWishlistProductIds(result.rows[0]?.wishlist_product_ids);
    if (wishlistProductIds.includes(productId)) {
      return {
        added: false,
        productIds: wishlistProductIds,
      };
    }

    const nextProductIds = [...wishlistProductIds, productId];

    await execute(
      `
        UPDATE users
        SET wishlist_product_ids = $2::jsonb
        WHERE id::text = $1::text
      `,
      [userId, JSON.stringify(nextProductIds)]
    );

    return {
      added: true,
      productIds: nextProductIds,
    };
  });
}

export async function removeUserWishlistProduct(userId: string, productId: string) {
  return withTransaction(async (execute) => {
    const result = await execute<WishlistRow>(
      `
        SELECT wishlist_product_ids
        FROM users
        WHERE id::text = $1::text
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    const wishlistProductIds = normalizeWishlistProductIds(result.rows[0]?.wishlist_product_ids);
    const nextProductIds = wishlistProductIds.filter((item) => item !== productId);

    await execute(
      `
        UPDATE users
        SET wishlist_product_ids = $2::jsonb
        WHERE id::text = $1::text
      `,
      [userId, JSON.stringify(nextProductIds)]
    );

    return {
      removed: nextProductIds.length !== wishlistProductIds.length,
      productIds: nextProductIds,
    };
  });
}

export function sortProductsByWishlistOrder(products: Product[], wishlistProductIds: string[]) {
  const orderMap = new Map(wishlistProductIds.map((id, index) => [id, index]));
  return [...products].sort((left, right) => {
    const leftIndex = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}
