import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const PASSWORD = process.env.SEED_PROVIDER_PASSWORD ?? "12313";
const BASE_URL = process.env.SEED_BASE_URL ?? "";
const rootDir = path.resolve(process.cwd(), "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, ".env.local"));

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER || "app";
  const password = process.env.POSTGRES_PASSWORD || "change-me";
  const db = process.env.POSTGRES_DB || "app";
  const port = process.env.POSTGRES_PORT || "5433";

  return `postgresql://${user}:${password}@localhost:${port}/${db}`;
}

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

async function upsertUser(client, { username, role, displayName, fullName, phone, providerPortalSlug, bio }) {
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
      INSERT INTO user_profiles (user_id, display_name, full_name, phone, provider_portal_slug, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        provider_portal_slug = EXCLUDED.provider_portal_slug,
        bio = EXCLUDED.bio,
        updated_at = NOW()
    `,
    [user.id, displayName, fullName, phone, providerPortalSlug ?? null, bio]
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
      DELETE FROM provider_order_events
      WHERE assignment_id IN (
        SELECT id
        FROM provider_order_assignments
        WHERE order_id = $1
      )
    `,
    [order.id]
  );
  await client.query("DELETE FROM provider_order_assignments WHERE order_id = $1", [order.id]);
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
        item.offering.type,
        item.offering.fulfillment_type,
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
    providerId,
    status,
    internalNote,
    providerNote,
    providerReference,
    acceptedAt,
    completedAt,
  } = assignmentInput;

  const assignment = await fetchRow(
    client,
    `
      INSERT INTO provider_order_assignments (
        order_id,
        provider_user_id,
        status,
        internal_note,
        provider_note,
        provider_reference,
        accepted_at,
        completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [orderId, providerId, status, internalNote, providerNote, providerReference, acceptedAt ?? null, completedAt ?? null]
  );

  return assignment;
}

async function createEvent(client, assignmentId, actorUserId, actorType, eventType, message) {
  await client.query(
    `
      INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [assignmentId, actorUserId ?? null, actorType, eventType, message]
  );
}

async function upsertMarketplaceProvider(client, { ownerUserId, slug, displayName, providerType, phone, bio, description }) {
  const provider = await fetchRow(
    client,
    `
      INSERT INTO providers (owner_user_id, slug, display_name, provider_type, status, metadata)
      VALUES ($1, $2, $3, $4, 'published', '{"source":"seed_provider_portal_fixtures"}'::jsonb)
      ON CONFLICT (slug)
      DO UPDATE SET
        owner_user_id = EXCLUDED.owner_user_id,
        display_name = EXCLUDED.display_name,
        provider_type = EXCLUDED.provider_type,
        status = 'published',
        metadata = providers.metadata || EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id, slug, display_name
    `,
    [ownerUserId, slug, displayName, providerType]
  );

  await client.query(
    `
      INSERT INTO provider_profiles (provider_id, business_name, contact_email, phone, bio, description, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, '{"source":"seed_provider_portal_fixtures"}'::jsonb)
      ON CONFLICT (provider_id)
      DO UPDATE SET
        business_name = EXCLUDED.business_name,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        description = EXCLUDED.description,
        metadata = provider_profiles.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    `,
    [provider.id, displayName, `${slug}@pinklove.local`, phone, bio, description]
  );

  return provider;
}

async function upsertProviderService(client, { providerId, offering, serviceKind, durationMinutes, serviceArea }) {
  const existing = await fetchRow(
    client,
    "SELECT id FROM provider_services WHERE provider_id = $1 AND offering_id = $2 LIMIT 1",
    [providerId, offering.id]
  );

  if (existing?.id) {
    return await fetchRow(
      client,
      `
        UPDATE provider_services
        SET
          title = $2,
          status = 'active',
          base_price = $3,
          metadata = provider_services.metadata || jsonb_build_object(
            'source', 'seed_provider_portal_fixtures',
            'service_kind', $4::text,
            'service_location_mode', $4::text,
            'duration_minutes', $5::int,
            'service_area', $6::text
          ),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [existing.id, offering.name, Number(offering.base_price ?? 0), serviceKind, durationMinutes, serviceArea]
    );
  }

  const service = await fetchRow(
    client,
    `
      INSERT INTO provider_services (provider_id, offering_id, title, status, base_price, metadata)
      VALUES (
        $1,
        $2,
        $3,
        'active',
        $4,
        jsonb_build_object(
          'source', 'seed_provider_portal_fixtures',
          'service_kind', $5::text,
          'service_location_mode', $5::text,
          'duration_minutes', $6::int,
          'service_area', $7::text
        )
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [providerId, offering.id, offering.name, Number(offering.base_price ?? 0), serviceKind, durationMinutes, serviceArea]
  );
  return service;
}

async function seedCalendarAndSlots(client, { providerId, providerServiceId, offeringId, label, slotBaseHour }) {
  const calendar = await fetchRow(
    client,
    `
      INSERT INTO booking_calendars (provider_id, key, label, timezone, config)
      VALUES ($1, 'seed_demo', $2, 'Asia/Ho_Chi_Minh', '{"source":"seed_provider_portal_fixtures"}'::jsonb)
      ON CONFLICT (provider_id, key)
      DO UPDATE SET label = EXCLUDED.label, config = booking_calendars.config || EXCLUDED.config, updated_at = NOW()
      RETURNING id
    `,
    [providerId, label]
  );

  await client.query("DELETE FROM provider_time_slots WHERE provider_id = $1 AND metadata ->> 'source' = 'seed_provider_portal_fixtures'", [providerId]);
  await client.query("DELETE FROM provider_availability WHERE provider_id = $1 AND metadata ->> 'source' = 'seed_provider_portal_fixtures'", [providerId]);

  const availability = await fetchRow(
    client,
    `
      INSERT INTO provider_availability (
        provider_id, calendar_id, provider_service_id, offering_id, availability_kind,
        day_of_week, starts_at, ends_at, duration_minutes, capacity, status, metadata
      )
      VALUES ($1, $2, $3, $4, 'consultation', 6, '09:00', '17:00', 120, 1, 'available', '{"source":"seed_provider_portal_fixtures"}'::jsonb)
      RETURNING id
    `,
    [providerId, calendar.id, providerServiceId, offeringId]
  );

  const slots = [];
  for (let index = 0; index < 4; index += 1) {
    const startsAt = new Date(Date.UTC(2026, 6, 4 + index, slotBaseHour, 0, 0));
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
    const slot = await fetchRow(
      client,
      `
        INSERT INTO provider_time_slots (
          provider_id, calendar_id, availability_id, provider_service_id, offering_id,
          availability_kind, starts_at, ends_at, capacity, status, metadata
        )
        VALUES ($1, $2, $3, $4, $5, 'consultation', $6, $7, 1, 'available', '{"source":"seed_provider_portal_fixtures"}'::jsonb)
        RETURNING id, starts_at
      `,
      [providerId, calendar.id, availability.id, providerServiceId, offeringId, startsAt.toISOString(), endsAt.toISOString()]
    );
    slots.push(slot);
  }

  return slots;
}

async function seedLeadQuoteBookingFlow(client, { customer, provider, offering, slot, status, quoteStatus, bookingStatus, message }) {
  await client.query(
    `
      DELETE FROM booking_status_logs
      WHERE booking_id IN (
        SELECT id FROM bookings WHERE metadata ->> 'seedKey' = $1
      )
    `,
    [`lead-${customer.username}-${provider.slug}-${status}`]
  );
  await client.query(
    `
      DELETE FROM booking_items
      WHERE booking_id IN (
        SELECT id FROM bookings WHERE metadata ->> 'seedKey' = $1
      )
    `,
    [`lead-${customer.username}-${provider.slug}-${status}`]
  );
  await client.query("DELETE FROM bookings WHERE metadata ->> 'seedKey' = $1", [`lead-${customer.username}-${provider.slug}-${status}`]);
  await client.query("DELETE FROM vendor_leads WHERE message = $1 AND user_id = $2 AND provider_id = $3", [message, customer.id, provider.id]);

  const lead = await fetchRow(
    client,
    `
      INSERT INTO vendor_leads (provider_id, user_id, offering_id, budget, event_date, message, status)
      VALUES ($1, $2, $3, $4, '2026-07-12', $5, $6)
      RETURNING id
    `,
    [provider.id, customer.id, offering.id, Number(offering.base_price ?? 0) || 1200000, message, status]
  );

  const quote = await fetchRow(
    client,
    `
      INSERT INTO vendor_quotes (lead_id, provider_id, amount, message, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [
      lead.id,
      provider.id,
      (Number(offering.base_price ?? 0) || 1200000) + 300000,
      "Seed quote: đã bao gồm tư vấn lịch, triển khai và ưu tiên slot quảng cáo.",
      quoteStatus,
    ]
  );

  if (!bookingStatus) {
    return { leadId: lead.id, quoteId: quote.id, bookingId: null };
  }

  const booking = await fetchRow(
    client,
    `
      INSERT INTO bookings (booking_number, user_id, status, scheduled_at, total_amount, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id
    `,
    [
      `BK-SEED-${provider.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${status.toUpperCase()}`,
      customer.id,
      bookingStatus,
      slot.starts_at,
      (Number(offering.base_price ?? 0) || 1200000) + 300000,
      JSON.stringify({
        source: "seed_provider_portal_fixtures",
        seedKey: `lead-${customer.username}-${provider.slug}-${status}`,
        vendorLeadId: lead.id,
        vendorQuoteId: quote.id,
        providerTimeSlotId: slot.id,
        adPriority: "slot_confirmed",
      }),
    ]
  );

  await client.query(
    `
      INSERT INTO booking_items (booking_id, offering_id, provider_type, provider_id, title, quantity, unit_price, line_total, metadata)
      VALUES ($1, $2, $3, $4, $5, 1, $6, $6, '{"source":"seed_provider_portal_fixtures"}'::jsonb)
    `,
    [booking.id, offering.id, "studio", provider.id, offering.name, (Number(offering.base_price ?? 0) || 1200000) + 300000]
  );
  await client.query(
    `
      INSERT INTO booking_status_logs (booking_id, actor_user_id, from_status, to_status, note)
      VALUES ($1, $2, NULL, $3, $4)
    `,
    [booking.id, customer.id, bookingStatus, "Seed booking từ quote đã chấp nhận và slot ưu tiên quảng cáo."]
  );
  await client.query(
    `
      UPDATE provider_time_slots
      SET status = CASE WHEN $2 = 'confirmed' THEN 'booked' ELSE 'held' END,
          metadata = provider_time_slots.metadata || jsonb_build_object('bookingId', $3::text, 'adPriority', 'slot_confirmed'),
          updated_at = NOW()
      WHERE id = $1
    `,
    [slot.id, bookingStatus, booking.id]
  );

  return { leadId: lead.id, quoteId: quote.id, bookingId: booking.id };
}

async function insertAdEvents(client, { campaignId, placementId, userId, targetType, targetId, counts }) {
  for (const [eventType, count] of Object.entries(counts)) {
    for (let index = 0; index < count; index += 1) {
      await client.query(
        `
          INSERT INTO ad_events (campaign_id, placement_id, event_type, user_id, target_type, target_id, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, '{"source":"seed_provider_portal_fixtures"}'::jsonb)
        `,
        [campaignId, placementId, eventType, userId ?? null, targetType ?? null, targetId ?? null]
      );
    }
  }
}

async function insertProviderPromotionEvents(client, { promotionId, providerId, userId, targetType, targetId, counts }) {
  for (const [eventType, count] of Object.entries(counts)) {
    for (let index = 0; index < count; index += 1) {
      await client.query(
        `
          INSERT INTO provider_promotion_events (promotion_id, provider_id, event_type, user_id, target_type, target_id, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, '{"source":"seed_provider_portal_fixtures"}'::jsonb)
        `,
        [promotionId, providerId, eventType, userId ?? null, targetType ?? null, targetId ?? null]
      );
    }
  }
}

async function seedAdsAndProviderPriority(client, { customer, marketplaceAlpha, marketplaceBeta, promotedProviders = [], offeringA, offeringB }) {
  await client.query(`
    DELETE FROM ad_events
    WHERE campaign_id IN (
      SELECT id FROM ad_campaigns WHERE metadata ->> 'source' = 'seed_provider_portal_fixtures'
    )
  `);
  await client.query(`
    DELETE FROM provider_promotion_events
    WHERE promotion_id IN (
      SELECT id FROM provider_promotions WHERE metadata ->> 'source' = 'seed_provider_portal_fixtures'
    )
  `);
  await client.query("DELETE FROM provider_promotions WHERE metadata ->> 'source' = 'seed_provider_portal_fixtures'");
  await client.query("DELETE FROM ad_campaigns WHERE metadata ->> 'source' = 'seed_provider_portal_fixtures'");
  await client.query("DELETE FROM ad_creatives WHERE metadata ->> 'source' = 'seed_provider_portal_fixtures'");
  await client.query("DELETE FROM advertisers WHERE metadata ->> 'source' = 'seed_provider_portal_fixtures'");

  const advertiser = await fetchRow(
    client,
    `
      INSERT INTO advertisers (name, contact_name, contact_email, contact_phone, website_url, status, notes, metadata)
      VALUES (
        'Seed Wedding Ads Partner',
        'Marketing Seed',
        'marketing.seed@pinklove.local',
        '0900000088',
        'https://pinklove.local/seed-ads',
        'active',
        'Seed advertiser de test banner booking va campaign duyet quang cao.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `
  );

  const placements = {
    homeHero: await fetchRow(client, "SELECT id, key FROM ad_placements WHERE key = 'home_hero_banner' LIMIT 1"),
    blogSidebar: await fetchRow(client, "SELECT id, key FROM ad_placements WHERE key = 'blog_sidebar' LIMIT 1"),
    providerTop: await fetchRow(client, "SELECT id, key FROM ad_placements WHERE key = 'provider_directory_top' LIMIT 1"),
    categoryTop: await fetchRow(client, "SELECT id, key FROM ad_placements WHERE key = 'category_top' LIMIT 1"),
    searchTop: await fetchRow(client, "SELECT id, key FROM ad_placements WHERE key = 'search_result_top' LIMIT 1"),
  };

  const heroCreative = await fetchRow(
    client,
    `
      INSERT INTO ad_creatives (
        advertiser_id, title, creative_type, image_url, mobile_image_url, target_url,
        alt_text, headline, body, cta_label, status, metadata
      )
      VALUES (
        $1,
        'Seed banner wedding season',
        'image',
        '/uploads/seed-offerings/general-offering-01.svg',
        '/uploads/seed-offerings/general-offering-03.svg',
        '/services',
        'Seed wedding season banner',
        'Wedding season booking',
        'Banner demo cho luong thue quang cao ben ngoai.',
        'Xem goi',
        'approved',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id]
  );

  const blogCreative = await fetchRow(
    client,
    `
      INSERT INTO ad_creatives (
        advertiser_id, title, creative_type, image_url, target_url,
        alt_text, headline, body, cta_label, status, metadata
      )
      VALUES (
        $1,
        'Seed sidebar sponsor',
        'image',
        '/uploads/seed-offerings/general-offering-06.svg',
        '/blog',
        'Seed blog sidebar sponsor',
        'Sponsor noi dung cuoi',
        'Creative demo cho placement blog/sidebar.',
        'Doc bai viet',
        'approved',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id]
  );

  const categoryCreative = await fetchRow(
    client,
    `
      INSERT INTO ad_creatives (
        advertiser_id, title, creative_type, image_url, target_url,
        alt_text, headline, body, cta_label, status, metadata
      )
      VALUES (
        $1,
        'Seed category top visual',
        'image',
        '/uploads/seed-offerings/seed-red-wedding-web-01.png',
        '/services',
        'Seed category top sponsor',
        'Dich vu cuoi noi bat',
        'Creative demo cho category/search placement.',
        'Kham pha',
        'approved',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id]
  );

  const searchCreative = await fetchRow(
    client,
    `
      INSERT INTO ad_creatives (
        advertiser_id, title, creative_type, image_url, target_url,
        alt_text, headline, body, cta_label, status, metadata
      )
      VALUES (
        $1,
        'Seed search boost visual',
        'image',
        '/uploads/seed-offerings/seed-red-wedding-web-02.png',
        '/search',
        'Seed search boost sponsor',
        'Tim provider phu hop nhanh hon',
        'Creative demo cho search result top.',
        'Tim kiem',
        'approved',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id]
  );

  const heroCampaign = await fetchRow(
    client,
    `
      INSERT INTO ad_campaigns (
        advertiser_id, placement_id, creative_id, name, target_url, status,
        payment_status, price, starts_at, ends_at, notes, metadata
      )
      VALUES (
        $1, $2, $3, 'Seed Home Hero Paid Banner', '/services', 'active',
        'paid', 2500000, NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days',
        'Seed campaign cho trang admin marketing ads/banner-ads.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id, placements.homeHero.id, heroCreative.id]
  );

  const blogCampaign = await fetchRow(
    client,
    `
      INSERT INTO ad_campaigns (
        advertiser_id, placement_id, creative_id, name, target_url, status,
        payment_status, price, starts_at, ends_at, notes, metadata
      )
      VALUES (
        $1, $2, $3, 'Seed Blog Sidebar Sponsor', '/blog', 'active',
        'paid', 1200000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days',
        'Seed campaign cho placement blog sidebar.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id, placements.blogSidebar.id, blogCreative.id]
  );

  const categoryCampaign = await fetchRow(
    client,
    `
      INSERT INTO ad_campaigns (
        advertiser_id, placement_id, creative_id, name, target_url, status,
        payment_status, price, starts_at, ends_at, notes, metadata
      )
      VALUES (
        $1, $2, $3, 'Seed Category Top Sponsor', '/services', 'active',
        'paid', 1500000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '25 days',
        'Seed campaign cho category top placement.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id, placements.categoryTop.id, categoryCreative.id]
  );

  const searchCampaign = await fetchRow(
    client,
    `
      INSERT INTO ad_campaigns (
        advertiser_id, placement_id, creative_id, name, target_url, status,
        payment_status, price, starts_at, ends_at, notes, metadata
      )
      VALUES (
        $1, $2, $3, 'Seed Search Result Boost', '/search', 'active',
        'paid', 900000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days',
        'Seed campaign cho search result top placement.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [advertiser.id, placements.searchTop.id, searchCreative.id]
  );

  const extraCampaignIds = [];
  const campaignSeeds = [
    ["Seed Homepage Sponsor A", placements.homeHero, heroCreative, "/services", 2100000],
    ["Seed Homepage Sponsor B", placements.homeHero, categoryCreative, "/services", 1900000],
    ["Seed Blog Sponsor A", placements.blogSidebar, blogCreative, "/blog", 800000],
    ["Seed Blog Sponsor B", placements.blogSidebar, searchCreative, "/blog", 700000],
    ["Seed Category Sponsor A", placements.categoryTop, categoryCreative, "/services", 1300000],
    ["Seed Category Sponsor B", placements.categoryTop, heroCreative, "/services", 1250000],
    ["Seed Search Sponsor A", placements.searchTop, searchCreative, "/search", 650000],
    ["Seed Search Sponsor B", placements.searchTop, blogCreative, "/search", 620000],
    ["Seed Footer Awareness A", placements.blogSidebar, categoryCreative, "/contact", 580000],
    ["Seed Provider Directory A", placements.providerTop, heroCreative, "/services", 1100000],
    ["Seed Provider Directory B", placements.providerTop, searchCreative, "/services", 980000],
    ["Seed Offering Detail A", placements.categoryTop, blogCreative, "/mau-thiep", 760000],
    ["Seed Search Retarget A", placements.searchTop, categoryCreative, "/search", 540000],
  ];

  for (const [name, placement, creative, targetUrl, price] of campaignSeeds) {
    const campaign = await fetchRow(
      client,
      `
        INSERT INTO ad_campaigns (
          advertiser_id, placement_id, creative_id, name, target_url, status,
          payment_status, price, starts_at, ends_at, notes, metadata
        )
        VALUES (
          $1, $2, $3, $4, $5, 'active',
          'paid', $6, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days',
          'Seed extra campaign de quan sat table va placement.',
          '{"source":"seed_provider_portal_fixtures"}'::jsonb
        )
        RETURNING id
      `,
      [advertiser.id, placement.id, creative.id, name, targetUrl, price]
    );
    extraCampaignIds.push(campaign.id);
    await insertAdEvents(client, {
      campaignId: campaign.id,
      placementId: placement.id,
      userId: customer.id,
      targetType: "campaign_seed",
      targetId: String(name).toLowerCase().replaceAll(" ", "-"),
      counts: { impression: 8, click: 2 },
    });
  }

  await insertAdEvents(client, {
    campaignId: heroCampaign.id,
    placementId: placements.homeHero.id,
    userId: customer.id,
    targetType: "landing",
    targetId: "home",
    counts: { impression: 18, click: 5, conversion: 1 },
  });
  await insertAdEvents(client, {
    campaignId: blogCampaign.id,
    placementId: placements.blogSidebar.id,
    userId: customer.id,
    targetType: "blog",
    targetId: "seed-sidebar",
    counts: { impression: 11, click: 3 },
  });
  await insertAdEvents(client, {
    campaignId: categoryCampaign.id,
    placementId: placements.categoryTop.id,
    userId: customer.id,
    targetType: "category",
    targetId: "services",
    counts: { impression: 15, click: 4, lead: 1 },
  });
  await insertAdEvents(client, {
    campaignId: searchCampaign.id,
    placementId: placements.searchTop.id,
    userId: customer.id,
    targetType: "search",
    targetId: "provider",
    counts: { impression: 9, click: 2 },
  });

  const featuredPlan = await fetchRow(client, "SELECT id FROM provider_promotion_plans WHERE key = 'featured_provider_30' LIMIT 1");
  const categoryPlan = await fetchRow(client, "SELECT id FROM provider_promotion_plans WHERE key = 'category_top_30' LIMIT 1");
  const searchPlan = await fetchRow(client, "SELECT id FROM provider_promotion_plans WHERE key = 'search_boost_14' LIMIT 1");

  const alphaPromotion = await fetchRow(
    client,
    `
      INSERT INTO provider_promotions (
        provider_id, plan_id, placement_id, offering_id, target_type, target_id,
        title, status, payment_status, priority_weight, price, starts_at, ends_at,
        admin_notes, provider_notes, metadata
      )
      VALUES (
        $1, $2, $3, $4, 'provider', $1,
        'Seed Alpha featured provider', 'active', 'paid', 180, 1800000,
        NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days',
        'Seed provider top/xuong top tra phi de uu tien hien thi.',
        'Provider Alpha dang chay goi featured.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [marketplaceAlpha.id, featuredPlan.id, placements.providerTop.id, offeringA.id]
  );

  const betaPromotion = await fetchRow(
    client,
    `
      INSERT INTO provider_promotions (
        provider_id, plan_id, placement_id, offering_id, target_type, target_id,
        title, status, payment_status, priority_weight, price, starts_at, ends_at,
        admin_notes, provider_notes, metadata
      )
      VALUES (
        $1, $2, $3, $4, 'offering', $4,
        'Seed Beta category boost', 'active', 'waived', 140, 0,
        NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days',
        'Seed uu tien mien phi cho provider doi tac chat luong.',
        'Provider Beta duoc admin cap boost theo category.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [marketplaceBeta.id, categoryPlan.id, placements.categoryTop.id, offeringB.id]
  );

  const betaDirectoryPromotion = await fetchRow(
    client,
    `
      INSERT INTO provider_promotions (
        provider_id, plan_id, placement_id, offering_id, target_type, target_id,
        title, status, payment_status, priority_weight, price, starts_at, ends_at,
        admin_notes, provider_notes, metadata
      )
      VALUES (
        $1, $2, $3, $4, 'provider', $1,
        'Seed Beta featured provider', 'active', 'waived', 155, 0,
        NOW() - INTERVAL '1 day', NOW() + INTERVAL '21 days',
        'Seed provider priority mien phi cho doi tac chat luong.',
        'Provider Beta duoc hien trong danh sach uu tien ngoai client.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [marketplaceBeta.id, featuredPlan.id, placements.providerTop.id, offeringB.id]
  );

  const alphaSearchPromotion = await fetchRow(
    client,
    `
      INSERT INTO provider_promotions (
        provider_id, plan_id, placement_id, offering_id, target_type, target_id,
        title, status, payment_status, priority_weight, price, starts_at, ends_at,
        admin_notes, provider_notes, metadata
      )
      VALUES (
        $1, $2, $3, $4, 'search', 'wedding-provider',
        'Seed Alpha search boost', 'active', 'paid', 125, 650000,
        NOW() - INTERVAL '1 day', NOW() + INTERVAL '13 days',
        'Seed search boost provider/offering.',
        'Provider Alpha dang chay boost ket qua tim kiem.',
        '{"source":"seed_provider_portal_fixtures"}'::jsonb
      )
      RETURNING id
    `,
    [marketplaceAlpha.id, searchPlan.id, placements.searchTop.id, offeringA.id]
  );

  await insertProviderPromotionEvents(client, {
    promotionId: alphaPromotion.id,
    providerId: marketplaceAlpha.id,
    userId: customer.id,
    targetType: "provider",
    targetId: marketplaceAlpha.id,
    counts: { impression: 32, click: 9, lead: 3, booking: 1 },
  });
  await insertProviderPromotionEvents(client, {
    promotionId: betaPromotion.id,
    providerId: marketplaceBeta.id,
    userId: customer.id,
    targetType: "offering",
    targetId: offeringB.id,
    counts: { impression: 24, click: 6, lead: 2 },
  });
  await insertProviderPromotionEvents(client, {
    promotionId: betaDirectoryPromotion.id,
    providerId: marketplaceBeta.id,
    userId: customer.id,
    targetType: "provider",
    targetId: marketplaceBeta.id,
    counts: { impression: 28, click: 7, lead: 2, booking: 1 },
  });
  await insertProviderPromotionEvents(client, {
    promotionId: alphaSearchPromotion.id,
    providerId: marketplaceAlpha.id,
    userId: customer.id,
    targetType: "search",
    targetId: "wedding-provider",
    counts: { impression: 19, click: 5, lead: 1 },
  });

  const extraPromotionIds = [];
  for (const [index, provider] of promotedProviders.entries()) {
    const offering = index % 2 === 0 ? offeringA : offeringB;
    const promotion = await fetchRow(
      client,
      `
        INSERT INTO provider_promotions (
          provider_id, plan_id, placement_id, offering_id, target_type, target_id,
          title, status, payment_status, priority_weight, price, starts_at, ends_at,
          admin_notes, provider_notes, metadata
        )
        VALUES (
          $1, $2, $3, $4, 'provider', $1,
          $5, 'active', $6, $7, $8,
          NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days',
          'Seed extra provider priority de quan sat ngoai client.',
          'Provider seed duoc day len placement provider_directory_top.',
          '{"source":"seed_provider_portal_fixtures"}'::jsonb
        )
        RETURNING id
      `,
      [
        provider.id,
        featuredPlan.id,
        placements.providerTop.id,
        offering.id,
        `Seed ${provider.display_name} featured`,
        index % 3 === 0 ? "paid" : "waived",
        145 - index * 7,
        index % 3 === 0 ? 900000 : 0,
      ]
    );
    extraPromotionIds.push(promotion.id);
    await insertProviderPromotionEvents(client, {
      promotionId: promotion.id,
      providerId: provider.id,
      userId: customer.id,
      targetType: "provider",
      targetId: provider.id,
      counts: { impression: 18 + index * 3, click: 4 + index, lead: 1 + (index % 2), booking: index % 3 === 0 ? 1 : 0 },
    });
  }

  return {
    advertiser: "Seed Wedding Ads Partner",
    adminAdsLink: formatLink("/admin/marketing/ads"),
    bannerAdsLink: formatLink("/admin/marketing/ads/banner-ads"),
    providerPriorityAdminLink: formatLink("/admin/marketing/ads/provider-priority"),
    providerPriorityLink: formatLink("/provider/priority"),
    campaigns: [heroCampaign.id, blogCampaign.id, categoryCampaign.id, searchCampaign.id, ...extraCampaignIds],
    providerPromotions: [alphaPromotion.id, betaPromotion.id, betaDirectoryPromotion.id, alphaSearchPromotion.id, ...extraPromotionIds],
  };
}

function sumItems(items) {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");

    const offerings = await fetchRows(
      client,
      `
        SELECT id, name, slug, offering_type AS type, fulfillment_type, price AS base_price
        FROM offerings
        WHERE status = 'published'
        ORDER BY created_at ASC
        LIMIT 3
      `
    );

    if (offerings.length === 0) {
      throw new Error("No published offering found. Offering seed must exist before fixture seed.");
    }

    const [offeringA, offeringB = offerings[0], offeringC = offerings[0]] = offerings;

    const admin = await upsertUser(client, {
      username: "admin_seed",
      role: "ADMIN",
      displayName: "Admin Seed",
      fullName: "Admin Seed",
      phone: "0900000099",
      bio: "Seeded admin account for provider portal testing.",
    });

    const providerAlpha = await upsertUser(client, {
      username: "provider_alpha",
      role: "PROVIDER",
      displayName: "Xuong In Alpha",
      fullName: "Xuong In Alpha",
      phone: "0900000001",
      providerPortalSlug: "xuong-in-alpha",
      bio: "Provider Alpha seeded for provider portal testing.",
    });

    const providerBeta = await upsertUser(client, {
      username: "provider_beta",
      role: "PROVIDER",
      displayName: "Xuong In Beta",
      fullName: "Xuong In Beta",
      phone: "0900000002",
      providerPortalSlug: "xuong-in-beta",
      bio: "Provider Beta seeded for provider portal testing.",
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

    const marketplaceAlpha = await upsertMarketplaceProvider(client, {
      ownerUserId: providerAlpha.id,
      slug: "studio-alpha-wedding",
      displayName: "Studio Alpha Wedding",
      providerType: "studio",
      phone: "0900000001",
      bio: "Studio chụp ảnh, quay phim và tư vấn slot ưu tiên cho chiến dịch cưới.",
      description: "Seed provider để xem Provider Leads & Quotes, lịch đặt dịch vụ và booking từ quote.",
    });
    const marketplaceBeta = await upsertMarketplaceProvider(client, {
      ownerUserId: providerBeta.id,
      slug: "makeup-beta-bridal",
      displayName: "Makeup Beta Bridal",
      providerType: "makeup",
      phone: "0900000002",
      bio: "Makeup cô dâu và lịch thử layout theo khung giờ.",
      description: "Seed provider thứ hai để test lead, quote, slot và booking ở màn khách hàng/provider/admin.",
    });
    const extraMarketplaceProviders = [];
    const extraProviderSeeds = [
      ["photo-gamma-house", "Photo Gamma House", "photographer", "0900000003", "Nhóm chụp ảnh cưới ngoại cảnh và phóng sự ngày cưới."],
      ["decor-delta-florist", "Decor Delta Florist", "florist", "0900000004", "Trang trí hoa tươi, cổng cưới và bàn gallery."],
      ["planner-echo-event", "Planner Echo Event", "planner", "0900000005", "Wedding planner điều phối timeline và checklist ngày cưới."],
      ["video-foxtrot-studio", "Video Foxtrot Studio", "videographer", "0900000006", "Quay phim highlight, phóng sự và reels cưới."],
      ["creator-luna-invites", "Creator Luna Invites", "creator", "0900000007", "Thiết kế nội dung thiệp online và landing cưới."],
      ["supplier-orchid-gifts", "Supplier Orchid Gifts", "supplier", "0900000008", "Cung ứng hộp quà, phụ kiện và sản phẩm cưới."],
      ["studio-pearl-atelier", "Studio Pearl Atelier", "studio", "0900000009", "Studio chụp ảnh cưới trong nhà và album editorial."],
      ["makeup-rose-veil", "Makeup Rose Veil", "makeup", "0900000010", "Makeup cô dâu phong cách tự nhiên, thử layout trước ngày cưới."],
      ["planner-sage-moments", "Planner Sage Moments", "planner", "0900000013", "Điều phối lễ gia tiên, ceremony và reception theo timeline."],
      ["photo-ivory-lens", "Photo Ivory Lens", "photographer", "0900000014", "Chụp pre-wedding, phóng sự cưới và ảnh gia đình."],
      ["florist-mint-garden", "Florist Mint Garden", "florist", "0900000015", "Hoa cưới, backdrop, bàn gallery và lối đi ceremony."],
      ["video-cinema-vow", "Video Cinema Vow", "videographer", "0900000016", "Phim cưới cinematic, teaser và highlight trong ngày."],
      ["creator-paper-moon", "Creator Paper Moon", "creator", "0900000017", "Thiết kế nội dung, website cưới và bộ nhận diện sự kiện."],
      ["supplier-golden-box", "Supplier Golden Box", "supplier", "0900000018", "Hộp quà cưới, phụ kiện bàn tiệc và sản phẩm custom."],
      ["studio-lotus-frame", "Studio Lotus Frame", "studio", "0900000019", "Studio chụp ảnh cưới concept tối giản và truyền thống."],
    ];
    for (const [slug, displayName, providerType, phone, bio] of extraProviderSeeds) {
      extraMarketplaceProviders.push(await upsertMarketplaceProvider(client, {
        ownerUserId: null,
        slug,
        displayName,
        providerType,
        phone,
        bio,
        description: "Seed provider phụ để quan sát danh sách ưu tiên ngoài client và admin provider priority.",
      }));
    }
    const alphaService = await upsertProviderService(client, {
      providerId: marketplaceAlpha.id,
      offering: offeringA,
      serviceKind: "provider_site_service",
      durationMinutes: 120,
      serviceArea: "TP. Ho Chi Minh",
    });
    const betaService = await upsertProviderService(client, {
      providerId: marketplaceBeta.id,
      offering: offeringB,
      serviceKind: "consultation",
      durationMinutes: 90,
      serviceArea: "TP. Ho Chi Minh, Binh Duong",
    });
    const alphaSlots = await seedCalendarAndSlots(client, {
      providerId: marketplaceAlpha.id,
      providerServiceId: alphaService.id,
      offeringId: offeringA.id,
      label: "Alpha priority booking slots",
      slotBaseHour: 3,
    });
    const betaSlots = await seedCalendarAndSlots(client, {
      providerId: marketplaceBeta.id,
      providerServiceId: betaService.id,
      offeringId: offeringB.id,
      label: "Beta bridal trial slots",
      slotBaseHour: 5,
    });
    const seededLeadFlows = [
      await seedLeadQuoteBookingFlow(client, {
        customer: customerOne,
        provider: marketplaceAlpha,
        offering: offeringA,
        slot: alphaSlots[0],
        status: "quoted",
        quoteStatus: "sent",
        bookingStatus: null,
        message: "Seed lead đang chờ khách chọn slot ưu tiên quảng cáo cho gói Alpha.",
      }),
      await seedLeadQuoteBookingFlow(client, {
        customer: customerOne,
        provider: marketplaceBeta,
        offering: offeringB,
        slot: betaSlots[0],
        status: "won",
        quoteStatus: "accepted",
        bookingStatus: "confirmed",
        message: "Seed lead đã chốt quote và giữ slot makeup Beta.",
      }),
      await seedLeadQuoteBookingFlow(client, {
        customer: customerTwo,
        provider: marketplaceAlpha,
        offering: offeringA,
        slot: alphaSlots[1],
        status: "won",
        quoteStatus: "accepted",
        bookingStatus: "requested",
        message: "Seed lead đã tạo booking nhưng chờ admin/provider xác nhận.",
      }),
    ];

    const seededAds = await seedAdsAndProviderPriority(client, {
      customer: customerOne,
      marketplaceAlpha,
      marketplaceBeta,
      promotedProviders: extraMarketplaceProviders,
      offeringA,
      offeringB,
    });

    const scenarios = [
      {
        orderNumber: "PL-SEED-PORTAL-001",
        customer: customerOne,
        provider: providerAlpha,
        providerPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
        notes: "Seed order waiting for provider confirmation.",
        assignmentStatus: "pending_confirmation",
        internalNote: "Admin giao đơn test 001 cho Alpha.",
        providerNote: "",
        providerReference: "",
        items: [
          { offering: offeringA, quantity: 1, unitPrice: Number(offeringA.base_price ?? 0) || 990000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công provider cho đơn test 001."],
        ],
      },
      {
        orderNumber: "PL-SEED-PORTAL-002",
        customer: customerOne,
        provider: providerAlpha,
        providerPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Seed order đang được provider xử lý.",
        assignmentStatus: "in_progress",
        internalNote: "Đơn in gấp cần cập nhật tiến độ theo ngày.",
        providerNote: "Da chot file in va dang tien hanh san xuat.",
        providerReference: "ALPHA-002",
        acceptedAt: "2026-04-10T08:00:00.000Z",
        items: [
          { offering: offeringA, quantity: 1, unitPrice: Number(offeringA.base_price ?? 0) || 990000 },
          { offering: offeringB, quantity: 1, unitPrice: Number(offeringB.base_price ?? 0) || 1290000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công provider cho đơn test 002."],
          ["provider", providerAlpha.id, "status_changed", "Provider đã cập nhật trạng thái sang accepted."],
          ["provider", providerAlpha.id, "status_changed", "Provider đã cập nhật trạng thái sang in_progress."],
          ["provider", providerAlpha.id, "note_added", "Provider note: Da chot file in va dang tien hanh san xuat."],
        ],
      },
      {
        orderNumber: "PL-SEED-PORTAL-003",
        customer: customerTwo,
        provider: providerBeta,
        providerPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "ready_to_ship",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Seed order chờ admin review trước khi bàn giao.",
        assignmentStatus: "ready_for_review",
        internalNote: "Can admin review mau in lan cuoi.",
        providerNote: "Da in xong mau, cho admin duyet.",
        providerReference: "BETA-003",
        acceptedAt: "2026-04-09T09:30:00.000Z",
        items: [
          { offering: offeringC, quantity: 2, unitPrice: Number(offeringC.base_price ?? 0) || 500000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công provider cho đơn test 003."],
          ["provider", providerBeta.id, "status_changed", "Provider đã cập nhật trạng thái sang accepted."],
          ["provider", providerBeta.id, "status_changed", "Provider đã cập nhật trạng thái sang ready_for_review."],
          ["provider", providerBeta.id, "note_added", "Provider note: Da in xong mau, cho admin duyet."],
        ],
      },
      {
        orderNumber: "PL-SEED-PORTAL-004",
        customer: customerTwo,
        provider: providerBeta,
        providerPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "completed",
        paymentStatus: "paid",
        fulfillmentStatus: "delivered",
        notes: "Seed order đã hoàn tất để test thống kê completed.",
        assignmentStatus: "completed",
        internalNote: "Don da giao hoan tat.",
        providerNote: "Da giao hang thanh cong.",
        providerReference: "BETA-004",
        acceptedAt: "2026-04-08T10:00:00.000Z",
        completedAt: "2026-04-11T16:30:00.000Z",
        items: [
          { offering: offeringB, quantity: 1, unitPrice: Number(offeringB.base_price ?? 0) || 1290000 },
        ],
        events: [
          ["admin", admin.id, "assignment_created", "Admin đã tạo phân công provider cho đơn test 004."],
          ["provider", providerBeta.id, "status_changed", "Provider đã cập nhật trạng thái sang in_progress."],
          ["provider", providerBeta.id, "status_changed", "Provider đã cập nhật trạng thái sang completed."],
          ["provider", providerBeta.id, "note_added", "Provider note: Da giao hang thanh cong."],
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
        providerId: scenario.provider.id,
        status: scenario.assignmentStatus,
        internalNote: scenario.internalNote,
        providerNote: scenario.providerNote,
        providerReference: scenario.providerReference,
        acceptedAt: scenario.acceptedAt,
        completedAt: scenario.completedAt,
      });

      for (const [actorType, actorUserId, eventType, message] of scenario.events) {
        await createEvent(client, assignment.id, actorUserId, actorType, eventType, message);
      }

      seededOrders.push({
        orderNumber: scenario.orderNumber,
        assignmentId: assignment.id,
        providerUsername: scenario.provider.username,
        orderDetailLink: formatLink(`/provider/orders/${assignment.id}`),
        portalLink: formatLink(`/provider`),
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
          providers: [
            {
              username: providerAlpha.username,
              portalSlug: "xuong-in-alpha",
              portalLink: formatLink("/provider"),
            },
            {
              username: providerBeta.username,
              portalSlug: "xuong-in-beta",
              portalLink: formatLink("/provider"),
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
          marketplace: {
            leadsAndQuotesLink: formatLink("/admin/providers/leads"),
            customerVendorLeadsLink: formatLink("/customer/vendor-leads"),
            bookingsLink: formatLink("/admin/bookings"),
            availabilityLink: formatLink("/provider/availability"),
            seededLeadFlows,
          },
          ads: seededAds,
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
