import { randomBytes, scryptSync } from "node:crypto";
import { Client } from "pg";

const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "12313";
const BASE_URL = process.env.SEED_BASE_URL ?? "";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function withBaseUrl(path) {
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

async function upsertUser(client, input) {
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
    [input.username, hashPassword(PASSWORD), input.role]
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
      user.id,
      input.displayName ?? null,
      input.fullName ?? null,
      input.phone ?? null,
      input.vendorPortalSlug ?? null,
      input.bio ?? null,
    ]
  );

  return user;
}

async function seedManagedPages(client) {
  const pageSeeds = [
    {
      slug: "home",
      title: "PinkLove | Thiệp cưới online và cổng quản lý đối tác",
      excerpt: "Nền tảng thiệp cưới online, quản lý đơn hàng và portal riêng cho đối tác sản xuất.",
      status: "published",
      customFields: {
        heroTitle: "Thiệp cưới online, quản lý đơn hàng và cổng đối tác trong một nơi",
        heroDescription:
          "PinkLove giúp bạn quản lý catalogue thiệp cưới, đơn hàng khách hàng và luồng phối hợp vendor theo thời gian thực.",
        heroButtonText: "Xem mẫu thiệp",
        heroButtonLink: "/mau-thiep",
        secondaryButtonText: "Mở công cụ",
        secondaryButtonLink: "/cong-cu",
      },
    },
    {
      slug: "gioi-thieu",
      title: "Giới thiệu PinkLove",
      excerpt: "Nền tảng hỗ trợ thiệp cưới online, catalog sản phẩm và quy trình phối hợp vendor.",
      status: "published",
      customFields: {
        introHeading: "PinkLove tập trung vào trải nghiệm cưới số hóa rõ ràng, dễ vận hành",
        introText:
          "Website mẫu này đã được seed sẵn dữ liệu catalogue, blog, tài khoản khách hàng, affiliate và vendor để bạn kiểm thử toàn bộ flow end-to-end.",
      },
    },
    {
      slug: "lien-he",
      title: "Liên hệ PinkLove",
      excerpt: "Thông tin liên hệ demo của hệ thống PinkLove.",
      status: "published",
      customFields: {
        heroBadge: "Hỗ trợ demo",
        supportTitle: "Liên hệ đội vận hành PinkLove",
        supportDescription:
          "Dữ liệu seed này bao gồm thông tin liên hệ, menu và các route công khai để bạn kiểm thử cả giao diện website lẫn khu làm việc đối tác.",
        responseTime: "Trong vòng 2 giờ làm việc",
        officeHours: "08:30 - 18:00, Thứ 2 - Thứ 7",
        contactEmail: "hello@pinklove.local",
        contactPhone: "0909 000 999",
        contactAddress: "123 Demo Street, District 1, Ho Chi Minh City",
        socialLinks: [],
        contactMethods: [],
        faqItems: [],
        googleMapsEmbed: "https://maps.google.com",
      },
    },
    {
      slug: "dich-vu",
      title: "Dịch vụ PinkLove",
      excerpt: "Gói dịch vụ thiệp cưới, builder và phối hợp vendor.",
      status: "published",
      customFields: {
        plansTitle: "Chọn gói phù hợp với mức độ hỗ trợ",
        plansDescription: "Bạn có thể bắt đầu từ gói cơ bản và nâng cấp khi cần tùy chỉnh sâu hơn.",
        highlightEyebrow: "Khuyến mãi đặc biệt",
        highlightTitle: "Ưu đãi chung cho mọi gói dịch vụ",
        highlightBadgeLabel: "Ưu đãi",
        highlightDescription: "Áp dụng chương trình khuyến mãi theo từng thời điểm cho khách hàng tạo thiệp online tại PinkLove.",
        highlightOffer: "Liên hệ để nhận ưu đãi",
        plansEyebrow: "Bảng gói",
        comparisonEyebrow: "So sánh chi tiết",
        comparisonFirstColumnTitle: "Hạng mục",
        planFeaturesTitle: "Tính năng chính",
        comparisonLimitTitle: "Giới hạn gói",
        pricingPlans: [
          {
            name: "Free Plan",
            price: "0đ",
            summary: "Bắt đầu nhanh với nhu cầu cơ bản.",
          },
          {
            name: "Basic Plan",
            price: "499.000đ",
            badge: "Phổ biến",
            summary: "Phù hợp cho nhu cầu triển khai thực tế, gọn và đủ dùng.",
          },
          {
            name: "Premium Plan",
            price: "1.490.000đ",
            summary: "Dành cho nhu cầu chỉn chu hơn và cần hỗ trợ sâu hơn.",
          },
        ],
        comparisonLimitRows: [
          { label: "Giới hạn hình ảnh", plan1: "10 ảnh", plan2: "50 ảnh", plan3: "100 ảnh" },
          { label: "Lượt xem tối đa", plan1: "300 lượt", plan2: "10K lượt", plan3: "50K lượt" },
          { label: "Số thiệp có thể tạo", plan1: "1 thiệp", plan2: "5 thiệp", plan3: "10 thiệp" },
          { label: "Thời hạn lưu thiệp", plan1: "6 tháng", plan2: "2 năm", plan3: "5 năm" },
          { label: "Sử dụng mẫu thiệp", plan1: "Miễn phí", plan2: "Cơ bản", plan3: "Toàn bộ" },
        ],
        comparisonFeatureRows: [
          { label: "Trang thiết kế thiệp", plan1: true, plan2: true, plan3: true },
          { label: "Tên khách mời tự động", plan1: true, plan2: true, plan3: true },
          { label: "Thư viện nhạc", plan1: true, plan2: true, plan3: true },
          { label: "Tuỳ chỉnh hộp quà tặng và lời chúc", plan1: true, plan2: true, plan3: true },
          { label: "Hộp mừng (QR Ngân hàng)", plan1: true, plan2: true, plan3: true },
          { label: "Hiệu ứng mở phong bì", plan1: true, plan2: true, plan3: true },
          { label: "Hiệu ứng chuyển động, hiệu ứng mở màn", plan1: true, plan2: true, plan3: true },
          { label: "Album ảnh trong thiệp", plan1: false, plan2: true, plan3: true },
          { label: "Nhúng video Youtube", plan1: false, plan2: true, plan3: true },
          { label: "Chữ ký khách mời", plan1: false, plan2: true, plan3: true },
          { label: "Xóa watermark", plan1: false, plan2: true, plan3: true },
          { label: "Sử dụng nhạc nền riêng", plan1: false, plan2: false, plan3: true },
          { label: "Phông chữ tùy chỉnh", plan1: false, plan2: false, plan3: true },
          { label: "Tách nền ảnh (ZenAI)", plan1: false, plan2: false, plan3: true },
        ],
      },
    },
    {
      slug: "cong-cu",
      title: "Công cụ cưới",
      excerpt: "Bộ công cụ hỗ trợ QR và dự toán cưới.",
      status: "published",
      customFields: {},
    },
    {
      slug: "blog",
      title: "Blog cưới PinkLove",
      excerpt: "Bài viết mẫu đã được seed sẵn cho website demo.",
      status: "published",
      customFields: {},
    },
  ];

  for (const page of pageSeeds) {
    await client.query(
      `
        UPDATE managed_pages
        SET
          title = $2,
          excerpt = $3,
          status = $4,
          custom_fields = $5::jsonb,
          updated_at = NOW()
        WHERE slug = $1
      `,
      [page.slug, page.title, page.excerpt, page.status, JSON.stringify(page.customFields)]
    );
  }
}

async function upsertMenu(client, menuName, label, items) {
  const menu = await fetchRow(
    client,
    `
      INSERT INTO navigation_menus (name, label)
      VALUES ($1, $2)
      ON CONFLICT (name)
      DO UPDATE SET
        label = EXCLUDED.label,
        updated_at = NOW()
      RETURNING id
    `,
    [menuName, label]
  );

  await client.query("DELETE FROM navigation_menu_items WHERE menu_id = $1", [menu.id]);

  for (const item of items) {
    await client.query(
      `
        INSERT INTO navigation_menu_items (menu_id, parent_id, label, type, page_slug, url, position)
        VALUES ($1, NULL, $2, $3, $4, $5, $6)
      `,
      [menu.id, item.label, item.type, item.pageSlug ?? null, item.url ?? null, item.position]
    );
  }
}

async function upsertAffiliateAccount(client, input) {
  await client.query(
    `
      INSERT INTO affiliate_accounts (
        user_id,
        code,
        status,
        commission_type,
        commission_value,
        notes,
        approved_by,
        approved_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id)
      DO UPDATE SET
        code = EXCLUDED.code,
        status = EXCLUDED.status,
        commission_type = EXCLUDED.commission_type,
        commission_value = EXCLUDED.commission_value,
        notes = EXCLUDED.notes,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at,
        updated_at = NOW()
    `,
    [
      input.userId,
      input.code,
      input.status,
      input.commissionType,
      input.commissionValue,
      input.notes,
      input.approvedBy ?? null,
      input.approvedAt ?? null,
    ]
  );

  await client.query("DELETE FROM affiliate_clicks WHERE affiliate_user_id = $1", [input.userId]);
  await client.query("DELETE FROM affiliate_conversions WHERE affiliate_user_id = $1", [input.userId]);

  for (const click of input.clicks ?? []) {
    await client.query(
      `
        INSERT INTO affiliate_clicks (affiliate_user_id, affiliate_code, landing_path, referrer, visitor_token, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [input.userId, input.code, click.landingPath, click.referrer ?? null, click.visitorToken ?? null, click.userAgent ?? null]
    );
  }

  for (const conversion of input.conversions ?? []) {
    await client.query(
      `
        INSERT INTO affiliate_conversions (
          affiliate_user_id,
          affiliate_code,
          external_order_ref,
          order_value,
          commission_amount,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        input.userId,
        input.code,
        conversion.externalOrderRef,
        conversion.orderValue,
        conversion.commissionAmount,
        conversion.status,
        JSON.stringify(conversion.metadata ?? {}),
      ]
    );
  }
}

async function upsertOrder(client, input) {
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
        affiliate_user_id,
        affiliate_code,
        paid_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, 'VND',
        $9, 0, 0, $10,
        $3, $5,
        '123 Demo Street', '', 'Ward 1', 'District 1', 'Ho Chi Minh City', '700000', 'VN',
        $11, $12, $13,
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
        affiliate_user_id = EXCLUDED.affiliate_user_id,
        affiliate_code = EXCLUDED.affiliate_code,
        paid_at = EXCLUDED.paid_at,
        updated_at = NOW()
      RETURNING id, order_number
    `,
    [
      input.orderNumber,
      input.userId,
      input.customerName,
      input.customerEmail,
      input.customerPhone,
      input.orderStatus,
      input.paymentStatus,
      input.fulfillmentStatus,
      input.subtotal,
      input.total,
      input.notes,
      input.affiliateUserId ?? null,
      input.affiliateCode ?? null,
    ]
  );

  await client.query(
    `
      DELETE FROM vendor_order_events
      WHERE assignment_id IN (
        SELECT id FROM vendor_order_assignments WHERE order_id = $1
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
          offering_id,
          offering_name,
          offering_slug,
          offering_type,
          fulfillment_type,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        orderId,
        item.offering.id,
        item.offering.name,
        item.offering.slug,
        item.offering.offering_type,
        item.offering.fulfillment_type,
        item.quantity,
        item.unitPrice,
        item.unitPrice * item.quantity,
      ]
    );
  }
}

async function createPayment(client, orderId, amount, externalRef) {
  await client.query(
    `
      INSERT INTO commerce_payments (order_id, method, provider, amount, status, external_ref, paid_at)
      VALUES ($1, 'bank_transfer', 'manual_bank_transfer', $2, 'paid', $3, NOW())
    `,
    [orderId, amount, externalRef]
  );
}

async function createVendorAssignment(client, input) {
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
    [
      input.orderId,
      input.vendorUserId,
      input.status,
      input.internalNote,
      input.vendorNote,
      input.vendorReference,
      input.acceptedAt ?? null,
      input.completedAt ?? null,
    ]
  );

  for (const event of input.events ?? []) {
    await client.query(
      `
        INSERT INTO vendor_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [assignment.id, event.actorUserId ?? null, event.actorType, event.eventType, event.message]
    );
  }

  return assignment;
}

function sumItems(items) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    const offerings = await fetchRows(
      client,
      `
        SELECT id, slug, name, offering_type, fulfillment_type, price
        FROM offerings
        WHERE status = 'published'
        ORDER BY created_at ASC
        LIMIT 3
      `
    );

    if (offerings.length === 0) {
      throw new Error(
        "No published offerings found. Start the dev stack with `./setup up` first so database bootstrap seeds offering/blog/page data."
      );
    }

    const [offeringA, offeringB = offerings[0], offeringC = offerings[0]] = offerings.map((offering) => ({
      ...offering,
      price: Number(offering.price ?? 0),
    }));

    await seedManagedPages(client);

    await upsertMenu(client, "header", "Header Menu", [
      { label: "Trang chủ", type: "page", pageSlug: "home", position: 0 },
      { label: "Giới thiệu", type: "page", pageSlug: "gioi-thieu", position: 1 },
      { label: "Mẫu thiệp", type: "page", pageSlug: "mau-thiep", position: 2 },
      { label: "Tự tạo thiệp", type: "page", pageSlug: "tu-tao-thiep", position: 3 },
      { label: "Dịch vụ", type: "page", pageSlug: "dich-vu", position: 4 },
      { label: "Blog", type: "page", pageSlug: "blog", position: 5 },
      { label: "Liên hệ", type: "page", pageSlug: "lien-he", position: 6 },
    ]);

    await upsertMenu(client, "footer", "Footer Menu", [
      { label: "Trang chủ", type: "page", pageSlug: "home", position: 0 },
      { label: "Công cụ", type: "page", pageSlug: "cong-cu", position: 1 },
      { label: "QR Builder", type: "page", pageSlug: "cong-cu/tao-ma-qr", position: 2 },
      { label: "Dự toán cưới", type: "page", pageSlug: "cong-cu/du-toan-cuoi", position: 3 },
      { label: "Blog", type: "page", pageSlug: "blog", position: 4 },
      { label: "Liên hệ", type: "page", pageSlug: "lien-he", position: 5 },
    ]);

    const vendorAlpha = await upsertUser(client, {
      username: "vendor_alpha",
      role: "VENDOR",
      displayName: "Xuong In Alpha",
      fullName: "Xuong In Alpha",
      phone: "0900000001",
      vendorPortalSlug: "xuong-in-alpha",
      bio: "Vendor Alpha seeded for partner portal demo.",
    });

    const vendorBeta = await upsertUser(client, {
      username: "vendor_beta",
      role: "VENDOR",
      displayName: "Xuong In Beta",
      fullName: "Xuong In Beta",
      phone: "0900000002",
      vendorPortalSlug: "xuong-in-beta",
      bio: "Vendor Beta seeded for partner portal demo.",
    });

    const customerOne = await upsertUser(client, {
      username: "customer_one",
      role: "CUSTOMER",
      displayName: "Nguyen Lan",
      fullName: "Nguyen Lan",
      phone: "0900000011",
      bio: "Customer seeded for website demo.",
    });

    const customerTwo = await upsertUser(client, {
      username: "customer_two",
      role: "CUSTOMER",
      displayName: "Tran Minh",
      fullName: "Tran Minh",
      phone: "0900000012",
      bio: "Customer seeded for website demo.",
    });

    const affiliateRose = await upsertUser(client, {
      username: "affiliate_rose",
      role: "AFFILIATE",
      displayName: "Rose Partner",
      fullName: "Rose Partner",
      phone: "0900000021",
      bio: "Active affiliate seeded for tracking demo.",
    });

    const affiliateNova = await upsertUser(client, {
      username: "affiliate_nova",
      role: "AFFILIATE",
      displayName: "Nova Partner",
      fullName: "Nova Partner",
      phone: "0900000022",
      bio: "Pending affiliate seeded for admin review demo.",
    });

    await upsertAffiliateAccount(client, {
      userId: affiliateRose.id,
      code: "rose-love",
      status: "active",
      commissionType: "percent",
      commissionValue: 8,
      notes: "Affiliate active seed account.",
      approvedAt: "2026-04-08T08:30:00.000Z",
      clicks: [
        { landingPath: "/", referrer: "https://facebook.com", visitorToken: "seed-visitor-001", userAgent: "SeedAgent/1.0" },
        { landingPath: "/mau-thiep", referrer: "https://instagram.com", visitorToken: "seed-visitor-002", userAgent: "SeedAgent/1.0" },
      ],
      conversions: [
        {
          externalOrderRef: "AFF-SEED-001",
          orderValue: 1290000,
          commissionAmount: 103200,
          status: "approved",
          metadata: { source: "seed" },
        },
      ],
    });

    await upsertAffiliateAccount(client, {
      userId: affiliateNova.id,
      code: "nova-plan",
      status: "pending",
      commissionType: "percent",
      commissionValue: 10,
      notes: "Affiliate pending seed account.",
      clicks: [
        { landingPath: "/blog", referrer: "https://tiktok.com", visitorToken: "seed-visitor-003", userAgent: "SeedAgent/1.0" },
      ],
      conversions: [],
    });

    const orderScenarios = [
      {
        orderNumber: "PL-DEMO-001",
        customer: customerOne,
        vendor: vendorAlpha,
        vendorPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
        notes: "Demo order pending vendor confirmation.",
        assignmentStatus: "pending_confirmation",
        internalNote: "Don demo 001 dang cho vendor xac nhan.",
        vendorNote: "",
        vendorReference: "",
        items: [{ offering: offeringA, quantity: 1, unitPrice: offeringA.price || 990000 }],
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 001." },
        ],
      },
      {
        orderNumber: "PL-DEMO-002",
        customer: customerOne,
        vendor: vendorAlpha,
        vendorPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Demo order in progress by vendor Alpha.",
        assignmentStatus: "in_progress",
        internalNote: "Don in gap can theo doi hang ngay.",
        vendorNote: "Da duyet file va dang san xuat.",
        vendorReference: "ALPHA-002",
        acceptedAt: "2026-04-10T08:00:00.000Z",
        items: [
          { offering: offeringA, quantity: 1, unitPrice: offeringA.price || 990000 },
          { offering: offeringB, quantity: 1, unitPrice: offeringB.price || 1290000 },
        ],
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 002." },
          { actorUserId: vendorAlpha.id, actorType: "vendor", eventType: "status_changed", message: "Vendor đã cập nhật trạng thái sang in_progress." },
          { actorUserId: vendorAlpha.id, actorType: "vendor", eventType: "note_added", message: "Vendor note: Da duyet file va dang san xuat." },
        ],
      },
      {
        orderNumber: "PL-DEMO-003",
        customer: customerTwo,
        vendor: vendorBeta,
        vendorPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "ready_to_ship",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Demo order waiting admin review.",
        assignmentStatus: "ready_for_review",
        internalNote: "Cho admin review mau in.",
        vendorNote: "Da in xong mau, cho duyet.",
        vendorReference: "BETA-003",
        acceptedAt: "2026-04-09T09:30:00.000Z",
        items: [{ offering: offeringC, quantity: 2, unitPrice: offeringC.price || 500000 }],
        affiliateUserId: affiliateRose.id,
        affiliateCode: "rose-love",
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 003." },
          { actorUserId: vendorBeta.id, actorType: "vendor", eventType: "status_changed", message: "Vendor đã cập nhật trạng thái sang ready_for_review." },
          { actorUserId: vendorBeta.id, actorType: "vendor", eventType: "note_added", message: "Vendor note: Da in xong mau, cho duyet." },
        ],
      },
      {
        orderNumber: "PL-DEMO-004",
        customer: customerTwo,
        vendor: vendorBeta,
        vendorPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "completed",
        paymentStatus: "paid",
        fulfillmentStatus: "delivered",
        notes: "Demo order completed for reporting views.",
        assignmentStatus: "completed",
        internalNote: "Da giao xong don test 004.",
        vendorNote: "Da giao hang thanh cong.",
        vendorReference: "BETA-004",
        acceptedAt: "2026-04-08T10:00:00.000Z",
        completedAt: "2026-04-11T16:30:00.000Z",
        items: [{ offering: offeringB, quantity: 1, unitPrice: offeringB.price || 1290000 }],
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 004." },
          { actorUserId: vendorBeta.id, actorType: "vendor", eventType: "status_changed", message: "Vendor đã cập nhật trạng thái sang completed." },
          { actorUserId: vendorBeta.id, actorType: "vendor", eventType: "note_added", message: "Vendor note: Da giao hang thanh cong." },
        ],
      },
    ];

    const seededOrders = [];

    for (const scenario of orderScenarios) {
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
        affiliateUserId: scenario.affiliateUserId,
        affiliateCode: scenario.affiliateCode,
      });

      await createOrderItems(client, order.id, scenario.items);
      await createPayment(client, order.id, subtotal, `PAY-${scenario.orderNumber}`);

      const assignment = await createVendorAssignment(client, {
        orderId: order.id,
        vendorUserId: scenario.vendor.id,
        status: scenario.assignmentStatus,
        internalNote: scenario.internalNote,
        vendorNote: scenario.vendorNote,
        vendorReference: scenario.vendorReference,
        acceptedAt: scenario.acceptedAt,
        completedAt: scenario.completedAt,
        events: scenario.events,
      });

      seededOrders.push({
        orderNumber: scenario.orderNumber,
        assignmentId: assignment.id,
        vendor: scenario.vendor.username,
        orderDetailLink: withBaseUrl(`/partner/orders/${assignment.id}`),
        portalLink: withBaseUrl(`/partner/${scenario.vendorPortalSlug}`),
      });
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          password: PASSWORD,
          website: {
            home: withBaseUrl("/"),
            templates: withBaseUrl("/mau-thiep"),
            builder: withBaseUrl("/tu-tao-thiep"),
            blog: withBaseUrl("/blog"),
            contact: withBaseUrl("/lien-he"),
          },
          vendors: [
            {
              username: vendorAlpha.username,
              portalLink: withBaseUrl("/partner/xuong-in-alpha"),
            },
            {
              username: vendorBeta.username,
              portalLink: withBaseUrl("/partner/xuong-in-beta"),
            },
          ],
          customers: [
            { username: customerOne.username, loginLink: withBaseUrl("/customer/login") },
            { username: customerTwo.username, loginLink: withBaseUrl("/customer/login") },
          ],
          affiliates: [
            { username: affiliateRose.username, code: "rose-love" },
            { username: affiliateNova.username, code: "nova-plan" },
          ],
          orders: seededOrders,
          notes: [
            "Khong tao admin moi. Hay dung admin co san cua he thong de test admin area.",
            "Script nay gia dinh migration + offering/blog/page seed he thong da duoc bootstrap sau khi chay `./setup up`.",
          ],
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
