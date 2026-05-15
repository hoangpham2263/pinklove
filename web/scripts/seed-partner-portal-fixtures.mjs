import { randomBytes, scryptSync } from "node:crypto";
import { Client } from "pg";

const PASSWORD = process.env.SEED_VENDOR_PASSWORD ?? "12313";
const BASE_URL = process.env.SEED_BASE_URL ?? "";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function formatLink(path) {
  return BASE_URL ? `${BASE_URL}${path}` : path;
}

async function fetchRow(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}

async function fetchRows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function upsertUser(client, { username, role, displayName, fullName, phone, vendorPortalSlug, bio }) {
  const user = await fetchRow(
    client,
    `
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
      RETURNING id, username, role
    `,
    [username, hashPassword(PASSWORD), role]
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
    [user.id, displayName, fullName, phone, vendorPortalSlug ?? null, bio]
  );

  return user;
}

async function upsertOrder(client, orderInput) {
  const {
    orderNumber,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    orderStatus,
    paymentStatus,
    fulfillmentStatus,
    subtotal,
    total,
    notes,
  } = orderInput;

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
        $6, $7, $8, 'VND',
        $9, 0, 0, $10,
        $3, $5,
        '123 Seed Street', '', 'Ward 1', 'District 1', 'Ho Chi Minh City', '700000', 'VN',
        $11,
        CASE WHEN $7 = 'paid' THEN NOW() ELSE NULL END
      )
      ON CONFLICT (order_number)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        fulfillment_status = EXCLUDED.fulfillment_status,
        subtotal_amount = EXCLUDED.subtotal_amount,
        total_amount = EXCLUDED.total_amount,
        shipping_name = EXCLUDED.shipping_name,
        shipping_phone = EXCLUDED.shipping_phone,
        shipping_line1 = EXCLUDED.shipping_line1,
        shipping_line2 = EXCLUDED.shipping_line2,
        shipping_ward = EXCLUDED.shipping_ward,
        shipping_district = EXCLUDED.shipping_district,
        shipping_city = EXCLUDED.shipping_city,
        shipping_postal_code = EXCLUDED.shipping_postal_code,
        shipping_country = EXCLUDED.shipping_country,
        notes = EXCLUDED.notes,
        paid_at = EXCLUDED.paid_at,
        updated_at = NOW()
      RETURNING id, order_number
    `,
    [
      orderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone,
      orderStatus,
      paymentStatus,
      fulfillmentStatus,
      subtotal,
      total,
      notes,
    ]
  );

  await client.query(
    `
      DELETE FROM vendor_order_events
      WHERE assignment_id IN (
        SELECT id
        FROM vendor_order_assignments
        WHERE order_id = $1
      )
    `,
    [order.id]
  );
  await client.query("DELETE FROM vendor_order_assignments WHERE order_id = $1", [order.id]);
  await client.query("DELETE FROM commerce_payments WHERE order_id = $1", [order.id]);
  await client.query("DELETE FROM commerce_order_items WHERE order_id = $1", [order.id]);

  return order;
}

async function createOrderItems(client, orderId, items) {
  for (const item of items) {
    await client.query(
      `
        INSERT INTO commerce_order_items (
          order_id,
          product_id,
          product_name,
          product_slug,
          product_type,
          fulfillment_type,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        orderId,
        item.product.id,
        item.product.name,
        item.product.slug,
        item.product.type,
        item.product.fulfillment_type,
        item.quantity,
        item.unitPrice,
        item.unitPrice * item.quantity,
      ]
    );
  }
}

async function createPayment(client, orderId, amount, suffix) {
  await client.query(
    `
      INSERT INTO commerce_payments (order_id, method, provider, amount, status, external_ref, paid_at)
      VALUES ($1, 'bank_transfer', 'manual_bank_transfer', $2, 'paid', $3, NOW())
    `,
    [orderId, amount, `PAY-${suffix}`]
  );
}

async function createAssignment(client, assignmentInput) {
  const {
    orderId,
    vendorUserId,
    status,
    internalNote,
    vendorNote,
    vendorReference,
    acceptedAt,
    completedAt,
  } = assignmentInput;

  const assignment = await fetchRow(
    client,
    `
      INSERT INTO vendor_order_assignments (
        order_id,
        vendor_user_id,
        status,
        internal_note,
        vendor_note,
        vendor_reference,
        accepted_at,
        completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [orderId, vendorUserId, status, internalNote, vendorNote, vendorReference, acceptedAt ?? null, completedAt ?? null]
  );

  return assignment;
}

async function createEvent(client, assignmentId, actorUserId, actorType, eventType, message) {
  await client.query(
    `
      INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [assignmentId, actorUserId ?? null, actorType, eventType, message]
  );
}

function sumItems(items) {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    const products = await fetchRows(
      client,
      `
        SELECT id, name, slug, product_type AS type, fulfillment_type, price AS base_price
        FROM products
        WHERE status = 'published'
        ORDER BY created_at ASC
        LIMIT 3
      `
    );

    if (products.length === 0) {
      throw new Error("No published product found. Product seed must exist before fixture seed.");
    }

    const [productA, productB = products[0], productC = products[0]] = products;

    const admin = await upsertUser(client, {
      username: "admin_seed",
      role: "ADMIN",
      displayName: "Admin Seed",
      fullName: "Admin Seed",
      phone: "0900000099",
      bio: "Seeded admin account for vendor portal testing.",
    });

    const vendorAlpha = await upsertUser(client, {
      username: "vendor_alpha",
      role: "VENDOR",
      displayName: "Xuong In Alpha",
      fullName: "Xuong In Alpha",
      phone: "0900000001",
      vendorPortalSlug: "xuong-in-alpha",
      bio: "Vendor Alpha seeded for partner portal testing.",
    });

    const vendorBeta = await upsertUser(client, {
      username: "vendor_beta",
      role: "VENDOR",
      displayName: "Xuong In Beta",
      fullName: "Xuong In Beta",
      phone: "0900000002",
      vendorPortalSlug: "xuong-in-beta",
      bio: "Vendor Beta seeded for partner portal testing.",
    });

    const customerOne = await upsertUser(client, {
      username: "customer_one",
      role: "CUSTOMER",
      displayName: "Nguyen Lan",
      fullName: "Nguyen Lan",
      phone: "0900000011",
      bio: "Seeded customer one.",
    });

    const customerTwo = await upsertUser(client, {
      username: "customer_two",
      role: "CUSTOMER",
      displayName: "Tran Minh",
      fullName: "Tran Minh",
      phone: "0900000012",
      bio: "Seeded customer two.",
    });

    const scenarios = [
      {
        orderNumber: "PL-SEED-PORTAL-001",
        customer: customerOne,
        vendor: vendorAlpha,
        vendorPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
        notes: "Seed order waiting for vendor confirmation.",
        assignmentStatus: "pending_confirmation",
        internalNote: "Admin giao đơn test 001 cho Alpha.",
        vendorNote: "",
        vendorReference: "",
        items: [
          { product: productA, quantity: 1, unitPrice: Number(productA.base_price ?? 0) || 990000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công vendor cho đơn test 001."],
        ],
      },
      {
        orderNumber: "PL-SEED-PORTAL-002",
        customer: customerOne,
        vendor: vendorAlpha,
        vendorPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Seed order đang được vendor xử lý.",
        assignmentStatus: "in_progress",
        internalNote: "Đơn in gấp cần cập nhật tiến độ theo ngày.",
        vendorNote: "Da chot file in va dang tien hanh san xuat.",
        vendorReference: "ALPHA-002",
        acceptedAt: "2026-04-10T08:00:00.000Z",
        items: [
          { product: productA, quantity: 1, unitPrice: Number(productA.base_price ?? 0) || 990000 },
          { product: productB, quantity: 1, unitPrice: Number(productB.base_price ?? 0) || 1290000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công vendor cho đơn test 002."],
          ["vendor", vendorAlpha.id, "status_changed", "Vendor đã cập nhật trạng thái sang accepted."],
          ["vendor", vendorAlpha.id, "status_changed", "Vendor đã cập nhật trạng thái sang in_progress."],
          ["vendor", vendorAlpha.id, "note_added", "Vendor note: Da chot file in va dang tien hanh san xuat."],
        ],
      },
      {
        orderNumber: "PL-SEED-PORTAL-003",
        customer: customerTwo,
        vendor: vendorBeta,
        vendorPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "ready_to_ship",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Seed order chờ admin review trước khi bàn giao.",
        assignmentStatus: "ready_for_review",
        internalNote: "Can admin review mau in lan cuoi.",
        vendorNote: "Da in xong mau, cho admin duyet.",
        vendorReference: "BETA-003",
        acceptedAt: "2026-04-09T09:30:00.000Z",
        items: [
          { product: productC, quantity: 2, unitPrice: Number(productC.base_price ?? 0) || 500000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công vendor cho đơn test 003."],
          ["vendor", vendorBeta.id, "status_changed", "Vendor đã cập nhật trạng thái sang accepted."],
          ["vendor", vendorBeta.id, "status_changed", "Vendor đã cập nhật trạng thái sang ready_for_review."],
          ["vendor", vendorBeta.id, "note_added", "Vendor note: Da in xong mau, cho admin duyet."],
        ],
      },
      {
        orderNumber: "PL-SEED-PORTAL-004",
        customer: customerTwo,
        vendor: vendorBeta,
        vendorPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "completed",
        paymentStatus: "paid",
        fulfillmentStatus: "delivered",
        notes: "Seed order đã hoàn tất để test thống kê completed.",
        assignmentStatus: "completed",
        internalNote: "Don da giao hoan tat.",
        vendorNote: "Da giao hang thanh cong.",
        vendorReference: "BETA-004",
        acceptedAt: "2026-04-08T10:00:00.000Z",
        completedAt: "2026-04-11T16:30:00.000Z",
        items: [
          { product: productB, quantity: 1, unitPrice: Number(productB.base_price ?? 0) || 1290000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công vendor cho đơn test 004."],
          ["vendor", vendorBeta.id, "status_changed", "Vendor đã cập nhật trạng thái sang in_progress."],
          ["vendor", vendorBeta.id, "status_changed", "Vendor đã cập nhật trạng thái sang completed."],
          ["vendor", vendorBeta.id, "note_added", "Vendor note: Da giao hang thanh cong."],
        ],
      },
    ];

    const seededOrders = [];

    for (const scenario of scenarios) {
      const subtotal = sumItems(scenario.items);
      const order = await upsertOrder(client, {
        orderNumber: scenario.orderNumber,
        userId: scenario.customer.id,
        customerName: scenario.customerName,
        customerEmail: scenario.customerEmail,
        customerPhone: scenario.customerPhone,
        orderStatus: scenario.orderStatus,
        paymentStatus: scenario.paymentStatus,
        fulfillmentStatus: scenario.fulfillmentStatus,
        subtotal,
        total: subtotal,
        notes: scenario.notes,
      });

      await createOrderItems(client, order.id, scenario.items);
      await createPayment(client, order.id, subtotal, scenario.orderNumber);

      const assignment = await createAssignment(client, {
        orderId: order.id,
        vendorUserId: scenario.vendor.id,
        status: scenario.assignmentStatus,
        internalNote: scenario.internalNote,
        vendorNote: scenario.vendorNote,
        vendorReference: scenario.vendorReference,
        acceptedAt: scenario.acceptedAt,
        completedAt: scenario.completedAt,
      });

      for (const [actorType, actorUserId, eventType, message] of scenario.events) {
        await createEvent(client, assignment.id, actorUserId, actorType, eventType, message);
      }

      seededOrders.push({
        orderNumber: scenario.orderNumber,
        assignmentId: assignment.id,
        vendorUsername: scenario.vendor.username,
        orderDetailLink: formatLink(`/partner/orders/${assignment.id}`),
        portalLink: formatLink(`/partner/${scenario.vendorPortalSlug}`),
      });
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          password: PASSWORD,
          admin: {
            username: admin.username,
            loginLink: formatLink("/admin/login"),
          },
          vendors: [
            {
              username: vendorAlpha.username,
              portalSlug: "xuong-in-alpha",
              portalLink: formatLink("/partner/xuong-in-alpha"),
            },
            {
              username: vendorBeta.username,
              portalSlug: "xuong-in-beta",
              portalLink: formatLink("/partner/xuong-in-beta"),
            },
          ],
          customers: [
            {
              username: customerOne.username,
            },
            {
              username: customerTwo.username,
            },
          ],
          orders: seededOrders,
        },
        null,
        2
      )
    );
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
