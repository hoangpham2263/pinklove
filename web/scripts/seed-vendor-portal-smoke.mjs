import { randomBytes, scryptSync } from "node:crypto";
import { Client } from "pg";

const PASSWORD = process.env.SEED_VENDOR_PASSWORD ?? "12313";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function fetchRow(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const vendorUsername = `vendor_${runId}`.toLowerCase();
  const customerUsername = `customer_${runId}`.toLowerCase();
  const vendorSlug = normalizeSlug(`vendor-${runId}`);
  const orderNumber = `PL-${Date.now().toString().slice(-8)}`;

  try {
    await client.query("BEGIN");

    const offering = await fetchRow(
      client,
      `
        SELECT id, name, slug, offering_type AS type, fulfillment_type, price AS base_price
        FROM offerings
        WHERE status = 'published'
        ORDER BY created_at ASC
        LIMIT 1
      `
    );

    if (!offering) {
      throw new Error("No offering found. Offering seed must exist before smoke seed.");
    }

    const vendor = await fetchRow(
      client,
      `
        INSERT INTO users (username, password_hash, role)
        VALUES ($1, $2, 'VENDOR')
        RETURNING id, username
      `,
      [vendorUsername, hashPassword(PASSWORD)]
    );

    await client.query(
      `
        INSERT INTO user_profiles (user_id, display_name, full_name, phone, vendor_portal_slug, bio)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          vendor_portal_slug = EXCLUDED.vendor_portal_slug,
          bio = EXCLUDED.bio,
          updated_at = NOW()
      `,
      [
        vendor.id,
        `Vendor Smoke ${runId}`,
        `Vendor Smoke ${runId}`,
        "0900000001",
        vendorSlug,
        "Seeded vendor for partner portal smoke flow.",
      ]
    );

    const customer = await fetchRow(
      client,
      `
        INSERT INTO users (username, password_hash, role)
        VALUES ($1, $2, 'CUSTOMER')
        RETURNING id, username
      `,
      [customerUsername, hashPassword(PASSWORD)]
    );

    await client.query(
      `
        INSERT INTO user_profiles (user_id, display_name, full_name, phone, bio)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id)
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          bio = EXCLUDED.bio,
          updated_at = NOW()
      `,
      [
        customer.id,
        `Customer Smoke ${runId}`,
        `Customer Smoke ${runId}`,
        "0900000002",
        "Seeded customer for ecommerce/vendor smoke flow.",
      ]
    );

    const subtotal = Number(offering.base_price ?? 0);
    const total = subtotal;

    const order = await fetchRow(
      client,
      `
        INSERT INTO commerce_orders (
          order_number,
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          status,
          payment_status,
          fulfillment_status,
          currency,
          subtotal_amount,
          discount_amount,
          shipping_amount,
          total_amount,
          shipping_name,
          shipping_phone,
          shipping_line1,
          shipping_line2,
          shipping_ward,
          shipping_district,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          notes,
          paid_at
        )
        VALUES (
          $1, $2, $3, $4, $5,
          'processing', 'paid', 'pending', 'VND',
          $6, 0, 0, $7,
          $3, $5,
          '123 Smoke Street', '', 'Ward 1', 'District 1', 'Ho Chi Minh City', '700000', 'VN',
          'Smoke seeded order for vendor portal flow.',
          NOW()
        )
        RETURNING id, order_number
      `,
      [
        orderNumber,
        customer.id,
        `Customer Smoke ${runId}`,
        `${customerUsername}@pinklove.local`,
        "0900000002",
        subtotal,
        total,
      ]
    );

    await client.query(
      `
        INSERT INTO commerce_order_items (
          order_id,
          offering_id,
          offering_name,
          offering_slug,
          offering_type,
          fulfillment_type,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $7)
      `,
      [
        order.id,
        offering.id,
        offering.name,
        offering.slug,
        offering.type,
        offering.fulfillment_type,
        subtotal,
      ]
    );

    await client.query(
      `
        INSERT INTO commerce_payments (order_id, method, provider, amount, status, external_ref, paid_at)
        VALUES ($1, 'bank_transfer', 'manual_bank_transfer', $2, 'paid', $3, NOW())
      `,
      [order.id, total, `PAY-${randomBytes(4).toString("hex").toUpperCase()}`]
    );

    const assignment = await fetchRow(
      client,
      `
        INSERT INTO vendor_order_assignments (order_id, vendor_user_id, status, internal_note, vendor_note, vendor_reference)
        VALUES ($1, $2, 'pending_confirmation', $3, '', '')
        RETURNING id
      `,
      [order.id, vendor.id, "Seeded assignment for end-to-end vendor smoke test."]
    );

    await client.query(
      `
        INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, NULL, 'system', 'assignment_created', $2)
      `,
      [assignment.id, "Smoke seed created vendor assignment."]
    );

    await client.query("COMMIT");

    console.log(JSON.stringify({
      vendor: {
        username: vendorUsername,
        password: PASSWORD,
        portalSlug: vendorSlug,
        portalLink: `/partner/${vendorSlug}`,
      },
      customer: {
        username: customerUsername,
        password: PASSWORD,
      },
      order: {
        id: order.id,
        orderNumber: order.order_number,
      },
      assignment: {
        id: assignment.id,
      },
      runId,
    }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
