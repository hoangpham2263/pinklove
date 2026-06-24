import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { REGISTERED_OFFERING_TYPES } from "../src/features/offerings/registered-offering-types.mjs";

const rootDir = path.resolve(process.cwd(), "..");
const registeredOfferingTypeKeys = REGISTERED_OFFERING_TYPES
  .map((type) => type.key)
  .sort();

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const expectedPublicTables = [
  "ab_experiment_landing_pages",
  "ab_experiments",
  "affiliate_accounts",
  "affiliate_applications",
  "affiliate_clicks",
  "affiliate_conversions",
  "analytics_events",
  "analytics_page_views",
  "analytics_sessions",
  "admin_permissions",
  "admin_role_permissions",
  "admin_roles",
  "ad_campaigns",
  "ad_creatives",
  "ad_events",
  "ad_placements",
  "advertisers",
  "app_settings",
  "auth_rate_limits",
  "blog_categories",
  "blog_posts",
  "booking_calendars",
  "booking_items",
  "booking_payments",
  "booking_status_logs",
  "bookings",
  "campaign_stats",
  "campaigns",
  "chat_conversation_participants",
  "chat_conversation_user_states",
  "chat_conversations",
  "chat_message_user_states",
  "chat_messages",
  "chat_typing_states",
  "commerce_entitlements",
  "commerce_order_items",
  "commerce_orders",
  "commerce_payment_logs",
  "commerce_payments",
  "commerce_shipments",
  "content_comments",
  "conversion_events",
  "conversion_goals",
  "creator_service_offerings",
  "digital_template_offerings",
  "domain_event_types",
  "domain_events",
  "experience_offerings",
  "field_change_logs",
  "guest_groups",
  "internal_accounts",
  "landing_page_sections",
  "landing_pages",
  "managed_pages",
  "media_asset_links",
  "media_assets",
  "media_collection_items",
  "media_collections",
  "media_roles",
  "media_target_types",
  "navigation_menu_items",
  "navigation_menus",
  "notification_target_roles",
  "notification_target_users",
  "notification_user_states",
  "notifications",
  "offering_bundle_items",
  "offering_bundles",
  "offering_categories",
  "offering_provider_suppliers",
  "offering_relationships",
  "offering_search_documents",
  "offering_statuses",
  "offering_type_field_groups",
  "offering_type_fields",
  "offering_types",
  "offerings",
  "organization_members",
  "organization_roles",
  "organizations",
  "page_sections",
  "pages",
  "physical_offerings",
  "provider_applications",
  "provider_availability",
  "provider_fulfillments",
  "provider_offering_submission_events",
  "provider_offering_submissions",
  "provider_offering_supplier_requests",
  "provider_order_assignments",
  "provider_order_events",
  "provider_pricing",
  "provider_profiles",
  "provider_promotion_events",
  "provider_promotion_plans",
  "provider_promotions",
  "provider_regions",
  "provider_reviews",
  "provider_search_documents",
  "provider_services",
  "provider_time_slots",
  "provider_types",
  "providers",
  "regions",
  "seo_redirects",
  "service_offerings",
  "service_regions",
  "shipping_regions",
  "shopping_cart_items",
  "tag_relations",
  "tags",
  "template_attribute_values",
  "template_attributes",
  "template_engines",
  "user_addresses",
  "user_oauth_accounts",
  "user_profiles",
  "user_sessions",
  "user_shipping_profiles",
  "users",
  "vendor_leads",
  "vendor_quotes",
  "wedding_site_events",
  "wedding_site_galleries",
  "wedding_site_guests",
  "wedding_site_offerings",
  "wedding_site_rsvps",
  "wedding_sites",
  "wedding_table_guests",
  "wedding_tables",
  "wedding_tasks",
  "wedding_timeline_items",
].sort();

async function scalar(client, sql, values = []) {
  const result = await client.query(sql, values);
  return result.rows[0] ? Object.values(result.rows[0])[0] : undefined;
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    const publicTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const actualPublicTables = publicTables.rows.map((row) => row.table_name);
    assert(
      JSON.stringify(actualPublicTables) === JSON.stringify(expectedPublicTables),
      [
        "Public table inventory does not match the approved architecture.",
        `Missing: ${expectedPublicTables.filter((tableName) => !actualPublicTables.includes(tableName)).join(", ") || "none"}.`,
        `Unexpected: ${actualPublicTables.filter((tableName) => !expectedPublicTables.includes(tableName)).join(", ") || "none"}.`,
      ].join(" ")
    );

    const nonTextIdColumns = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type IN ('bigint', 'integer')
        AND (
          column_name = 'id'
          OR column_name LIKE '%\\_id' ESCAPE '\\'
        )
      ORDER BY table_name, column_name
    `);
    assert(
      nonTextIdColumns.rowCount === 0,
      `Non-text ID columns found: ${nonTextIdColumns.rows
        .map((row) => `${row.table_name}.${row.column_name}:${row.data_type}`)
        .join(", ")}`
    );

    const requiredTables = [
      "provider_types",
      "template_engines",
      "offering_statuses",
      "media_target_types",
      "media_roles",
      "domain_event_types",
      "field_change_logs",
      "seo_redirects",
      "pages",
      "page_sections",
      "guest_groups",
      "wedding_tables",
      "wedding_table_guests",
      "wedding_tasks",
      "wedding_timeline_items",
      "vendor_leads",
      "vendor_quotes",
      "provider_search_documents",
      "media_collections",
      "media_collection_items",
      "conversion_goals",
      "conversion_events",
      "landing_pages",
      "landing_page_sections",
      "campaigns",
      "campaign_stats",
      "advertisers",
      "ad_placements",
      "ad_campaigns",
      "ad_creatives",
      "ad_events",
      "provider_promotion_plans",
      "provider_promotions",
      "provider_promotion_events",
      "ab_experiments",
      "ab_experiment_landing_pages",
    ];
    const existingTables = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      `,
      [requiredTables]
    );
    const existingTableSet = new Set(existingTables.rows.map((row) => row.table_name));
    const missingTables = requiredTables.filter((tableName) => !existingTableSet.has(tableName));
    assert(missingTables.length === 0, `Missing required architecture tables: ${missingTables.join(", ")}`);

    const forbiddenTables = [
      "catalog_items",
      "products",
      "service_catalogs",
      "offering_variants",
      "variant_sections",
      "vendor_ads",
      "vendor_subscriptions",
      "premium_listing",
      "provider_billing",
      "marketplace_billing",
      "sponsored_listing",
      "wedding_site_pages",
      "wedding_site_sections",
      "template_collections",
      "template_variants",
      "template_tags",
      "template_styles",
      "template_categories",
      "template_analytics",
      "template_views",
      "template_shares",
      "template_conversions",
      "work_reports",
      "work_time_entries",
      "staff_availability",
      "staff_leave_requests",
      "work_report_types",
      "work_time_entry_types",
      "staff_availability_statuses",
      "staff_leave_types",
      "staff_leave_statuses",
      "work_task_attachments",
      "work_task_comments",
      "work_task_checklists",
      "work_task_assignees",
      "work_project_members",
      "work_tasks",
      "work_projects",
      "work_task_types",
      "work_task_priorities",
      "work_task_statuses",
      "work_project_statuses",
      "staff_role_assignments",
      "staff_role_permissions",
      "staff_profiles",
      "staff_positions",
      "staff_departments",
      "staff_employment_types",
      "staff_statuses",
      "staff_permissions",
      "staff_roles",
    ];
    const forbiddenTableRows = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      ORDER BY table_name
      `,
      [forbiddenTables]
    );
    assert(
      forbiddenTableRows.rowCount === 0,
      `Forbidden tables still exist: ${forbiddenTableRows.rows.map((row) => row.table_name).join(", ")}`
    );

    const seedExpectations = [
      ["provider_types", 8],
      ["template_engines", 6],
      ["offering_statuses", 5],
      ["media_target_types", 7],
      ["media_roles", 8],
      ["domain_event_types", 11],
      ["conversion_goals", 5],
    ];
    for (const [tableName, minimumCount] of seedExpectations) {
      const count = Number(await scalar(client, `SELECT COUNT(*) FROM ${tableName}`));
      assert(count >= minimumCount, `${tableName} seed count is ${count}; expected at least ${minimumCount}`);
    }

    const systemOfferingTypes = await client.query(`
      SELECT key
      FROM offering_types
      WHERE is_system = TRUE
      ORDER BY key
    `);
    const expectedSystemOfferingTypes = registeredOfferingTypeKeys;
    const actualSystemOfferingTypes = systemOfferingTypes.rows.map((row) => row.key);
    assert(
      JSON.stringify(actualSystemOfferingTypes) === JSON.stringify(expectedSystemOfferingTypes),
      `System offering types must be ${expectedSystemOfferingTypes.join(", ")}; found ${actualSystemOfferingTypes.join(", ")}`
    );

    const defaultOfferingTypes = await client.query(`
      SELECT key
      FROM offering_types
      WHERE is_default = TRUE
      ORDER BY key
    `);
    const expectedDefaultOfferingTypes = registeredOfferingTypeKeys;
    const actualDefaultOfferingTypes = defaultOfferingTypes.rows.map((row) => row.key);
    assert(
      JSON.stringify(actualDefaultOfferingTypes) === JSON.stringify(expectedDefaultOfferingTypes),
      `Default offering types must be ${expectedDefaultOfferingTypes.join(", ")}; found ${actualDefaultOfferingTypes.join(", ")}`
    );

    const offeringTypeStatusColumn = await scalar(
      client,
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'offering_types'
        AND column_name = 'status'
      `
    );
    assert(offeringTypeStatusColumn === undefined, "offering_types.status must not exist; type availability is code-registered");

    const searchVectorType = await scalar(
      client,
      `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'offering_search_documents'
        AND column_name = 'search_vector'
      `
    );
    assert(searchVectorType === "tsvector", "offering_search_documents.search_vector must be tsvector");

    const providerSearchVectorType = await scalar(
      client,
      `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'provider_search_documents'
        AND column_name = 'search_vector'
      `
    );
    assert(providerSearchVectorType === "tsvector", "provider_search_documents.search_vector must be tsvector");

    const pagesOwnerTypeConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'pages_owner_type_check'
          AND conrelid = 'pages'::regclass
        `
      ) ?? ""
    );
    for (const ownerType of ["wedding_site", "provider", "offering", "landing"]) {
      assert(pagesOwnerTypeConstraint.includes(ownerType), `pages_owner_type_check is missing ${ownerType}`);
    }

    const pagesPageTypeConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'pages_page_type_check'
          AND conrelid = 'pages'::regclass
        `
      ) ?? ""
    );
    for (const pageType of ["website", "landing", "seo", "campaign", "vendor"]) {
      assert(pagesPageTypeConstraint.includes(pageType), `pages_page_type_check is missing ${pageType}`);
    }

    const adPlacementsTypeConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'ad_placements_type_check'
          AND conrelid = 'ad_placements'::regclass
        `
      ) ?? ""
    );
    for (const placementType of ["banner", "provider_listing", "offering_listing", "mixed", "popup", "floating", "announcement"]) {
      assert(adPlacementsTypeConstraint.includes(placementType), `ad_placements_type_check is missing ${placementType}`);
    }

    const pageSectionColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'page_sections'
        AND column_name IN ('visibility_rules', 'display_conditions', 'ab_variant_key')
    `);
    const pageSectionColumnSet = new Set(pageSectionColumns.rows.map((row) => row.column_name));
    for (const columnName of ["visibility_rules", "display_conditions", "ab_variant_key"]) {
      assert(pageSectionColumnSet.has(columnName), `page_sections.${columnName} is required`);
    }

    const architectureColumns = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'wedding_sites' AND column_name IN ('project_status', 'budget', 'event_date', 'guest_target'))
          OR (table_name = 'wedding_site_guests' AND column_name IN ('guest_group_id', 'note'))
          OR (table_name = 'wedding_site_rsvps' AND column_name IN ('attendee_count', 'meal_choice', 'special_requests', 'responded_at'))
          OR (table_name = 'vendor_leads' AND column_name IN ('provider_id', 'user_id', 'offering_id', 'budget', 'event_date', 'message', 'status'))
          OR (table_name = 'media_collections' AND column_name IN ('name', 'target_type', 'target_id', 'description'))
          OR (table_name = 'conversion_events' AND column_name IN ('goal_id', 'session_id', 'user_id', 'target_type', 'target_id'))
        )
    `);
    const architectureColumnSet = new Set(
      architectureColumns.rows.map((row) => `${row.table_name}.${row.column_name}`)
    );
    for (const key of [
      "wedding_sites.project_status",
      "wedding_sites.budget",
      "wedding_sites.event_date",
      "wedding_sites.guest_target",
      "wedding_site_guests.guest_group_id",
      "wedding_site_guests.note",
      "wedding_site_rsvps.attendee_count",
      "wedding_site_rsvps.meal_choice",
      "wedding_site_rsvps.special_requests",
      "wedding_site_rsvps.responded_at",
      "vendor_leads.provider_id",
      "vendor_leads.user_id",
      "vendor_leads.offering_id",
      "vendor_leads.budget",
      "vendor_leads.event_date",
      "vendor_leads.message",
      "vendor_leads.status",
      "media_collections.name",
      "media_collections.target_type",
      "media_collections.target_id",
      "media_collections.description",
      "conversion_events.goal_id",
      "conversion_events.session_id",
      "conversion_events.user_id",
      "conversion_events.target_type",
      "conversion_events.target_id",
    ]) {
      assert(architectureColumnSet.has(key), `${key} is required`);
    }

    const forbiddenConfigRows = Number(
      await scalar(
        client,
        `
        SELECT COUNT(*)
        FROM offerings
        WHERE config ?| ARRAY[
          'inventory',
          'pricing_rules',
          'permissions',
          'analytics',
          'booking_logic',
          'relational_data',
          'siteDefaults',
          'generalOffering'
        ]
        `
      )
    );
    assert(forbiddenConfigRows === 0, `offerings.config has ${forbiddenConfigRows} rows with forbidden keys`);

    const offeringStatusConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'offerings_status_check'
          AND conrelid = 'offerings'::regclass
        `
      ) ?? ""
    );
    for (const status of ["draft", "pending_review", "published", "archived", "disabled"]) {
      assert(offeringStatusConstraint.includes(status), `offerings_status_check is missing ${status}`);
    }

    const landingPageTypeConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'landing_pages_type_check'
          AND conrelid = 'landing_pages'::regclass
        `
      ) ?? ""
    );
    for (const pageType of ["default", "landing", "seo", "campaign", "ab_test"]) {
      assert(landingPageTypeConstraint.includes(pageType), `landing_pages_type_check is missing ${pageType}`);
    }

    const landingPageSectionConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'landing_page_sections_type_check'
          AND conrelid = 'landing_page_sections'::regclass
        `
      ) ?? ""
    );
    for (const sectionType of [
      "hero",
      "gallery",
      "video",
      "reviews",
      "faq",
      "countdown",
      "cta",
      "pricing",
      "features",
      "related_products",
      "custom",
    ]) {
      assert(landingPageSectionConstraint.includes(sectionType), `landing_page_sections_type_check is missing ${sectionType}`);
    }

    const sourceOfferingColumn = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'landing_pages'
        AND column_name = 'source_offering_id'
    `);
    assert(sourceOfferingColumn.rows[0]?.is_nullable === "YES", "landing_pages.source_offering_id must be nullable");

    const sourceOfferingForeignKey = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'landing_pages_source_offering_id_fkey'
          AND conrelid = 'landing_pages'::regclass
        `
      ) ?? ""
    );
    assert(sourceOfferingForeignKey.includes("ON DELETE SET NULL"), "Landing source offering FK must use ON DELETE SET NULL");

    const landingPageSlugUnique = Number(
      await scalar(
        client,
        `
        SELECT COUNT(*)
        FROM pg_constraint
        WHERE conname = 'landing_pages_slug_unique'
          AND conrelid = 'landing_pages'::regclass
          AND contype = 'u'
        `
      )
    );
    assert(landingPageSlugUnique === 1, "landing_pages.slug must be globally unique");

    const landingRelationColumns = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'campaigns' AND column_name = 'landing_page_id')
          OR (table_name = 'ab_experiments' AND column_name = 'offering_id')
          OR (table_name = 'ab_experiment_landing_pages' AND column_name = 'landing_page_id')
        )
    `);
    const landingRelationColumnSet = new Set(
      landingRelationColumns.rows.map((row) => `${row.table_name}.${row.column_name}`)
    );
    assert(landingRelationColumnSet.has("campaigns.landing_page_id"), "campaigns.landing_page_id is required");
    assert(!landingRelationColumnSet.has("ab_experiments.offering_id"), "ab_experiments.offering_id must be removed");
    assert(
      landingRelationColumnSet.has("ab_experiment_landing_pages.landing_page_id"),
      "ab_experiment_landing_pages.landing_page_id is required"
    );
    const campaignChannelConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'campaigns_channel_check'
          AND conrelid = 'campaigns'::regclass
        `
      ) ?? ""
    );
    for (const channel of ["facebook", "tiktok", "google", "email", "affiliate", "organic"]) {
      assert(campaignChannelConstraint.includes(channel), `campaigns_channel_check is missing ${channel}`);
    }

    const providerColumns = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('physical_offerings', 'creator_service_offerings')
        AND column_name IN ('provider_id', 'provider_type')
    `);
    const providerColumnSet = new Set(providerColumns.rows.map((row) => `${row.table_name}.${row.column_name}`));
    for (const key of [
      "physical_offerings.provider_id",
      "physical_offerings.provider_type",
      "creator_service_offerings.provider_id",
      "creator_service_offerings.provider_type",
    ]) {
      assert(providerColumnSet.has(key), `${key} is required`);
    }

    const providerOwnerColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'providers'
        AND column_name IN ('user_id', 'owner_user_id')
    `);
    const providerOwnerColumnSet = new Set(providerOwnerColumns.rows.map((row) => row.column_name));
    assert(providerOwnerColumnSet.has("owner_user_id"), "providers.owner_user_id is required");
    assert(!providerOwnerColumnSet.has("user_id"), "providers.user_id must be removed; use providers.owner_user_id");

    const adminRoleColumn = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users' AND column_name='admin_role_id'
    `);
    assert(adminRoleColumn.rowCount === 1, "users.admin_role_id is required");

    const normalizedEmailIndexCount = Number(
      await scalar(client, "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND tablename='users' AND indexname='users_email_normalized_uidx'")
    );
    assert(normalizedEmailIndexCount === 1, "users.email must be unique after normalization");

    const normalizedPhoneIndexCount = Number(
      await scalar(client, "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND tablename='user_profiles' AND indexname='user_profiles_phone_normalized_uidx'")
    );
    assert(normalizedPhoneIndexCount === 1, "user_profiles.phone must be unique after normalization");

    const authRateLimitsTableCount = Number(
      await scalar(client, "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='auth_rate_limits'")
    );
    assert(authRateLimitsTableCount === 1, "auth_rate_limits table is required");

    const adminRoleForeignKey = String(
      await scalar(
        client,
        `
          SELECT pg_get_constraintdef(oid)
          FROM pg_constraint
          WHERE conname='users_admin_role_id_fkey'
            AND conrelid='users'::regclass
        `
      ) ?? ""
    );
    assert(adminRoleForeignKey.includes("admin_roles"), "users.admin_role_id must reference admin_roles");

    const superAdminCount = Number(
      await scalar(client, "SELECT COUNT(*) FROM admin_roles WHERE key='super_admin' AND is_system=TRUE AND is_active=TRUE")
    );
    assert(superAdminCount === 1, "Exactly one active system super_admin role is required");

    const staffRoleCount = Number(
      await scalar(client, "SELECT COUNT(*) FROM admin_roles WHERE key='staff' AND is_active=TRUE")
    );
    assert(staffRoleCount === 1, "Exactly one active staff role is required");

    const adminWithoutRoleCount = Number(
      await scalar(client, "SELECT COUNT(*) FROM users WHERE role='ADMIN' AND admin_role_id IS NULL")
    );
    assert(adminWithoutRoleCount === 0, "Every ADMIN user must have an admin_role_id");

    const workflowProviderUserTables = [
      "provider_order_assignments",
      "provider_offering_submissions",
      "provider_offering_supplier_requests",
      "offering_provider_suppliers",
    ];
    const workflowProviderColumns = await client.query(
      `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
        AND column_name IN ('provider_id', 'provider_user_id')
      `,
      [workflowProviderUserTables]
    );
    const workflowProviderColumnSet = new Set(
      workflowProviderColumns.rows.map((row) => `${row.table_name}.${row.column_name}`)
    );
    for (const tableName of workflowProviderUserTables) {
      assert(workflowProviderColumnSet.has(`${tableName}.provider_user_id`), `${tableName}.provider_user_id is required`);
      assert(!workflowProviderColumnSet.has(`${tableName}.provider_id`), `${tableName}.provider_id must be removed`);
    }

    const ambiguousProviderIdFks = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'provider_id'
        AND NOT (ccu.table_name = 'providers' AND ccu.column_name = 'id')
    `);
    assert(
      ambiguousProviderIdFks.rowCount === 0,
      `provider_id may only reference providers.id: ${ambiguousProviderIdFks.rows
        .map((row) => `${row.table_name}.${row.column_name}->${row.foreign_table_name}.${row.foreign_column_name}`)
        .join(", ")}`
    );

    const configSizeConstraint = String(
      await scalar(
        client,
        `
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conname = 'offerings_config_size_check'
          AND conrelid = 'offerings'::regclass
        `
      ) ?? ""
    );
    assert(configSizeConstraint.includes("pg_column_size"), "offerings_config_size_check is missing");

    for (const eventName of ["offering.search.sync", "template.search.sync", "provider.search.sync"]) {
      const eventCount = Number(await scalar(client, "SELECT COUNT(*) FROM domain_event_types WHERE key = $1", [eventName]));
      assert(eventCount === 1, `${eventName} is missing from domain_event_types`);
    }

    console.log("Schema audit passed.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
