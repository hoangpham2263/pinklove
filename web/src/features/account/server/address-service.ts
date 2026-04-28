import "server-only";

import type { UserAddress } from "@/features/account/address";
import { query, withTransaction } from "@/lib/database";

export type UserAddressInput = {
  label?: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  district: string;
  city: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

type UserAddressRow = {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string;
  ward: string;
  district: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

function mapAddressRow(row: UserAddressRow): UserAddress {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    ward: row.ward,
    district: row.district,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeAddressInput(input: UserAddressInput) {
  return {
    label: input.label?.trim() || "Địa chỉ",
    recipientName: input.recipientName.trim(),
    phone: input.phone.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() ?? "",
    ward: input.ward?.trim() ?? "",
    district: input.district.trim(),
    city: input.city.trim(),
    postalCode: input.postalCode?.trim() ?? "",
    country: input.country?.trim() || "VN",
    isDefault: Boolean(input.isDefault),
  };
}

function assertValidAddress(input: ReturnType<typeof normalizeAddressInput>) {
  if (!input.recipientName || !input.phone || !input.line1 || !input.district || !input.city) {
    throw new Error("ADDRESS_REQUIRED_FIELDS");
  }
}

export async function listUserAddresses(userId: string): Promise<UserAddress[]> {
  const result = await query<UserAddressRow>(
    `
      SELECT *
      FROM user_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, updated_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapAddressRow);
}

export async function getUserAddressById(userId: string, addressId: string): Promise<UserAddress | null> {
  const result = await query<UserAddressRow>(
    `
      SELECT *
      FROM user_addresses
      WHERE user_id = $1 AND id = $2
      LIMIT 1
    `,
    [userId, addressId]
  );

  return result.rows[0] ? mapAddressRow(result.rows[0]) : null;
}

export async function upsertUserAddress(userId: string, input: UserAddressInput, addressId?: string) {
  const normalized = normalizeAddressInput(input);
  assertValidAddress(normalized);

  return withTransaction(async (execute) => {
    if (addressId) {
      const existing = await execute<{ id: string }>(
        "SELECT id FROM user_addresses WHERE user_id = $1 AND id = $2 LIMIT 1",
        [userId, addressId]
      );

      if (!existing.rows[0]) {
        throw new Error("ADDRESS_NOT_FOUND");
      }
    }

    const countResult = await execute<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM user_addresses WHERE user_id = $1",
      [userId]
    );
    const shouldBeDefault = normalized.isDefault || Number(countResult.rows[0]?.count ?? "0") === 0;

    if (shouldBeDefault) {
      await execute("UPDATE user_addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1", [userId]);
    }

    if (addressId) {
      const result = await execute<UserAddressRow>(
        `
          UPDATE user_addresses
          SET
            label = $3,
            recipient_name = $4,
            phone = $5,
            line1 = $6,
            line2 = $7,
            ward = $8,
            district = $9,
            city = $10,
            postal_code = $11,
            country = $12,
            is_default = CASE WHEN $13 THEN TRUE ELSE is_default END,
            updated_at = NOW()
          WHERE user_id = $1 AND id = $2
          RETURNING *
        `,
        [
          userId,
          addressId,
          normalized.label,
          normalized.recipientName,
          normalized.phone,
          normalized.line1,
          normalized.line2,
          normalized.ward,
          normalized.district,
          normalized.city,
          normalized.postalCode,
          normalized.country,
          shouldBeDefault,
        ]
      );

      return mapAddressRow(result.rows[0]);
    }

    const result = await execute<UserAddressRow>(
      `
        INSERT INTO user_addresses (
          user_id,
          label,
          recipient_name,
          phone,
          line1,
          line2,
          ward,
          district,
          city,
          postal_code,
          country,
          is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `,
      [
        userId,
        normalized.label,
        normalized.recipientName,
        normalized.phone,
        normalized.line1,
        normalized.line2,
        normalized.ward,
        normalized.district,
        normalized.city,
        normalized.postalCode,
        normalized.country,
        shouldBeDefault,
      ]
    );

    return mapAddressRow(result.rows[0]);
  });
}

export async function setDefaultUserAddress(userId: string, addressId: string) {
  await withTransaction(async (execute) => {
    const existing = await execute<{ id: string }>(
      "SELECT id FROM user_addresses WHERE user_id = $1 AND id = $2 LIMIT 1",
      [userId, addressId]
    );

    if (!existing.rows[0]) {
      throw new Error("ADDRESS_NOT_FOUND");
    }

    await execute("UPDATE user_addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1", [userId]);
    await execute("UPDATE user_addresses SET is_default = TRUE, updated_at = NOW() WHERE user_id = $1 AND id = $2", [
      userId,
      addressId,
    ]);
  });
}

export async function deleteUserAddress(userId: string, addressId: string) {
  await withTransaction(async (execute) => {
    const deleted = await execute<{ was_default: boolean }>(
      `
        DELETE FROM user_addresses
        WHERE user_id = $1 AND id = $2
        RETURNING is_default AS was_default
      `,
      [userId, addressId]
    );

    if (!deleted.rows[0]) {
      throw new Error("ADDRESS_NOT_FOUND");
    }

    if (deleted.rows[0].was_default) {
      await execute(
        `
          UPDATE user_addresses
          SET is_default = TRUE, updated_at = NOW()
          WHERE id = (
            SELECT id
            FROM user_addresses
            WHERE user_id = $1
            ORDER BY updated_at DESC
            LIMIT 1
          )
        `,
        [userId]
      );
    }
  });
}
