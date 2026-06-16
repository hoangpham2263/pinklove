import"server-only";

import { Pool, type PoolClient, type QueryResultRow } from"pg";
import { CONTENT_PAGE_SLUG_ALIASES, CONTENT_PAGES } from "@/features/pages/registry";
import { AUTH_PAGES } from "@/features/auth/page-registry";
import { REGISTERED_OFFERING_TYPES } from "@/features/offerings/type-registry";
import offeringSeedCatalog from "@/lib/offering-seed-data.json";

const globalForDb = globalThis as unknown as {
 pool?: Pool;
 initPromise?: Promise<void>;
 ensurePromise?: Promise<void>;
  roleMigrationDone?: boolean;
  userAccountStatusMigrationDone?: boolean;
  userWishlistMigrationDone?: boolean;
  userProfilesMigrationDone?: boolean;
  userAddressesMigrationDone?: boolean;
  userShippingProfilesMigrationDone?: boolean;
  oauthAccountsMigrationDone?: boolean;
  menuTablesMigrationDone?: boolean;
  affiliateTablesMigrationDone?: boolean;
  internalAccountsMigrationDone?: boolean;
  adminRbacMigrationDone?: boolean;
  offeringTablesMigrationDone?: boolean;
  landingPageTablesMigrationDone?: boolean;
  blogTablesMigrationDone?: boolean;
  commerceTablesMigrationDone?: boolean;
  offeringProviderPaperTypeMigrationDone?: boolean;
  offeringProviderCostFieldsMigrationDone?: boolean;
  coreDatabaseRefactorMigrationDone?: boolean;
  finalArchitectureCleanupMigrationDone?: boolean;
  providerOrdersMigrationDone?: boolean;
  providerOfferingSubmissionsMigrationDone?: boolean;
  providerApplicationsMigrationDone?: boolean;
  affiliateApplicationsMigrationDone?: boolean;
  chatTablesMigrationDone?: boolean;
  notificationTablesMigrationDone?: boolean;
  adsTablesMigrationDone?: boolean;
	  contentCommentsMigrationDone?: boolean;
	  mediaTablesMigrationDone?: boolean;
	  managedPagesMigrationDone?: boolean;
	  managedPagesMigrationPromise?: Promise<void>;
	  offeringSeedDone?: boolean;
  offeringCategorySeedDone?: boolean;
  managedPagesSeedSignature?: string;
  blogSeedDone?: boolean;
};

function getManagedPagesSeedSignature() {
 return JSON.stringify({
  auth: Object.entries(AUTH_PAGES).map(([slug, config]) => ({
   slug,
   name: config.name,
  })),
  content: Object.entries(CONTENT_PAGES).map(([slug, config]) => ({
   slug,
   name: config.name,
  })),
 });
}

function getDatabaseUrlOrThrow(): string {
 const url = process.env.DATABASE_URL;
 if (!url) {
 throw new Error("DATABASE_URL is required.");
 }
 return url;
}

function getPool(): Pool {
 if (globalForDb.pool) {
 return globalForDb.pool;
 }

 const pool = new Pool({
 connectionString: getDatabaseUrlOrThrow(),
 });
 globalForDb.pool = pool;

 return pool;
}

async function getColumnTypeSql(tableName: string, columnName: string, fallbackType = "TEXT") {
 const pool = getPool();
 const result = await pool.query<{ formatted_type: string }>(
  `
   SELECT format_type(a.atttypid, a.atttypmod) AS formatted_type
   FROM pg_attribute a
   INNER JOIN pg_class c ON c.oid = a.attrelid
   INNER JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = current_schema()
     AND c.relname = $1
     AND a.attname = $2
     AND a.attnum > 0
     AND NOT a.attisdropped
   LIMIT 1
  `,
  [tableName, columnName]
 );

 return result.rows[0]?.formatted_type ?? fallbackType;
}

async function ensureTextForeignKeyColumn({
 tableName,
 columnName,
 referenceTable = "users",
 referenceColumn = "id",
 onDelete = "SET NULL",
 notNull = false,
}: {
 tableName: string;
 columnName: string;
 referenceTable?: string;
 referenceColumn?: string;
 onDelete?: "CASCADE" | "SET NULL" | "RESTRICT";
 notNull?: boolean;
}) {
 const pool = getPool();
 const identifierPattern = /^[a-z_][a-z0-9_]*$/;
 for (const identifier of [tableName, columnName, referenceTable, referenceColumn]) {
  if (!identifierPattern.test(identifier)) {
   throw new Error(`Invalid database identifier: ${identifier}`);
  }
 }

 await pool.query(
  `
  DO $$
  DECLARE
    target_table regclass;
    target_attnum smallint;
    constraint_record record;
  BEGIN
    SELECT to_regclass(format('%I.%I', current_schema(), '${tableName}')) INTO target_table;
    IF target_table IS NULL THEN
      RETURN;
    END IF;

    SELECT attnum
    INTO target_attnum
    FROM pg_attribute
    WHERE attrelid = target_table
      AND attname = '${columnName}'
      AND attnum > 0
      AND NOT attisdropped;

    IF target_attnum IS NULL THEN
      RETURN;
    END IF;

    FOR constraint_record IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = target_table
        AND contype = 'f'
        AND target_attnum = ANY(conkey)
    LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', target_table, constraint_record.conname);
    END LOOP;

    EXECUTE format('ALTER TABLE %s ALTER COLUMN %I DROP DEFAULT', target_table, '${columnName}');
    EXECUTE format('ALTER TABLE %s ALTER COLUMN %I TYPE TEXT USING %I::text', target_table, '${columnName}', '${columnName}');
  END $$;
  `
 );

 await pool.query(`
  ALTER TABLE ${tableName}
  ALTER COLUMN ${columnName} ${notNull ? "SET" : "DROP"} NOT NULL;
 `);

 await pool.query(`
  DO $$
  BEGIN
    IF to_regclass(format('%I.%I', current_schema(), '${tableName}')) IS NOT NULL
       AND to_regclass(format('%I.%I', current_schema(), '${referenceTable}')) IS NOT NULL
       AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = '${tableName}'::regclass
          AND conname = '${tableName}_${columnName}_fkey'
       ) THEN
      ALTER TABLE ${tableName}
      ADD CONSTRAINT ${tableName}_${columnName}_fkey
      FOREIGN KEY (${columnName})
      REFERENCES ${referenceTable}(${referenceColumn})
      ON DELETE ${onDelete}
      NOT VALID;
    END IF;
  END $$;
 `);
}

async function ensureAppSettingsTextId() {
 const pool = getPool();

 await pool.query(`
  DO $$
  BEGIN
    IF to_regclass(format('%I.%I', current_schema(), 'app_settings')) IS NULL THEN
      RETURN;
    END IF;

    ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_id_check;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'app_settings'
        AND column_name = 'id'
        AND data_type <> 'text'
    ) THEN
      ALTER TABLE app_settings
      ALTER COLUMN id DROP DEFAULT,
      ALTER COLUMN id TYPE TEXT USING CASE WHEN id::text IN ('1', 'system') THEN 'system' ELSE id::text END;
    END IF;
  END $$;
 `);
}

async function initSchema() {
 const pool = getPool();

 await pool.query(`
 CREATE OR REPLACE FUNCTION app_random_id()
 RETURNS TEXT AS $$
   SELECT string_agg(
    substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', (floor(random() * 64)::int + 1), 1),
    ''
   )
   FROM generate_series(1, 24)
 $$ LANGUAGE SQL VOLATILE;
 `);

  await pool.query(`
 CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

 await pool.query(`
 CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);
 `);

 await pool.query(`
 CREATE INDEX IF NOT EXISTS idx_media_assets_url ON media_assets(url);
 `);

 await pool.query(`
 CREATE INDEX IF NOT EXISTS idx_media_assets_file_name ON media_assets(file_name);
 `);

 await pool.query(`
 CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'active',
  account_status_reason TEXT,
  account_status_updated_at TIMESTAMPTZ,
  account_status_updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

 await pool.query(`
 CREATE INDEX IF NOT EXISTS user_sessions_token_hash_idx
 ON user_sessions(token_hash);
 `);

}

async function ensureUsersRoleMigration() {
 const pool = getPool();

 await pool.query(`
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS role TEXT;
 `);

 await pool.query(`
 ALTER TABLE users
 DROP CONSTRAINT IF EXISTS users_role_check;
 `);

 await pool.query(`
 UPDATE users
 SET role = CASE
  WHEN role IS NULL OR BTRIM(role) = '' THEN 'ADMIN'
  WHEN LOWER(role) = 'admin' THEN 'ADMIN'
  WHEN LOWER(role) = 'user' THEN 'CUSTOMER'
  ELSE UPPER(role)
 END;
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN role SET DEFAULT 'CUSTOMER';
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN role SET NOT NULL;
 `);

 await pool.query(`
 DO $$
 BEGIN
  ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'PROVIDER'));
 EXCEPTION
  WHEN duplicate_object THEN
  NULL;
 END
 $$;
 `);
}

async function ensureAdminRbacMigration() {
 const pool = getPool();

 await pool.query(`
  CREATE TABLE IF NOT EXISTS admin_roles (
   id TEXT PRIMARY KEY DEFAULT app_random_id(),
   key TEXT NOT NULL UNIQUE,
   label TEXT NOT NULL,
   description TEXT NOT NULL DEFAULT '',
   is_system BOOLEAN NOT NULL DEFAULT FALSE,
   is_active BOOLEAN NOT NULL DEFAULT TRUE,
   sort_order INT NOT NULL DEFAULT 0,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS admin_permissions (
   id TEXT PRIMARY KEY DEFAULT app_random_id(),
   key TEXT NOT NULL UNIQUE,
   label TEXT NOT NULL,
   description TEXT NOT NULL DEFAULT '',
   module TEXT NOT NULL,
   sort_order INT NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admin_role_permissions (
   role_id TEXT NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
   permission_id TEXT NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
   PRIMARY KEY (role_id, permission_id)
  );

  ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role_id TEXT;

  DO $$
  BEGIN
   IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND conname = 'users_admin_role_id_fkey'
   ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_admin_role_id_fkey
    FOREIGN KEY (admin_role_id) REFERENCES admin_roles(id) ON DELETE RESTRICT;
   END IF;
  END
  $$;

  CREATE INDEX IF NOT EXISTS users_admin_role_idx ON users(admin_role_id);
  CREATE INDEX IF NOT EXISTS admin_permissions_module_idx ON admin_permissions(module, sort_order);

  INSERT INTO admin_roles (key,label,description,is_system,is_active,sort_order)
  VALUES
   ('super_admin','Super Admin','Toàn quyền quản trị hệ thống.',TRUE,TRUE,0),
   ('staff','Staff','Tài khoản nội bộ có quyền giới hạn.',FALSE,TRUE,10)
  ON CONFLICT (key) DO UPDATE
  SET label=EXCLUDED.label,description=EXCLUDED.description,is_active=TRUE;

  INSERT INTO admin_permissions (key,label,description,module,sort_order) VALUES
   ('dashboard.view','Xem Dashboard','Truy cập tổng quan Admin.','dashboard',10),
   ('content.view','Xem Content','Truy cập Pages, Navigation và Blog.','content',20),
   ('commerce.view','Xem Commerce','Truy cập Orders, Payments và Shipments.','commerce',30),
   ('marketplace.view','Xem Marketplace','Truy cập Provider và Marketplace.','marketplace',40),
   ('bookings.view','Xem Booking','Truy cập quản lý Booking.','bookings',50),
   ('marketing.view','Xem Marketing','Truy cập Landing Pages và Campaigns.','marketing',60),
   ('planning.view','Xem Planning','Truy cập Wedding Planning.','planning',70),
   ('offerings.view','Xem Offerings','Truy cập quản lý Offering.','offerings',80),
   ('affiliates.view','Xem Affiliate','Truy cập Affiliate Marketing.','affiliates',90),
   ('accounts.view','Xem Accounts','Truy cập Users, Customers và Internal Accounts.','accounts',100),
   ('accounts.manage','Quản lý Accounts','Tạo, sửa và phân quyền tài khoản.','accounts',110),
   ('system.view','Xem System','Truy cập công cụ hệ thống.','system',120),
   ('analytics.view','Xem Analytics','Truy cập Analytics.','analytics',130),
   ('configuration.view','Xem Configuration','Truy cập cấu hình hệ thống.','configuration',140),
   ('messages.view','Xem Messages','Truy cập tin nhắn.','messages',150),
   ('comments.view','Xem Comments','Truy cập bình luận.','comments',160)
  ON CONFLICT (key) DO UPDATE
  SET label=EXCLUDED.label,description=EXCLUDED.description,module=EXCLUDED.module,sort_order=EXCLUDED.sort_order;

  INSERT INTO admin_role_permissions (role_id,permission_id)
  SELECT role.id,permission.id
  FROM admin_roles role
  INNER JOIN admin_permissions permission ON permission.key='dashboard.view'
  WHERE role.key='staff'
  ON CONFLICT DO NOTHING;

  UPDATE users
  SET admin_role_id = (SELECT id FROM admin_roles WHERE key='super_admin')
  WHERE role='ADMIN' AND admin_role_id IS NULL;

  DROP TABLE IF EXISTS
   work_reports,work_time_entries,staff_availability,staff_leave_requests,
   work_report_types,work_time_entry_types,staff_availability_statuses,
   staff_leave_types,staff_leave_statuses,work_task_attachments,work_task_comments,
   work_task_checklists,work_task_assignees,work_project_members,work_tasks,
   work_projects,work_task_types,work_task_priorities,work_task_statuses,
   work_project_statuses,staff_role_assignments,staff_role_permissions,
   staff_profiles,staff_positions,staff_departments,staff_employment_types,
   staff_statuses,staff_permissions,staff_roles
  CASCADE;
 `);
}

async function ensureUserAccountStatusMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id", "TEXT");

 await pool.query(`
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS account_status TEXT;
 `);

 await pool.query(`
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS account_status_reason TEXT;
 `);

 await pool.query(`
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS account_status_updated_at TIMESTAMPTZ;
 `);

 await pool.query(`
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS account_status_updated_by ${userIdType};
 `);

 await pool.query(`
 DO $$
 BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND conname = 'users_account_status_updated_by_fkey'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_account_status_updated_by_fkey
    FOREIGN KEY (account_status_updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
 END
 $$;
 `);

 await pool.query(`
 UPDATE users
 SET account_status = 'active'
 WHERE account_status IS NULL OR BTRIM(account_status) = '';
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN account_status SET DEFAULT 'active';
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN account_status SET NOT NULL;
 `);

 await pool.query(`
 ALTER TABLE users
 DROP CONSTRAINT IF EXISTS users_account_status_check;
 `);

 await pool.query(`
 DO $$
 BEGIN
  ALTER TABLE users
  ADD CONSTRAINT users_account_status_check
  CHECK (account_status IN ('active', 'blocked', 'banned', 'deleted'));
 EXCEPTION
  WHEN duplicate_object THEN
  NULL;
 END
 $$;
 `);
}

async function ensureUserWishlistMigration() {
 const pool = getPool();

 await pool.query(`
 ALTER TABLE users
 ADD COLUMN IF NOT EXISTS wishlist_offering_ids JSONB;
 `);

 await pool.query(`
 UPDATE users
 SET wishlist_offering_ids = '[]'::jsonb
 WHERE wishlist_offering_ids IS NULL
 OR jsonb_typeof(wishlist_offering_ids) <> 'array';
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN wishlist_offering_ids SET DEFAULT '[]'::jsonb;
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN wishlist_offering_ids SET NOT NULL;
 `);
}

async function ensureUserProfilesMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id", "TEXT");

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_profiles (
  user_id ${userIdType} PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  provider_portal_slug TEXT,
  bio TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

  await pool.query(`
  ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS provider_portal_slug TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  `);

  await pool.query(`
  ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS pickup_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS pickup_phone TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS pickup_ward TEXT,
  ADD COLUMN IF NOT EXISTS pickup_district TEXT,
  ADD COLUMN IF NOT EXISTS pickup_province TEXT,
  ADD COLUMN IF NOT EXISTS return_same_as_pickup BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS return_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS return_phone TEXT,
  ADD COLUMN IF NOT EXISTS return_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS return_ward TEXT,
  ADD COLUMN IF NOT EXISTS return_district TEXT,
  ADD COLUMN IF NOT EXISTS return_province TEXT;
  `);

  await pool.query(`
  ALTER TABLE user_profiles
  DROP COLUMN IF EXISTS shipping_provider,
  DROP COLUMN IF EXISTS shipping_shop_id,
  DROP COLUMN IF EXISTS shipping_token,
  DROP COLUMN IF EXISTS shipping_pickup_address_id;
  `);

  await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_provider_portal_slug_uidx
  ON user_profiles (LOWER(provider_portal_slug))
  WHERE provider_portal_slug IS NOT NULL;
  `);
}

async function ensureUserShippingProfilesMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id", "TEXT");

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_shipping_profiles (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'primary',
  business_name TEXT,
  store_name TEXT,
  contact_email TEXT,
  pickup_contact_name TEXT,
  pickup_phone TEXT,
  pickup_address_line1 TEXT,
  pickup_ward TEXT,
  pickup_district TEXT,
  pickup_province TEXT,
  return_same_as_pickup BOOLEAN NOT NULL DEFAULT TRUE,
  return_contact_name TEXT,
  return_phone TEXT,
  return_address_line1 TEXT,
  return_ward TEXT,
  return_district TEXT,
  return_province TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, profile_type)
 );
 `);

 await pool.query(`
 ALTER TABLE user_shipping_profiles
 DROP COLUMN IF EXISTS shipping_provider,
 DROP COLUMN IF EXISTS shipping_shop_id,
 DROP COLUMN IF EXISTS shipping_token,
 DROP COLUMN IF EXISTS shipping_pickup_address_id;
 `);

 await pool.query(`
 INSERT INTO user_shipping_profiles (
  user_id,
  profile_type,
  business_name,
  store_name,
  contact_email,
  pickup_contact_name,
  pickup_phone,
  pickup_address_line1,
  pickup_ward,
  pickup_district,
  pickup_province,
  return_same_as_pickup,
  return_contact_name,
  return_phone,
  return_address_line1,
  return_ward,
  return_district,
  return_province
 )
 SELECT
  user_id,
  'primary',
  business_name,
  store_name,
  contact_email,
  pickup_contact_name,
  pickup_phone,
  pickup_address_line1,
  pickup_ward,
  pickup_district,
  pickup_province,
  COALESCE(return_same_as_pickup, TRUE),
  return_contact_name,
  return_phone,
  return_address_line1,
  return_ward,
  return_district,
  return_province
 FROM user_profiles
 WHERE
  COALESCE(NULLIF(BTRIM(business_name), ''), NULLIF(BTRIM(store_name), ''), NULLIF(BTRIM(contact_email), ''), NULLIF(BTRIM(pickup_contact_name), ''), NULLIF(BTRIM(pickup_phone), ''), NULLIF(BTRIM(pickup_address_line1), ''), NULLIF(BTRIM(pickup_district), ''), NULLIF(BTRIM(pickup_province), ''), NULLIF(BTRIM(return_contact_name), ''), NULLIF(BTRIM(return_phone), ''), NULLIF(BTRIM(return_address_line1), ''), NULLIF(BTRIM(return_district), ''), NULLIF(BTRIM(return_province), '')) IS NOT NULL
 ON CONFLICT (user_id, profile_type) DO NOTHING;
 `);
}

async function ensureUserAddressesMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id", "TEXT");

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  recipient_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  line1 TEXT NOT NULL DEFAULT '',
  line2 TEXT NOT NULL DEFAULT '',
  ward TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'VN',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

 await pool.query(`
 CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx
 ON user_addresses(user_id, is_default DESC, updated_at DESC);
 `);

 await pool.query(`
 CREATE UNIQUE INDEX IF NOT EXISTS user_addresses_one_default_uidx
 ON user_addresses(user_id)
 WHERE is_default = TRUE;
 `);
}

async function ensureAppSettingsMigration() {
  const pool = getPool();

  await ensureAppSettingsTextId();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'pink',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT app_settings_id_check CHECK (id = 'system'),
      CONSTRAINT app_settings_theme_check CHECK (theme IN ('pink', 'black'))
    );
  `);

  await pool.query(`
    ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS seo_breadcrumb JSONB,
    ADD COLUMN IF NOT EXISTS seo_sitemap JSONB,
    ADD COLUMN IF NOT EXISTS seo_redirects JSONB,
    ADD COLUMN IF NOT EXISTS seo_indexing JSONB,
    ADD COLUMN IF NOT EXISTS seo_branding JSONB,
    ADD COLUMN IF NOT EXISTS seo_opengraph JSONB,
    ADD COLUMN IF NOT EXISTS seo_favicon JSONB,
    ADD COLUMN IF NOT EXISTS global_fields_config JSONB,
    ADD COLUMN IF NOT EXISTS commerce_config JSONB,
    ADD COLUMN IF NOT EXISTS internal_api_config JSONB,
    ADD COLUMN IF NOT EXISTS email_config JSONB,
    ADD COLUMN IF NOT EXISTS third_party_config JSONB;
  `);

  await pool.query(`
    ALTER TABLE app_settings
    DROP COLUMN IF EXISTS seo_permalink;
  `);

  await pool.query(`
    INSERT INTO app_settings (id, theme, updated_at)
    VALUES ('system', 'pink', NOW())
    ON CONFLICT (id) DO NOTHING;
  `);

  await pool.query(`
    UPDATE app_settings
    SET seo_branding = jsonb_strip_nulls(
          COALESCE(seo_branding, '{}'::jsonb) ||
          jsonb_build_object(
            'siteFavicon',
            CASE
              WHEN NULLIF(BTRIM(COALESCE(seo_branding->>'siteFavicon', '')), '') IS NOT NULL
                THEN seo_branding->>'siteFavicon'
              ELSE NULLIF(BTRIM(COALESCE(seo_favicon->>'siteFavicon', '')), '')
            END,
            'appleTouchIcon',
            CASE
              WHEN NULLIF(BTRIM(COALESCE(seo_branding->>'appleTouchIcon', '')), '') IS NOT NULL
                THEN seo_branding->>'appleTouchIcon'
              ELSE NULLIF(BTRIM(COALESCE(seo_favicon->>'appleTouchIcon', '')), '')
            END
          )
        ),
        updated_at = NOW()
    WHERE id = 'system'
      AND seo_favicon IS NOT NULL;
  `);
}

async function ensureOauthAccountsMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id", "TEXT");

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
 );
 `);
}

async function ensureManagedPagesMigration() {
  const client = await getPool().connect();

  try {
    await client.query("SELECT pg_advisory_lock(hashtext('pinklove_managed_pages_migration'))");

  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cms_pages'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'managed_pages'
      ) THEN
        ALTER TABLE cms_pages RENAME TO managed_pages;
      END IF;
    END $$;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS managed_pages (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      title TEXT,
      excerpt TEXT,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      template TEXT NOT NULL DEFAULT 'default',
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT,
      canonical_url TEXT,
      breadcrumb_title TEXT,
      breadcrumb_parent_slug TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      noindex BOOLEAN NOT NULL DEFAULT false,
      nofollow BOOLEAN NOT NULL DEFAULT false,
      admin_used BOOLEAN NOT NULL DEFAULT false,
      custom_fields JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    ALTER TABLE managed_pages
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS excerpt TEXT,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
    ADD COLUMN IF NOT EXISTS canonical_url TEXT,
    ADD COLUMN IF NOT EXISTS breadcrumb_title TEXT,
    ADD COLUMN IF NOT EXISTS breadcrumb_parent_slug TEXT,
    ADD COLUMN IF NOT EXISTS og_title TEXT,
    ADD COLUMN IF NOT EXISTS og_description TEXT,
    ADD COLUMN IF NOT EXISTS og_image TEXT,
    ADD COLUMN IF NOT EXISTS noindex BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nofollow BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS admin_used BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_fields JSONB,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `);

  await client.query(`
	    UPDATE managed_pages
	    SET
	      status = COALESCE(status, 'draft'),
	      template = COALESCE(template, 'default'),
	      noindex = COALESCE(noindex, false),
	      nofollow = COALESCE(nofollow, false),
	      admin_used = COALESCE(admin_used, false),
	      custom_fields = COALESCE(custom_fields, '{}'::jsonb),
	      created_at = COALESCE(created_at, NOW()),
	      updated_at = COALESCE(updated_at, NOW())
	    WHERE
	      status IS NULL
	      OR template IS NULL
	      OR noindex IS NULL
	      OR nofollow IS NULL
	      OR admin_used IS NULL
	      OR custom_fields IS NULL
	      OR created_at IS NULL
	      OR updated_at IS NULL;
  `);

  await client.query(`DROP INDEX IF EXISTS managed_pages_permalink_idx;`);

  await client.query(`
    ALTER TABLE managed_pages
    DROP COLUMN IF EXISTS permalink;
  `);

  await client.query(`
    ALTER TABLE managed_pages
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN template SET DEFAULT 'default',
    ALTER COLUMN noindex SET DEFAULT false,
    ALTER COLUMN nofollow SET DEFAULT false,
    ALTER COLUMN admin_used SET DEFAULT false,
    ALTER COLUMN admin_used SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();
  `);

  await client.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'managed_pages'
          AND column_name = 'admin_checked'
      ) THEN
        UPDATE managed_pages
        SET admin_used = COALESCE(admin_used, admin_checked, false);

        ALTER TABLE managed_pages
        DROP COLUMN admin_checked;
      END IF;
    END $$;
	  `);
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('pinklove_managed_pages_migration'))");
    client.release();
  }
}

async function ensureManagedPagesMigrationOnce() {
  if (globalForDb.managedPagesMigrationDone) {
    return;
  }

  if (!globalForDb.managedPagesMigrationPromise) {
    globalForDb.managedPagesMigrationPromise = ensureManagedPagesMigration()
      .then(() => {
        globalForDb.managedPagesMigrationDone = true;
      })
      .finally(() => {
        globalForDb.managedPagesMigrationPromise = undefined;
      });
  }

  await globalForDb.managedPagesMigrationPromise;
}

async function ensureMenuTablesMigration() {
  const pool = getPool();

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cms_menus'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'navigation_menus'
      ) THEN
        ALTER TABLE cms_menus RENAME TO navigation_menus;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'cms_menu_items'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'navigation_menu_items'
      ) THEN
        ALTER TABLE cms_menu_items RENAME TO navigation_menu_items;
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS navigation_menus (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS navigation_menu_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      menu_id TEXT NOT NULL REFERENCES navigation_menus(id) ON DELETE CASCADE,
      parent_id TEXT,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      page_slug TEXT,
      url TEXT,
      position INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT navigation_menu_items_type_check CHECK (type IN ('page', 'custom'))
    );
  `);

  await pool.query(`
    ALTER TABLE navigation_menu_items
    ADD COLUMN IF NOT EXISTS parent_id TEXT;
  `);

  await ensureTextForeignKeyColumn({
    tableName: "navigation_menu_items",
    columnName: "menu_id",
    referenceTable: "navigation_menus",
    onDelete: "CASCADE",
    notNull: true,
  });

  await pool.query(`
    CREATE INDEX IF NOT EXISTS navigation_menu_items_menu_id_idx
    ON navigation_menu_items(menu_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS navigation_menu_items_parent_id_idx
    ON navigation_menu_items(parent_id);
  `);
}

async function ensureAffiliateTablesMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id", "TEXT");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_accounts (
      user_id ${userIdType} PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      commission_type TEXT NOT NULL DEFAULT 'percent',
      commission_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      approved_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT affiliate_accounts_status_check CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
      CONSTRAINT affiliate_accounts_commission_type_check CHECK (commission_type IN ('percent', 'fixed'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      affiliate_user_id TEXT NOT NULL REFERENCES affiliate_accounts(user_id) ON DELETE CASCADE,
      affiliate_code TEXT NOT NULL,
      landing_path TEXT NOT NULL,
      referrer TEXT,
      visitor_token TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS affiliate_clicks_affiliate_user_id_idx
    ON affiliate_clicks(affiliate_user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      affiliate_user_id TEXT NOT NULL REFERENCES affiliate_accounts(user_id) ON DELETE CASCADE,
      affiliate_code TEXT NOT NULL,
      external_order_ref TEXT UNIQUE,
      order_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
      commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT affiliate_conversions_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'paid'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS affiliate_conversions_affiliate_user_id_idx
    ON affiliate_conversions(affiliate_user_id);
  `);
}

async function ensureInternalAccountsMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS internal_accounts (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      platform TEXT NOT NULL,
      label TEXT NOT NULL,
      login_username TEXT NOT NULL DEFAULT '',
      login_password TEXT NOT NULL DEFAULT '',
      login_url TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE internal_accounts
    ADD COLUMN IF NOT EXISTS platform TEXT,
    ADD COLUMN IF NOT EXISTS label TEXT,
    ADD COLUMN IF NOT EXISTS login_username TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS login_password TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS login_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `);

  await pool.query(`
    UPDATE internal_accounts
    SET
      platform = COALESCE(NULLIF(platform, ''), 'Khác'),
      label = COALESCE(NULLIF(label, ''), platform, 'Tài khoản'),
      login_username = COALESCE(login_username, ''),
      login_password = COALESCE(login_password, ''),
      login_url = COALESCE(login_url, ''),
      notes = COALESCE(notes, ''),
      sort_order = COALESCE(sort_order, 0),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW());
  `);

  await pool.query(`
    ALTER TABLE internal_accounts
    ALTER COLUMN platform SET NOT NULL,
    ALTER COLUMN label SET NOT NULL,
    ALTER COLUMN login_username SET NOT NULL,
    ALTER COLUMN login_password SET NOT NULL,
    ALTER COLUMN login_url SET NOT NULL,
    ALTER COLUMN notes SET NOT NULL,
    ALTER COLUMN sort_order SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS internal_accounts_sort_order_idx
    ON internal_accounts(sort_order, updated_at DESC);
  `);
}

async function ensureOfferingTablesMigration() {
  const pool = getPool();
  const offeringIdType = await getColumnTypeSql("offerings", "id", "TEXT");
  const userIdType = await getColumnTypeSql("users", "id", "TEXT");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_categories (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_categories_status_check CHECK (status IN ('draft', 'published'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offerings (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      category_id TEXT REFERENCES offering_categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      excerpt TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      offering_type TEXT NOT NULL,
      template_key TEXT NOT NULL,
      template_engine TEXT NOT NULL DEFAULT '',
      template_mode TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      fulfillment_type TEXT NOT NULL DEFAULT 'digital',
      track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
      stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 0,
      allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offerings_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'archived', 'disabled')),
      CONSTRAINT offerings_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service')),
      CONSTRAINT offerings_stock_quantity_check CHECK (stock_quantity >= 0 OR allow_backorder = TRUE),
      CONSTRAINT offerings_low_stock_threshold_check CHECK (low_stock_threshold >= 0)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_types (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      description TEXT,
      fulfillment_type TEXT NOT NULL DEFAULT 'digital',
      template_key TEXT NOT NULL DEFAULT '',
      template_engine TEXT NOT NULL DEFAULT '',
      template_mode TEXT NOT NULL DEFAULT '',
      supports_inventory BOOLEAN NOT NULL DEFAULT FALSE,
      supports_provider_supply BOOLEAN NOT NULL DEFAULT FALSE,
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_types_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service'))
    );
  `);

  await pool.query(`
    ALTER TABLE offering_types
    DROP CONSTRAINT IF EXISTS offering_types_status_check,
    DROP COLUMN IF EXISTS status;
  `);

  await pool.query(`
    ALTER TABLE offerings
    DROP CONSTRAINT IF EXISTS offerings_type_check;
  `);

  await pool.query(`
    ALTER TABLE offerings
    ADD COLUMN IF NOT EXISTS template_engine TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS template_mode TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE offering_types
    ADD COLUMN IF NOT EXISTS template_engine TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS template_mode TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS supports_provider_supply BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  for (const type of REGISTERED_OFFERING_TYPES) {
    await pool.query(
      `
        INSERT INTO offering_types (
          key,
          label,
          description,
          fulfillment_type,
          template_key,
          template_engine,
          template_mode,
          supports_inventory,
          supports_provider_supply,
          is_system,
          is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE)
        ON CONFLICT (key) DO UPDATE
        SET
          label = EXCLUDED.label,
          description = EXCLUDED.description,
          fulfillment_type = EXCLUDED.fulfillment_type,
          template_key = EXCLUDED.template_key,
          template_engine = EXCLUDED.template_engine,
          template_mode = EXCLUDED.template_mode,
          supports_inventory = EXCLUDED.supports_inventory,
          supports_provider_supply = EXCLUDED.supports_provider_supply,
          is_system = TRUE,
          is_default = TRUE,
          updated_at = NOW()
      `,
      [
        type.key,
        type.label,
        type.description,
        type.fulfillmentType,
        type.templateKey,
        type.templateEngine ?? "",
        type.templateMode ?? "",
        type.supportsInventory,
        type.supportsProviderSupply,
      ]
    );
  }

  const registeredOfferingTypeKeys = REGISTERED_OFFERING_TYPES.map((type) => type.key);
  await pool.query(
    "DELETE FROM offerings WHERE NOT (offering_type = ANY($1::text[]))",
    [registeredOfferingTypeKeys]
  );
  await pool.query(
    "DELETE FROM offering_types WHERE NOT (key = ANY($1::text[]))",
    [registeredOfferingTypeKeys]
  );

  await pool.query(`
    ALTER TABLE offerings
    ADD COLUMN IF NOT EXISTS category_id TEXT,
    ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'digital',
    ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    UPDATE offerings
    SET
      fulfillment_type = COALESCE(NULLIF(fulfillment_type, ''), 'digital'),
      track_inventory = COALESCE(track_inventory, FALSE),
      stock_quantity = COALESCE(stock_quantity, 0),
      low_stock_threshold = COALESCE(low_stock_threshold, 0),
      allow_backorder = COALESCE(allow_backorder, FALSE);
  `);

  await pool.query(`
    ALTER TABLE offerings
    ALTER COLUMN fulfillment_type SET NOT NULL,
    ALTER COLUMN track_inventory SET NOT NULL,
    ALTER COLUMN stock_quantity SET NOT NULL,
    ALTER COLUMN low_stock_threshold SET NOT NULL,
    ALTER COLUMN allow_backorder SET NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE offerings
    DROP CONSTRAINT IF EXISTS offerings_fulfillment_type_check,
    DROP CONSTRAINT IF EXISTS offerings_stock_quantity_check,
    DROP CONSTRAINT IF EXISTS offerings_low_stock_threshold_check;
  `);

  await pool.query(`
    DO $$
    BEGIN
      ALTER TABLE offerings
      ADD CONSTRAINT offerings_fulfillment_type_check
      CHECK (fulfillment_type IN ('digital', 'physical', 'service'));
    EXCEPTION
      WHEN duplicate_object THEN
      NULL;
    END
    $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      ALTER TABLE offerings
      ADD CONSTRAINT offerings_stock_quantity_check
      CHECK (stock_quantity >= 0 OR allow_backorder = TRUE);
    EXCEPTION
      WHEN duplicate_object THEN
      NULL;
    END
    $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      ALTER TABLE offerings
      ADD CONSTRAINT offerings_low_stock_threshold_check
      CHECK (low_stock_threshold >= 0);
    EXCEPTION
      WHEN duplicate_object THEN
      NULL;
    END
    $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'offerings_category_id_fkey'
      ) THEN
        ALTER TABLE offerings
        ADD CONSTRAINT offerings_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES offering_categories(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS offerings_category_id_idx
    ON offerings(category_id);
  `);

  await pool.query(`
    DROP INDEX IF EXISTS offerings_template_key_unique_idx;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS digital_template_offerings (
      offering_id ${offeringIdType} PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      template_key TEXT NOT NULL,
      template_engine TEXT NOT NULL DEFAULT 'coded',
      template_mode TEXT NOT NULL DEFAULT 'fixed',
      site_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT digital_template_offerings_engine_check CHECK (template_engine IN ('coded', 'builder', 'hybrid', 'motion', 'video', 'ai_generated')),
      CONSTRAINT digital_template_offerings_mode_check CHECK (template_mode IN ('fixed', 'editable', 'hybrid'))
    );
  `);

  await pool.query(`
    ALTER TABLE digital_template_offerings
    ADD COLUMN IF NOT EXISTS template_engine TEXT NOT NULL DEFAULT 'coded',
    ADD COLUMN IF NOT EXISTS template_mode TEXT NOT NULL DEFAULT 'fixed';
  `);

  await pool.query(`
    ALTER TABLE digital_template_offerings
    DROP CONSTRAINT IF EXISTS digital_template_offerings_engine_check,
    DROP CONSTRAINT IF EXISTS digital_template_offerings_mode_check;
  `);

  await pool.query(`
    ALTER TABLE digital_template_offerings
    ADD CONSTRAINT digital_template_offerings_engine_check CHECK (template_engine IN ('coded', 'builder', 'hybrid', 'motion', 'video', 'ai_generated'));
  `);

  await pool.query(`
    ALTER TABLE digital_template_offerings
    ADD CONSTRAINT digital_template_offerings_mode_check CHECK (template_mode IN ('fixed', 'editable', 'hybrid'));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS physical_offerings (
      offering_id ${offeringIdType} PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      fulfillment_type TEXT NOT NULL DEFAULT 'digital',
      track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
      stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 0,
      allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
      cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      provider_sku TEXT NOT NULL DEFAULT '',
      allow_provider_supply BOOLEAN NOT NULL DEFAULT FALSE,
      provider_type TEXT,
      provider_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT physical_offerings_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service')),
      CONSTRAINT physical_offerings_cost_price_check CHECK (cost_price >= 0),
      CONSTRAINT physical_offerings_stock_quantity_check CHECK (stock_quantity >= 0 OR allow_backorder = TRUE),
      CONSTRAINT physical_offerings_low_stock_threshold_check CHECK (low_stock_threshold >= 0)
    );
  `);

  await pool.query(`
    ALTER TABLE physical_offerings
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provider_sku TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS allow_provider_supply BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS provider_type TEXT,
    ADD COLUMN IF NOT EXISTS provider_id TEXT;
  `);

  await pool.query(`ALTER TABLE physical_offerings DROP CONSTRAINT IF EXISTS physical_offerings_owner_type_check;`);
  await pool.query(`ALTER TABLE physical_offerings DROP COLUMN IF EXISTS owner_type;`);

  await pool.query(`
    INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
    SELECT
      offerings.id,
      offerings.template_key,
      COALESCE(NULLIF(offerings.template_engine, ''), 'coded'),
      COALESCE(NULLIF(offerings.template_mode, ''), CASE WHEN COALESCE(NULLIF(offerings.template_engine, ''), 'coded') = 'builder' THEN 'editable' ELSE 'fixed' END),
      CASE
        WHEN jsonb_typeof(offerings.config -> 'siteDefaults') = 'object' THEN offerings.config -> 'siteDefaults'
        ELSE '{}'::jsonb
      END
    FROM offerings
    WHERE offerings.offering_type = 'digital_template'
    ON CONFLICT (offering_id) DO UPDATE
    SET
      template_key = EXCLUDED.template_key,
      template_engine = EXCLUDED.template_engine,
      template_mode = EXCLUDED.template_mode,
      site_defaults = EXCLUDED.site_defaults,
      updated_at = NOW();
  `);

  await pool.query(`
    INSERT INTO physical_offerings (
      offering_id,
      fulfillment_type,
      track_inventory,
      stock_quantity,
      low_stock_threshold,
      allow_backorder,
      cost_price,
      provider_sku,
      allow_provider_supply,
      provider_type,
      provider_id
    )
    SELECT
      offerings.id,
      offerings.fulfillment_type,
      offerings.track_inventory,
      offerings.stock_quantity,
      offerings.low_stock_threshold,
      offerings.allow_backorder,
      0,
      '',
      FALSE,
      NULL,
      NULL
    FROM offerings
    WHERE offerings.offering_type <> 'digital_template'
      AND (
        offerings.fulfillment_type = 'physical'
        OR offerings.track_inventory = TRUE
      )
    ON CONFLICT (offering_id) DO UPDATE
    SET
      fulfillment_type = EXCLUDED.fulfillment_type,
      track_inventory = EXCLUDED.track_inventory,
      stock_quantity = EXCLUDED.stock_quantity,
      low_stock_threshold = EXCLUDED.low_stock_threshold,
      allow_backorder = EXCLUDED.allow_backorder,
      allow_provider_supply = EXCLUDED.allow_provider_supply,
      provider_type = EXCLUDED.provider_type,
      provider_id = EXCLUDED.provider_id,
      updated_at = NOW();
  `);

  await pool.query(`
    DELETE FROM digital_template_offerings
    WHERE offering_id IN (
      SELECT id
      FROM offerings
      WHERE offering_type <> 'digital_template'
    );
  `);

  await pool.query(`
    DELETE FROM physical_offerings
    WHERE offering_id IN (
      SELECT id
      FROM offerings
      WHERE offering_type = 'digital_template'
    );
  `);

  await pool.query(`
    UPDATE offerings
    SET config = config - 'inventory' - 'pricing_rules' - 'permissions' - 'analytics' - 'booking_logic' - 'relational_data' - 'siteDefaults' - 'generalOffering'
    WHERE offering_type <> 'digital_template'
      AND config ?| ARRAY['inventory', 'pricing_rules', 'permissions', 'analytics', 'booking_logic', 'relational_data', 'siteDefaults', 'generalOffering'];
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS digital_template_offerings_template_key_idx
    ON digital_template_offerings(template_key);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS digital_template_offerings_engine_idx
    ON digital_template_offerings(template_engine, template_mode);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS physical_offerings_provider_id_idx
    ON physical_offerings(provider_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_type_field_groups (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      offering_type_id TEXT NOT NULL REFERENCES offering_types(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      ui_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_type_field_groups_key_unique UNIQUE (offering_type_id, key)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_type_fields (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      offering_type_id TEXT NOT NULL REFERENCES offering_types(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES offering_type_field_groups(id) ON DELETE SET NULL,
      field_key TEXT NOT NULL,
      field_label TEXT NOT NULL,
      field_type TEXT NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT FALSE,
      default_value JSONB,
      validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
      ui_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      visibility_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
      dependency_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
      relation_target TEXT,
      relation_multiple BOOLEAN NOT NULL DEFAULT FALSE,
      relation_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_type_fields_key_unique UNIQUE (offering_type_id, field_key),
      CONSTRAINT offering_type_fields_type_check CHECK (field_type IN ('text', 'textarea', 'richtext', 'number', 'boolean', 'select', 'multiselect', 'date', 'datetime', 'media', 'gallery', 'price', 'location', 'json', 'repeater', 'relation', 'blocks', 'url'))
    );
  `);

  await pool.query(`
    ALTER TABLE offering_type_fields
    ADD COLUMN IF NOT EXISTS group_id TEXT;
  `);

  await pool.query(`
    ALTER TABLE offering_type_fields
    ADD COLUMN IF NOT EXISTS visibility_conditions JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await pool.query(`
    ALTER TABLE offering_type_fields
    ADD COLUMN IF NOT EXISTS dependency_conditions JSONB NOT NULL DEFAULT '{}'::jsonb;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'offering_type_fields'::regclass
          AND conname = 'offering_type_fields_group_id_fkey'
      ) THEN
        ALTER TABLE offering_type_fields
        ADD CONSTRAINT offering_type_fields_group_id_fkey
        FOREIGN KEY (group_id)
        REFERENCES offering_type_field_groups(id)
        ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS offering_type_field_groups_type_sort_idx
    ON offering_type_field_groups(offering_type_id, sort_order, label);
  `);

  await pool.query(`
    WITH deprecated_system_types AS (
      SELECT id
      FROM offering_types
      WHERE key IN ('service', 'creator_service', 'experience', 'subscription', 'addon')
    )
    DELETE FROM offering_type_fields
    WHERE offering_type_id IN (SELECT id FROM deprecated_system_types);
  `);
  await pool.query(`
    WITH deprecated_system_types AS (
      SELECT id
      FROM offering_types
      WHERE key IN ('service', 'creator_service', 'experience', 'subscription', 'addon')
    )
    DELETE FROM offering_type_field_groups
    WHERE offering_type_id IN (SELECT id FROM deprecated_system_types);
  `);
  await pool.query(`
    DELETE FROM offering_types
    WHERE key IN ('service', 'creator_service', 'experience', 'subscription', 'addon');
  `);

  await pool.query(`
    ALTER TABLE offering_types
    DROP CONSTRAINT IF EXISTS offering_types_field_schema_array_check;
  `);

  await pool.query(`
    ALTER TABLE offering_types
    DROP COLUMN IF EXISTS field_schema;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_sites (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      site_type TEXT NOT NULL,
      template_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      custom_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wedding_sites_type_check CHECK (site_type IN ('coded', 'editable')),
      CONSTRAINT wedding_sites_status_check CHECK (status IN ('draft', 'published'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS wedding_sites_user_id_idx
    ON wedding_sites(user_id);
  `);
}

async function ensureLandingPageTablesMigration() {
  const pool = getPool();
  const offeringIdType = await getColumnTypeSql("offerings", "id", "TEXT");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS landing_pages (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      source_offering_id ${offeringIdType} REFERENCES offerings(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      page_type TEXT NOT NULL DEFAULT 'landing',
      status TEXT NOT NULL DEFAULT 'draft',
      theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT landing_pages_type_check CHECK (page_type IN ('default', 'landing', 'seo', 'campaign', 'ab_test')),
      CONSTRAINT landing_pages_status_check CHECK (status IN ('draft', 'published', 'archived', 'disabled')),
      CONSTRAINT landing_pages_slug_format_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
    );
  `);

  await pool.query(`
    ALTER TABLE landing_pages ALTER COLUMN source_offering_id DROP NOT NULL;
    ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_type_check;
    ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_status_check;
    ALTER TABLE landing_pages DROP CONSTRAINT IF EXISTS landing_pages_slug_format_check;
  `);

  await pool.query(`
    UPDATE landing_pages page
    SET slug = page.slug || '-' || LOWER(REGEXP_REPLACE(page.id, '[^a-zA-Z0-9]', '', 'g'))
    FROM (
      SELECT id
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS duplicate_order
        FROM landing_pages
      ) ranked
      WHERE duplicate_order > 1
    ) duplicates
    WHERE page.id = duplicates.id;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'landing_pages_source_offering_id_fkey'
          AND conrelid = 'landing_pages'::regclass
      ) THEN
        ALTER TABLE landing_pages
          ADD CONSTRAINT landing_pages_source_offering_id_fkey
          FOREIGN KEY (source_offering_id) REFERENCES offerings(id) ON DELETE SET NULL;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'landing_pages_slug_unique'
          AND conrelid = 'landing_pages'::regclass
      ) THEN
        ALTER TABLE landing_pages
          ADD CONSTRAINT landing_pages_slug_unique UNIQUE (slug);
      END IF;
    END
    $$;

    ALTER TABLE landing_pages
      ADD CONSTRAINT landing_pages_type_check
      CHECK (page_type IN ('default', 'landing', 'seo', 'campaign', 'ab_test'));
    ALTER TABLE landing_pages
      ADD CONSTRAINT landing_pages_status_check
      CHECK (status IN ('draft', 'published', 'archived', 'disabled'));
    ALTER TABLE landing_pages
      ADD CONSTRAINT landing_pages_slug_format_check
      CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS landing_page_sections (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      landing_page_id TEXT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      section_type TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT landing_page_sections_type_check CHECK (
        section_type IN (
          'hero',
          'gallery',
          'video',
          'reviews',
          'faq',
          'countdown',
          'cta',
          'pricing',
          'features',
          'related_products',
          'custom'
        )
      )
    );
  `);

  await pool.query(`
    ALTER TABLE landing_page_sections DROP CONSTRAINT IF EXISTS landing_page_sections_type_check;
    ALTER TABLE landing_page_sections
      ADD CONSTRAINT landing_page_sections_type_check
      CHECK (
        section_type IN (
          'hero',
          'gallery',
          'video',
          'reviews',
          'faq',
          'countdown',
          'cta',
          'pricing',
          'features',
          'related_products',
          'custom'
        )
      );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      landing_page_id TEXT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'draft',
      budget NUMERIC(12,2) NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT campaigns_channel_check CHECK (channel IN ('facebook', 'tiktok', 'google', 'email', 'affiliate', 'organic')),
      CONSTRAINT campaigns_status_check CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
      CONSTRAINT campaigns_budget_check CHECK (budget >= 0),
      CONSTRAINT campaigns_date_range_check CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS campaign_stats (
      campaign_id TEXT PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
      views INT NOT NULL DEFAULT 0,
      clicks INT NOT NULL DEFAULT 0,
      add_to_cart INT NOT NULL DEFAULT 0,
      checkout INT NOT NULL DEFAULT 0,
      orders INT NOT NULL DEFAULT 0,
      revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
      roas NUMERIC(12,4) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT campaign_stats_non_negative_check CHECK (
        views >= 0
        AND clicks >= 0
        AND add_to_cart >= 0
        AND checkout >= 0
        AND orders >= 0
        AND revenue >= 0
        AND roas >= 0
      )
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ab_experiments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      primary_metric TEXT NOT NULL DEFAULT 'orders',
      started_at TIMESTAMPTZ,
      ended_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ab_experiments_status_check CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
      CONSTRAINT ab_experiments_primary_metric_check CHECK (primary_metric IN ('views', 'clicks', 'add_to_cart', 'checkout', 'orders', 'revenue')),
      CONSTRAINT ab_experiments_date_range_check CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
    );
  `);

  await pool.query(`
    ALTER TABLE ab_experiments DROP COLUMN IF EXISTS offering_id;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ab_experiment_landing_pages (
      experiment_id TEXT NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
      landing_page_id TEXT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      traffic_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (experiment_id, landing_page_id),
      CONSTRAINT ab_experiment_landing_pages_traffic_check CHECK (traffic_percent >= 0 AND traffic_percent <= 100)
    );
  `);

  await pool.query(`
    ALTER TABLE ab_experiment_landing_pages DROP CONSTRAINT IF EXISTS ab_experiment_landing_pages_traffic_check;
    ALTER TABLE ab_experiment_landing_pages
      ADD CONSTRAINT ab_experiment_landing_pages_traffic_check
      CHECK (traffic_percent >= 0 AND traffic_percent <= 100);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS landing_pages_source_offering_id_idx ON landing_pages(source_offering_id);
    CREATE INDEX IF NOT EXISTS landing_pages_status_idx ON landing_pages(status);
    CREATE INDEX IF NOT EXISTS landing_page_sections_page_sort_idx ON landing_page_sections(landing_page_id, sort_order, created_at);
    CREATE INDEX IF NOT EXISTS campaigns_landing_page_id_idx ON campaigns(landing_page_id);
    CREATE INDEX IF NOT EXISTS campaigns_channel_status_idx ON campaigns(channel, status);
    CREATE INDEX IF NOT EXISTS ab_experiment_landing_pages_page_id_idx ON ab_experiment_landing_pages(landing_page_id);
  `);
}

async function ensureBlogTablesMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_categories (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT blog_categories_status_check CHECK (status IN ('draft', 'published'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      category_id TEXT NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      cover_image TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS blog_posts_category_id_idx
    ON blog_posts(category_id);
  `);
}

async function ensureCommerceTablesMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id");
  const offeringIdType = await getColumnTypeSql("offerings", "id");
  const affiliateUserIdType = await getColumnTypeSql("affiliate_accounts", "user_id", userIdType);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_cart_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      offering_id ${offeringIdType} NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      quantity INT NOT NULL DEFAULT 1,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT shopping_cart_items_quantity_check CHECK (quantity > 0),
      CONSTRAINT shopping_cart_items_user_offering_unique UNIQUE (user_id, offering_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS shopping_cart_items_user_id_idx
    ON shopping_cart_items(user_id, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_orders (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_number TEXT NOT NULL UNIQUE,
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_payment',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      fulfillment_status TEXT NOT NULL DEFAULT 'not_required',
      currency TEXT NOT NULL DEFAULT 'VND',
      subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      shipping_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      shipping_name TEXT NOT NULL DEFAULT '',
      shipping_phone TEXT NOT NULL DEFAULT '',
      shipping_line1 TEXT NOT NULL DEFAULT '',
      shipping_line2 TEXT NOT NULL DEFAULT '',
      shipping_ward TEXT NOT NULL DEFAULT '',
      shipping_district TEXT NOT NULL DEFAULT '',
      shipping_city TEXT NOT NULL DEFAULT '',
      shipping_postal_code TEXT NOT NULL DEFAULT '',
      shipping_country TEXT NOT NULL DEFAULT 'VN',
      notes TEXT NOT NULL DEFAULT '',
      affiliate_user_id ${affiliateUserIdType} REFERENCES affiliate_accounts(user_id) ON DELETE SET NULL,
      affiliate_code TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      paid_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_orders_status_check CHECK (status IN ('pending_payment', 'paid', 'processing', 'ready_to_ship', 'shipped', 'completed', 'cancelled', 'refunded')),
      CONSTRAINT commerce_orders_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
      CONSTRAINT commerce_orders_fulfillment_status_check CHECK (fulfillment_status IN ('not_required', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_orders_user_id_idx
    ON commerce_orders(user_id, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_orders_status_idx
    ON commerce_orders(status, payment_status, fulfillment_status, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_order_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
      offering_id ${offeringIdType} REFERENCES offerings(id) ON DELETE SET NULL,
      offering_name TEXT NOT NULL,
      offering_slug TEXT NOT NULL,
      offering_type TEXT NOT NULL,
      fulfillment_type TEXT NOT NULL DEFAULT 'digital',
      quantity INT NOT NULL DEFAULT 1,
      unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_order_items_quantity_check CHECK (quantity > 0),
      CONSTRAINT commerce_order_items_offering_type_check CHECK (offering_type <> ''),
      CONSTRAINT commerce_order_items_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_order_items_order_id_idx
    ON commerce_order_items(order_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_payments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
      method TEXT NOT NULL DEFAULT 'bank_transfer',
      provider TEXT NOT NULL DEFAULT 'manual_bank_transfer',
      amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      external_ref TEXT,
      paid_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
    );
  `);

  await pool.query(`
    ALTER TABLE commerce_payments
    DROP CONSTRAINT IF EXISTS commerce_payments_method_check;
  `);

  await pool.query(`
    ALTER TABLE commerce_payments
      ALTER COLUMN method SET DEFAULT 'bank_transfer',
      ALTER COLUMN provider SET DEFAULT 'manual_bank_transfer';
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_payments_order_id_idx
    ON commerce_payments(order_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_payment_logs (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_id TEXT REFERENCES commerce_orders(id) ON DELETE SET NULL,
      payment_id TEXT REFERENCES commerce_payments(id) ON DELETE SET NULL,
      provider TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_payment_logs_payment_id_idx
    ON commerce_payment_logs(payment_id, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_payment_logs_order_id_idx
    ON commerce_payment_logs(order_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_shipments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id) ON DELETE CASCADE,
      carrier TEXT NOT NULL DEFAULT '',
      tracking_number TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT NOT NULL DEFAULT '',
      shipped_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_shipments_status_check CHECK (status IN ('pending', 'packing', 'shipped', 'delivered', 'returned', 'cancelled'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_entitlements (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      offering_id ${offeringIdType} NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL REFERENCES commerce_orders(id) ON DELETE CASCADE,
      order_item_id TEXT REFERENCES commerce_order_items(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_entitlements_status_check CHECK (status IN ('active', 'revoked'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_entitlements_user_id_idx
    ON commerce_entitlements(user_id, status, created_at DESC);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS commerce_entitlements_unique_active_idx
    ON commerce_entitlements(user_id, offering_id, order_id);
  `);
}

async function ensureCoreDatabaseRefactorMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id", "TEXT");
  const weddingSiteIdType = await getColumnTypeSql("wedding_sites", "id", "TEXT");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offerings (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      legacy_offering_id TEXT UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      offering_type TEXT NOT NULL,
      base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'VND',
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offerings_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'archived', 'disabled'))
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS offerings_type_status_idx ON offerings(offering_type, status, updated_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS digital_template_offerings (
      offering_id TEXT PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      template_key TEXT NOT NULL,
      template_engine TEXT NOT NULL DEFAULT 'coded',
      site_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT digital_template_offerings_engine_check CHECK (template_engine IN ('coded', 'builder', 'external'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_site_offerings (
      offering_id TEXT PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      template_key TEXT NOT NULL,
      builder_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_offerings (
      offering_id TEXT PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      service_kind TEXT NOT NULL DEFAULT 'general',
      duration_minutes INT NOT NULL DEFAULT 0,
      requires_consultation BOOLEAN NOT NULL DEFAULT TRUE,
      service_area TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_service_offerings (
      offering_id TEXT PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      provider_id TEXT,
      provider_type TEXT,
      service_kind TEXT NOT NULL DEFAULT 'creator_service',
      delivery_days INT NOT NULL DEFAULT 0,
      revision_limit INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE creator_service_offerings
    ADD COLUMN IF NOT EXISTS provider_id TEXT,
    ADD COLUMN IF NOT EXISTS provider_type TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS experience_offerings (
      offering_id TEXT PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      experience_kind TEXT NOT NULL DEFAULT 'wedding_experience',
      location_note TEXT NOT NULL DEFAULT '',
      capacity_min INT NOT NULL DEFAULT 0,
      capacity_max INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_asset_links (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      role TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT media_asset_links_target_type_check CHECK (target_type IN ('offering', 'provider', 'wedding_site', 'gallery', 'booking', 'organization', 'template')),
      CONSTRAINT media_asset_links_role_check CHECK (role IN ('thumbnail', 'hero', 'gallery', 'preview', 'video', 'music', 'background', 'avatar'))
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS media_asset_links_target_idx ON media_asset_links(target_type, target_id, role, sort_order);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS media_asset_links_media_asset_id_idx ON media_asset_links(media_asset_id);`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS media_asset_links_target_role_uidx
    ON media_asset_links(media_asset_id, target_type, target_id, role);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_collections (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_collection_items (
      collection_id TEXT NOT NULL REFERENCES media_collections(id) ON DELETE CASCADE,
      media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection_id, media_asset_id)
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS media_collections_target_idx ON media_collections(target_type, target_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS media_collection_items_collection_sort_idx ON media_collection_items(collection_id, sort_order);`);

  await pool.query(`
    ALTER TABLE wedding_sites
    ADD COLUMN IF NOT EXISTS project_status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS event_date DATE,
    ADD COLUMN IF NOT EXISTS guest_target INT NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    ALTER TABLE wedding_sites DROP CONSTRAINT IF EXISTS wedding_sites_project_status_check;
    ALTER TABLE wedding_sites
    ADD CONSTRAINT wedding_sites_project_status_check
    CHECK (project_status IN ('draft', 'active', 'completed', 'archived'));
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF to_regclass(format('%I.%I', current_schema(), 'pages')) IS NULL
         AND to_regclass(format('%I.%I', current_schema(), 'wedding_site_pages')) IS NOT NULL THEN
        ALTER TABLE wedding_site_pages RENAME TO pages;
      END IF;

      IF to_regclass(format('%I.%I', current_schema(), 'page_sections')) IS NULL
         AND to_regclass(format('%I.%I', current_schema(), 'wedding_site_sections')) IS NOT NULL THEN
        ALTER TABLE wedding_site_sections RENAME TO page_sections;
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      owner_type TEXT NOT NULL DEFAULT 'wedding_site',
      owner_id TEXT NOT NULL,
      page_type TEXT NOT NULL DEFAULT 'website',
      slug TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (owner_type, owner_id, slug)
    );
  `);

  await pool.query(`
    ALTER TABLE pages
    ADD COLUMN IF NOT EXISTS owner_type TEXT NOT NULL DEFAULT 'wedding_site',
    ADD COLUMN IF NOT EXISTS owner_id TEXT,
    ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'website',
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'pages'
          AND column_name = 'wedding_site_id'
      ) THEN
        EXECUTE '
          UPDATE pages
          SET
            owner_type = COALESCE(NULLIF(owner_type, ''''), ''wedding_site''),
            owner_id = COALESCE(owner_id, wedding_site_id::text),
            page_type = COALESCE(NULLIF(page_type, ''''), ''website'')
          WHERE owner_id IS NULL
        ';
      END IF;
    END $$;
  `);

  await pool.query(`
    ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_owner_type_check;
    ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_page_type_check;
    ALTER TABLE pages
    ADD CONSTRAINT pages_owner_type_check
    CHECK (owner_type IN ('wedding_site', 'provider', 'offering', 'landing'));
    ALTER TABLE pages
    ADD CONSTRAINT pages_page_type_check
    CHECK (page_type IN ('website', 'landing', 'seo', 'campaign', 'vendor'));
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS pages_owner_slug_uidx
    ON pages(owner_type, owner_id, slug);
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS pages_owner_type_idx ON pages(owner_type, owner_id, page_type, status);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS page_sections (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      page_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
      section_type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      visibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
      display_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
      ab_variant_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE page_sections
    ADD COLUMN IF NOT EXISTS page_id TEXT,
    ADD COLUMN IF NOT EXISTS section_type TEXT NOT NULL DEFAULT 'custom',
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS visibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS display_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ab_variant_key TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    INSERT INTO pages (owner_type, owner_id, page_type, slug, title, sort_order, status, settings)
    SELECT 'wedding_site', wedding_sites.id, 'website', 'home', wedding_sites.title, 0, wedding_sites.status, '{}'::jsonb
    FROM wedding_sites
    WHERE NOT EXISTS (
      SELECT 1
      FROM pages
      WHERE owner_type = 'wedding_site'
        AND owner_id = wedding_sites.id
        AND slug = 'home'
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'page_sections'
          AND column_name = 'wedding_site_id'
      ) THEN
        EXECUTE '
          UPDATE page_sections section
          SET page_id = page.id
          FROM pages page
          WHERE section.page_id IS NULL
            AND page.owner_type = ''wedding_site''
            AND page.slug = ''home''
            AND page.owner_id = section.wedding_site_id::text
        ';
      END IF;
    END $$;
  `);

  await pool.query(`
    ALTER TABLE pages DROP COLUMN IF EXISTS wedding_site_id;
    ALTER TABLE pages ALTER COLUMN owner_id SET NOT NULL;
    ALTER TABLE pages ALTER COLUMN slug SET NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE page_sections DROP COLUMN IF EXISTS wedding_site_id;
    ALTER TABLE page_sections ALTER COLUMN page_id SET NOT NULL;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'page_sections'::regclass
          AND conname = 'page_sections_page_id_fkey'
      ) THEN
        ALTER TABLE page_sections
        ADD CONSTRAINT page_sections_page_id_fkey
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS page_sections_page_sort_idx ON page_sections(page_id, sort_order, created_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS page_sections_ab_variant_key_idx ON page_sections(ab_variant_key);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_site_guests (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      group_name TEXT NOT NULL DEFAULT '',
      invite_code TEXT,
      status TEXT NOT NULL DEFAULT 'invited',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (wedding_site_id, invite_code)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guest_groups (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS guest_groups_site_sort_idx ON guest_groups(wedding_site_id, sort_order);`);

  await pool.query(`
    ALTER TABLE wedding_site_guests
    ADD COLUMN IF NOT EXISTS guest_group_id TEXT REFERENCES guest_groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_site_rsvps (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      guest_id TEXT REFERENCES wedding_site_guests(id) ON DELETE SET NULL,
      attendee_name TEXT NOT NULL DEFAULT '',
      attendee_count INT NOT NULL DEFAULT 1,
      response_status TEXT NOT NULL DEFAULT 'pending',
      message TEXT NOT NULL DEFAULT '',
      responded_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wedding_site_rsvps_status_check CHECK (response_status IN ('pending', 'accepted', 'declined', 'maybe'))
    );
  `);

  await pool.query(`
    ALTER TABLE wedding_site_rsvps
    ADD COLUMN IF NOT EXISTS attendee_count INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS meal_choice TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS special_requests TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_tables (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      capacity INT NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_table_guests (
      table_id TEXT NOT NULL REFERENCES wedding_tables(id) ON DELETE CASCADE,
      guest_id TEXT NOT NULL REFERENCES wedding_site_guests(id) ON DELETE CASCADE,
      seat_number TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (table_id, guest_id)
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS wedding_tables_site_sort_idx ON wedding_tables(wedding_site_id, sort_order);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS wedding_table_guests_guest_idx ON wedding_table_guests(guest_id);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_tasks (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'normal',
      due_date DATE,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wedding_tasks_category_check CHECK (category IN ('venue', 'photo', 'video', 'makeup', 'planner', 'decoration', 'transportation', 'legal', 'gift', 'other')),
      CONSTRAINT wedding_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS wedding_tasks_site_status_due_idx ON wedding_tasks(wedding_site_id, status, due_date);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_timeline_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      timeline_type TEXT NOT NULL DEFAULT 'custom',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wedding_timeline_items_type_check CHECK (timeline_type IN ('preparation', 'ceremony', 'reception', 'custom'))
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS wedding_timeline_items_site_starts_idx ON wedding_timeline_items(wedding_site_id, starts_at);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_site_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      venue_name TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_site_galleries (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      wedding_site_id ${weddingSiteIdType} NOT NULL REFERENCES wedding_sites(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO page_sections (
      page_id, section_type, title, sort_order, content, settings
    )
    SELECT
      pages.id,
      'template_data',
      'Template data',
      0,
      wedding_sites.custom_data,
      '{}'::jsonb
    FROM wedding_sites
    INNER JOIN pages
      ON pages.owner_type = 'wedding_site'
     AND pages.owner_id = wedding_sites.id
     AND pages.slug = 'home'
    WHERE wedding_sites.custom_data <> '{}'::jsonb
      AND NOT EXISTS (
        SELECT 1
        FROM page_sections section
        WHERE section.page_id = pages.id
          AND section.section_type = 'template_data'
      );
  `);

  await pool.query(`
    UPDATE wedding_sites
    SET custom_data = '{}'::jsonb
    WHERE custom_data <> '{}'::jsonb;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      organization_type TEXT NOT NULL DEFAULT 'studio',
      owner_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT organizations_type_check CHECK (organization_type IN ('studio', 'agency', 'provider_group', 'creator_group', 'wedding_team'))
    );
  `);

  await pool.query(`ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_type_check;`);
  await pool.query(`
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_type_check
    CHECK (organization_type IN ('studio', 'agency', 'provider_group', 'creator_group', 'wedding_team'));
  `);

  await pool.query(`
    ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS owner_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS organization_roles (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (organization_id, key)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT REFERENCES organization_roles(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (organization_id, user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      owner_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      provider_type TEXT NOT NULL DEFAULT 'supplier',
      status TEXT NOT NULL DEFAULT 'draft',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT providers_type_check CHECK (provider_type IN ('supplier', 'creator', 'studio', 'planner', 'makeup', 'photographer', 'florist', 'videographer'))
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'providers' AND column_name = 'user_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'providers' AND column_name = 'owner_user_id'
      ) THEN
        ALTER TABLE providers RENAME COLUMN user_id TO owner_user_id;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'providers' AND column_name = 'user_id'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'providers' AND column_name = 'owner_user_id'
      ) THEN
        UPDATE providers SET owner_user_id = COALESCE(owner_user_id, user_id);
        ALTER TABLE providers DROP COLUMN user_id;
      END IF;
    END $$;
  `);
  await pool.query(`ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_user_id_fkey;`);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'providers'::regclass
          AND conname = 'providers_owner_user_id_fkey'
      ) THEN
        ALTER TABLE providers
        ADD CONSTRAINT providers_owner_user_id_fkey
        FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
        NOT VALID;
      END IF;
    END $$;
  `);

  await pool.query(`ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_type_check;`);
  await pool.query(`ALTER TABLE providers ALTER COLUMN provider_type SET DEFAULT 'supplier';`);
  await pool.query(`
    ALTER TABLE providers
    ADD CONSTRAINT providers_type_check
    CHECK (provider_type IN ('supplier', 'creator', 'studio', 'planner', 'makeup', 'photographer', 'florist', 'videographer'));
  `);

  await pool.query(`
    INSERT INTO providers (owner_user_id, slug, display_name, provider_type, status)
    SELECT
      users.id,
      COALESCE(NULLIF(user_profiles.provider_portal_slug, ''), 'provider-' || users.id::text),
      COALESCE(NULLIF(user_profiles.store_name, ''), NULLIF(user_profiles.business_name, ''), NULLIF(user_profiles.display_name, ''), users.username),
      'supplier',
      'published'
    FROM users
    LEFT JOIN user_profiles ON user_profiles.user_id = users.id
    WHERE users.role = 'PROVIDER'
    ON CONFLICT (slug) DO UPDATE
    SET owner_user_id = EXCLUDED.owner_user_id,
        display_name = EXCLUDED.display_name,
        provider_type = EXCLUDED.provider_type,
        updated_at = NOW();
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_profiles (
      provider_id TEXT PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_services (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      region_type TEXT NOT NULL DEFAULT 'city',
      parent_id TEXT REFERENCES regions(id) ON DELETE SET NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_regions (
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      service_mode TEXT NOT NULL DEFAULT 'available',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (provider_id, region_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipping_regions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      base_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_regions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      offering_id TEXT NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      availability_status TEXT NOT NULL DEFAULT 'available',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (offering_id, region_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_reviews (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      rating INT NOT NULL DEFAULT 5,
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_pricing (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      offering_id TEXT REFERENCES offerings(id) ON DELETE CASCADE,
      price_type TEXT NOT NULL DEFAULT 'base',
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'VND',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_leads (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      budget NUMERIC(12,2) NOT NULL DEFAULT 0,
      event_date DATE,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_leads_status_check CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost', 'closed'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_quotes (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      lead_id TEXT NOT NULL REFERENCES vendor_leads(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_quotes_status_check CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired'))
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS vendor_leads_provider_status_idx ON vendor_leads(provider_id, status, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS vendor_leads_user_created_idx ON vendor_leads(user_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS vendor_quotes_lead_status_idx ON vendor_quotes(lead_id, status, created_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_search_documents (
      provider_id TEXT PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
      search_text TEXT NOT NULL DEFAULT '',
      filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_search_documents_search_vector_idx
    ON provider_search_documents USING GIN (search_vector);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_search_documents_filter_json_idx
    ON provider_search_documents USING GIN (filter_json);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_fulfillments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      fulfillment_type TEXT NOT NULL DEFAULT 'service',
      lead_time_days INT NOT NULL DEFAULT 0,
      capacity INT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      booking_number TEXT NOT NULL UNIQUE,
      user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      scheduled_at TIMESTAMPTZ,
      total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      provider_type TEXT,
      provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT booking_items_provider_type_check CHECK (provider_type IS NULL OR provider_type IN ('supplier', 'creator', 'studio', 'planner', 'makeup', 'photographer', 'florist', 'videographer'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_status_logs (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      actor_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_payments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT '',
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_calendars (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
      status TEXT NOT NULL DEFAULT 'active',
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider_id, key)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_availability (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      calendar_id TEXT REFERENCES booking_calendars(id) ON DELETE CASCADE,
      provider_service_id TEXT REFERENCES provider_services(id) ON DELETE SET NULL,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      availability_kind TEXT NOT NULL DEFAULT 'general',
      day_of_week INT,
      starts_at TIME,
      ends_at TIME,
      valid_from DATE,
      valid_until DATE,
      duration_minutes INT NOT NULL DEFAULT 0,
      buffer_before_minutes INT NOT NULL DEFAULT 0,
      buffer_after_minutes INT NOT NULL DEFAULT 0,
      capacity INT NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'available',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_availability_day_check CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6),
      CONSTRAINT provider_availability_status_check CHECK (status IN ('available', 'unavailable', 'blocked'))
    );
  `);

  await pool.query(`
    ALTER TABLE provider_availability
    ADD COLUMN IF NOT EXISTS provider_service_id TEXT,
    ADD COLUMN IF NOT EXISTS offering_id TEXT,
    ADD COLUMN IF NOT EXISTS availability_kind TEXT NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS buffer_before_minutes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS buffer_after_minutes INT NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'provider_availability'::regclass
          AND conname = 'provider_availability_provider_service_id_fkey'
      ) THEN
        ALTER TABLE provider_availability
        ADD CONSTRAINT provider_availability_provider_service_id_fkey
        FOREIGN KEY (provider_service_id) REFERENCES provider_services(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'provider_availability'::regclass
          AND conname = 'provider_availability_offering_id_fkey'
      ) THEN
        ALTER TABLE provider_availability
        ADD CONSTRAINT provider_availability_offering_id_fkey
        FOREIGN KEY (offering_id) REFERENCES offerings(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS provider_availability_lookup_idx ON provider_availability(provider_id, offering_id, day_of_week, starts_at, status);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_time_slots (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      calendar_id TEXT REFERENCES booking_calendars(id) ON DELETE CASCADE,
      availability_id TEXT REFERENCES provider_availability(id) ON DELETE SET NULL,
      provider_service_id TEXT REFERENCES provider_services(id) ON DELETE SET NULL,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      availability_kind TEXT NOT NULL DEFAULT 'general',
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      capacity INT NOT NULL DEFAULT 1,
      booked_count INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_time_slots_status_check CHECK (status IN ('available', 'held', 'booked', 'blocked'))
    );
  `);

  await pool.query(`
    ALTER TABLE provider_time_slots
    ADD COLUMN IF NOT EXISTS availability_id TEXT,
    ADD COLUMN IF NOT EXISTS provider_service_id TEXT,
    ADD COLUMN IF NOT EXISTS availability_kind TEXT NOT NULL DEFAULT 'general';
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'provider_time_slots'::regclass
          AND conname = 'provider_time_slots_availability_id_fkey'
      ) THEN
        ALTER TABLE provider_time_slots
        ADD CONSTRAINT provider_time_slots_availability_id_fkey
        FOREIGN KEY (availability_id) REFERENCES provider_availability(id) ON DELETE SET NULL;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'provider_time_slots'::regclass
          AND conname = 'provider_time_slots_provider_service_id_fkey'
      ) THEN
        ALTER TABLE provider_time_slots
        ADD CONSTRAINT provider_time_slots_provider_service_id_fkey
        FOREIGN KEY (provider_service_id) REFERENCES provider_services(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS provider_time_slots_lookup_idx ON provider_time_slots(provider_id, starts_at, status);`);

  await pool.query(`
    INSERT INTO provider_services (
      provider_id, offering_id, title, status, base_price, metadata
    )
    SELECT
      physical.provider_id,
      offering.id,
      offering.name,
      CASE WHEN offering.status IN ('archived', 'disabled') THEN 'paused' ELSE 'active' END,
      offering.price,
      jsonb_build_object(
        'source', 'physical_offering_backfill',
        'fulfillment_type', COALESCE(physical.fulfillment_type, offering.fulfillment_type),
        'provider_type', physical.provider_type
      )
    FROM physical_offerings physical
    INNER JOIN offerings offering ON offering.id = physical.offering_id
    WHERE physical.provider_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM provider_services service
        WHERE service.provider_id = physical.provider_id
          AND service.offering_id = offering.id
      );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_bundles (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'VND',
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_bundles_status_check CHECK (status IN ('draft', 'published', 'archived'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_bundle_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      bundle_id TEXT NOT NULL REFERENCES offering_bundles(id) ON DELETE CASCADE,
      offering_id TEXT NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      quantity INT NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      pricing_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (bundle_id, offering_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_relationships (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      source_offering_id TEXT NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      target_offering_id TEXT NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_relationships_type_check CHECK (relationship_type IN ('cross_sell', 'upsell', 'related')),
      CONSTRAINT offering_relationships_not_self_check CHECK (source_offering_id <> target_offering_id),
      CONSTRAINT offering_relationships_unique UNIQUE (source_offering_id, target_offering_id, relationship_type)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS offering_relationships_source_idx ON offering_relationships(source_offering_id, relationship_type, sort_order);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS offering_relationships_target_idx ON offering_relationships(target_offering_id, relationship_type);`);
  await pool.query(`DELETE FROM offering_relationships WHERE source_offering_id = target_offering_id;`);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'offering_relationships_not_self_check'
      ) THEN
        ALTER TABLE offering_relationships
          ADD CONSTRAINT offering_relationships_not_self_check CHECK (source_offering_id <> target_offering_id);
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_search_documents (
      offering_id TEXT PRIMARY KEY REFERENCES offerings(id) ON DELETE CASCADE,
      search_text TEXT NOT NULL DEFAULT '',
      filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      embedding JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS offering_search_documents_filter_idx ON offering_search_documents USING GIN (filter_json);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS template_attributes (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      attribute_type TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT template_attributes_type_check CHECK (attribute_type IN ('style', 'theme', 'mood', 'culture', 'season', 'color', 'event_type'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS template_attribute_values (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      attribute_id TEXT NOT NULL REFERENCES template_attributes(id) ON DELETE CASCADE,
      offering_id TEXT NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      value_key TEXT NOT NULL,
      value_label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (attribute_id, offering_id, value_key)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tag_type TEXT NOT NULL DEFAULT 'general',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tag_relations (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tag_id, target_type, target_id)
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS tag_relations_target_idx ON tag_relations(target_type, target_id, sort_order);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS domain_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      event_name TEXT NOT NULL,
      aggregate_type TEXT NOT NULL,
      aggregate_id TEXT NOT NULL,
      actor_type TEXT,
      actor_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS domain_events_aggregate_idx ON domain_events(aggregate_type, aggregate_id, occurred_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS domain_events_name_idx ON domain_events(event_name, occurred_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_sessions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      visitor_token TEXT NOT NULL,
      user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      referrer TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_page_views (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      session_id TEXT REFERENCES analytics_sessions(id) ON DELETE SET NULL,
      path TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      target_type TEXT,
      target_id TEXT,
      viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      session_id TEXT REFERENCES analytics_sessions(id) ON DELETE SET NULL,
      page_view_id TEXT REFERENCES analytics_page_views(id) ON DELETE SET NULL,
      event_name TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events(event_name, occurred_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS analytics_page_views_target_idx ON analytics_page_views(target_type, target_id, viewed_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversion_goals (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      target_type TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversion_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      goal_id TEXT NOT NULL REFERENCES conversion_goals(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES analytics_sessions(id) ON DELETE SET NULL,
      user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO conversion_goals (key, label, target_type, is_active)
    VALUES
      ('rsvp_submitted', 'RSVP Submitted', 'wedding_site', TRUE),
      ('lead_created', 'Lead Created', 'provider', TRUE),
      ('booking_created', 'Booking Created', 'booking', TRUE),
      ('checkout_success', 'Checkout Success', 'commerce_order', TRUE),
      ('contact_vendor', 'Contact Vendor', 'provider', TRUE)
    ON CONFLICT (key) DO UPDATE
    SET label = EXCLUDED.label,
        target_type = EXCLUDED.target_type,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS conversion_events_goal_created_idx ON conversion_events(goal_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS conversion_events_target_idx ON conversion_events(target_type, target_id, created_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS conversion_events_user_created_idx ON conversion_events(user_id, created_at DESC);`);

}

async function ensureFinalArchitectureCleanupMigration() {
  const pool = getPool();

  const textUserColumns = [
    ["affiliate_accounts", "user_id", "CASCADE", true],
    ["affiliate_clicks", "affiliate_user_id", "CASCADE", true],
    ["affiliate_conversions", "affiliate_user_id", "CASCADE", true],
    ["chat_messages", "sender_user_id", "CASCADE", true],
    ["chat_conversations", "created_by_user_id", "SET NULL", false],
    ["chat_conversations", "owner_user_id", "SET NULL", false],
    ["chat_conversations", "requester_user_id", "SET NULL", false],
    ["content_comments", "author_user_id", "SET NULL", false],
    ["content_comments", "approved_by", "SET NULL", false],
    ["provider_order_assignments", "provider_user_id", "CASCADE", true],
    ["provider_order_events", "actor_user_id", "SET NULL", false],
    ["provider_offering_submissions", "provider_user_id", "CASCADE", true],
    ["provider_offering_submission_events", "actor_user_id", "SET NULL", false],
    ["offering_provider_suppliers", "provider_user_id", "CASCADE", true],
    ["offering_provider_suppliers", "approved_by", "SET NULL", false],
    ["provider_offering_supplier_requests", "provider_user_id", "CASCADE", true],
    ["provider_offering_supplier_requests", "reviewed_by", "SET NULL", false],
  ] as const;

  for (const [tableName, columnName, onDelete, notNull] of textUserColumns) {
    await ensureTextForeignKeyColumn({
      tableName,
      columnName,
      referenceTable: columnName === "affiliate_user_id" ? "affiliate_accounts" : "users",
      referenceColumn: columnName === "affiliate_user_id" ? "user_id" : "id",
      onDelete,
      notNull,
    });
  }

  await ensureAppSettingsTextId();
  await ensureTextForeignKeyColumn({
    tableName: "navigation_menu_items",
    columnName: "menu_id",
    referenceTable: "navigation_menus",
    onDelete: "CASCADE",
    notNull: true,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_types (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_system BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO provider_types (key, label, sort_order)
    VALUES
      ('supplier', 'Supplier', 10),
      ('creator', 'Creator', 20),
      ('studio', 'Studio', 30),
      ('planner', 'Planner', 40),
      ('photographer', 'Photographer', 50),
      ('makeup', 'Makeup', 60),
      ('florist', 'Florist', 70),
      ('videographer', 'Videographer', 80)
    ON CONFLICT (key) DO UPDATE
    SET label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order,
        is_system = TRUE,
        updated_at = NOW();
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS template_engines (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_system BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO template_engines (key, label, sort_order)
    VALUES
      ('coded', 'Coded', 10),
      ('builder', 'Builder', 20),
      ('hybrid', 'Hybrid', 30),
      ('motion', 'Motion', 40),
      ('video', 'Video', 50),
      ('ai_generated', 'AI Generated', 60)
    ON CONFLICT (key) DO UPDATE
    SET label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order,
        is_system = TRUE,
        updated_at = NOW();
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_statuses (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_system BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO offering_statuses (key, label, sort_order)
    VALUES
      ('draft', 'Draft', 10),
      ('pending_review', 'Pending Review', 20),
      ('published', 'Published', 30),
      ('archived', 'Archived', 40),
      ('disabled', 'Disabled', 50)
    ON CONFLICT (key) DO UPDATE
    SET label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order,
        is_system = TRUE,
        updated_at = NOW();
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS domain_event_types (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'business',
      is_cache_invalidation BOOLEAN NOT NULL DEFAULT FALSE,
      is_system BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    INSERT INTO domain_event_types (key, label, category, is_cache_invalidation)
    VALUES
      ('offering.created', 'Offering created', 'offering', FALSE),
      ('offering.updated', 'Offering updated', 'offering', TRUE),
      ('template.updated', 'Template updated', 'template', TRUE),
      ('provider.updated', 'Provider updated', 'provider', TRUE),
      ('site.published', 'Site published', 'wedding_site', TRUE),
      ('offering.search.sync', 'Offering search sync', 'search', FALSE),
      ('template.search.sync', 'Template search sync', 'search', FALSE),
      ('provider.search.sync', 'Provider search sync', 'search', FALSE),
      ('booking.confirmed', 'Booking confirmed', 'booking', FALSE),
      ('payment.completed', 'Payment completed', 'payment', FALSE),
      ('rsvp.updated', 'RSVP updated', 'wedding_site', TRUE)
    ON CONFLICT (key) DO UPDATE
    SET label = EXCLUDED.label,
        category = EXCLUDED.category,
        is_cache_invalidation = EXCLUDED.is_cache_invalidation,
        is_system = TRUE,
        updated_at = NOW();
  `);

  await pool.query(`ALTER TABLE providers DROP CONSTRAINT IF EXISTS providers_type_check;`);
  await pool.query(`
    ALTER TABLE providers
    ADD CONSTRAINT providers_type_check
    CHECK (provider_type IN ('supplier', 'creator', 'studio', 'planner', 'makeup', 'photographer', 'florist', 'videographer'));
  `);
  await pool.query(`ALTER TABLE booking_items DROP CONSTRAINT IF EXISTS booking_items_provider_type_check;`);
  await pool.query(`
    ALTER TABLE booking_items
    ADD CONSTRAINT booking_items_provider_type_check
    CHECK (provider_type IS NULL OR provider_type IN ('supplier', 'creator', 'studio', 'planner', 'makeup', 'photographer', 'florist', 'videographer'));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_target_types (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_system BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);
  await pool.query(`
    INSERT INTO media_target_types (key, label, sort_order)
    VALUES
      ('offering', 'Offering', 10),
      ('provider', 'Provider', 20),
      ('wedding_site', 'Wedding Site', 30),
      ('gallery', 'Gallery', 40),
      ('booking', 'Booking', 50),
      ('organization', 'Organization', 60),
      ('template', 'Template', 70)
    ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_roles (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_system BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);
  await pool.query(`
    INSERT INTO media_roles (key, label, sort_order)
    VALUES
      ('thumbnail', 'Thumbnail', 10),
      ('hero', 'Hero', 20),
      ('gallery', 'Gallery', 30),
      ('preview', 'Preview', 40),
      ('avatar', 'Avatar', 50),
      ('video', 'Video', 60),
      ('music', 'Music', 70),
      ('background', 'Background', 80)
    ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;
  `);
  await pool.query(`ALTER TABLE media_asset_links DROP CONSTRAINT IF EXISTS media_asset_links_target_type_check;`);
  await pool.query(`
    ALTER TABLE media_asset_links
    ADD CONSTRAINT media_asset_links_target_type_check
    CHECK (target_type IN ('offering', 'provider', 'wedding_site', 'gallery', 'booking', 'organization', 'template'));
  `);
  await pool.query(`ALTER TABLE media_asset_links DROP CONSTRAINT IF EXISTS media_asset_links_role_check;`);
  await pool.query(`
    ALTER TABLE media_asset_links
    ADD CONSTRAINT media_asset_links_role_check
    CHECK (role IN ('thumbnail', 'hero', 'gallery', 'preview', 'avatar', 'video', 'music', 'background'));
  `);

  await pool.query(`ALTER TABLE offerings DROP CONSTRAINT IF EXISTS offerings_status_check;`);
  await pool.query(`
    ALTER TABLE offerings
    ADD CONSTRAINT offerings_status_check
    CHECK (status IN ('draft', 'pending_review', 'published', 'archived', 'disabled'));
  `);
  await pool.query(`ALTER TABLE offerings DROP CONSTRAINT IF EXISTS offerings_config_boundary_check;`);
  await pool.query(`ALTER TABLE offerings DROP CONSTRAINT IF EXISTS offerings_config_size_check;`);
  await pool.query(`
    UPDATE offerings
    SET config = config - 'inventory' - 'pricing_rules' - 'permissions' - 'analytics' - 'booking_logic' - 'relational_data' - 'siteDefaults' - 'generalOffering'
    WHERE config ?| ARRAY['inventory', 'pricing_rules', 'permissions', 'analytics', 'booking_logic', 'relational_data', 'siteDefaults', 'generalOffering'];
  `);
  await pool.query(`
    ALTER TABLE offerings
    ADD CONSTRAINT offerings_config_boundary_check
    CHECK (NOT (config ?| ARRAY['inventory', 'pricing_rules', 'permissions', 'analytics', 'booking_logic', 'relational_data', 'siteDefaults', 'generalOffering']));
  `);
  await pool.query(`
    ALTER TABLE offerings
    ADD CONSTRAINT offerings_config_size_check
    CHECK (pg_column_size(config) <= 32768);
  `);

  await pool.query(`
    INSERT INTO physical_offerings (
      offering_id,
      fulfillment_type,
      track_inventory,
      stock_quantity,
      low_stock_threshold,
      allow_backorder,
      cost_price,
      provider_sku,
      allow_provider_supply,
      provider_type,
      provider_id
    )
    SELECT
      physical_product_offerings.offering_id,
      COALESCE(NULLIF(offerings.fulfillment_type, ''), 'physical'),
      physical_product_offerings.track_inventory,
      physical_product_offerings.stock_quantity,
      physical_product_offerings.low_stock_threshold,
      physical_product_offerings.allow_backorder,
      physical_product_offerings.cost_price,
      physical_product_offerings.sku,
      FALSE,
      NULL,
      NULL
    FROM physical_product_offerings
    INNER JOIN offerings ON offerings.id = physical_product_offerings.offering_id
    ON CONFLICT (offering_id) DO UPDATE
    SET
      fulfillment_type = EXCLUDED.fulfillment_type,
      track_inventory = EXCLUDED.track_inventory,
      stock_quantity = EXCLUDED.stock_quantity,
      low_stock_threshold = EXCLUDED.low_stock_threshold,
      allow_backorder = EXCLUDED.allow_backorder,
      cost_price = EXCLUDED.cost_price,
      provider_sku = EXCLUDED.provider_sku,
      updated_at = NOW();
  `).catch((error) => {
    if (error instanceof Error && /physical_product_offerings/.test(error.message)) {
      return;
    }
    throw error;
  });

  await pool.query(`
    ALTER TABLE physical_offerings
    ADD COLUMN IF NOT EXISTS provider_type TEXT,
    ADD COLUMN IF NOT EXISTS provider_id TEXT;
  `);
  await pool.query(`ALTER TABLE physical_offerings DROP CONSTRAINT IF EXISTS physical_offerings_owner_type_check;`);
  await pool.query(`ALTER TABLE physical_offerings DROP COLUMN IF EXISTS owner_type;`);
  await pool.query(`DROP TABLE IF EXISTS physical_product_offerings;`);
  await pool.query(`CREATE INDEX IF NOT EXISTS physical_offerings_provider_id_idx ON physical_offerings(provider_id);`);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'physical_offerings'::regclass
          AND conname = 'physical_offerings_provider_id_fkey'
      ) THEN
        ALTER TABLE physical_offerings
        ADD CONSTRAINT physical_offerings_provider_id_fkey
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
        NOT VALID;
      END IF;
    END $$;
  `);
  await pool.query(`
    ALTER TABLE creator_service_offerings
    ADD COLUMN IF NOT EXISTS provider_id TEXT,
    ADD COLUMN IF NOT EXISTS provider_type TEXT;
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS creator_service_offerings_provider_id_idx ON creator_service_offerings(provider_id);`);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'creator_service_offerings'::regclass
          AND conname = 'creator_service_offerings_provider_id_fkey'
      ) THEN
        ALTER TABLE creator_service_offerings
        ADD CONSTRAINT creator_service_offerings_provider_id_fkey
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
        NOT VALID;
      END IF;
    END $$;
  `);
  await pool.query(`
    ALTER TABLE offering_bundles
    ADD COLUMN IF NOT EXISTS pricing_strategy TEXT NOT NULL DEFAULT 'fixed',
    ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) NOT NULL DEFAULT 0;
  `);
  await pool.query(`ALTER TABLE offering_bundles DROP CONSTRAINT IF EXISTS offering_bundles_pricing_strategy_check;`);
  await pool.query(`ALTER TABLE offering_bundles DROP CONSTRAINT IF EXISTS offering_bundles_discount_type_check;`);
  await pool.query(`
    ALTER TABLE offering_bundles
    ADD CONSTRAINT offering_bundles_pricing_strategy_check CHECK (pricing_strategy IN ('fixed', 'sum_items', 'discounted_sum'));
  `);
  await pool.query(`
    ALTER TABLE offering_bundles
    ADD CONSTRAINT offering_bundles_discount_type_check CHECK (discount_type IN ('none', 'percentage', 'fixed_amount'));
  `);

  await pool.query(`
    ALTER TABLE offering_search_documents
    ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS offering_search_documents_search_vector_idx
    ON offering_search_documents USING GIN (search_vector);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS field_change_logs (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      field_key TEXT NOT NULL,
      old_value JSONB,
      new_value JSONB,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS field_change_logs_target_idx ON field_change_logs(target_type, target_id, created_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS seo_redirects (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      source_path TEXT NOT NULL UNIQUE,
      target_path TEXT NOT NULL,
      status_code INT NOT NULL DEFAULT 301,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT seo_redirects_status_code_check CHECK (status_code IN (301, 302, 307, 308))
    );
  `);
  await pool.query(`
    INSERT INTO seo_redirects (id, source_path, target_path, status_code, is_active, metadata)
    SELECT
      COALESCE(NULLIF(BTRIM(rule->>'id'), ''), app_random_id()),
      rule->>'sourcePath',
      rule->>'targetPath',
      CASE WHEN rule->>'statusCode' = '302' THEN 302 ELSE 301 END,
      CASE WHEN jsonb_typeof(rule->'enabled') = 'boolean' THEN (rule->>'enabled')::boolean ELSE TRUE END,
      jsonb_build_object('label', COALESCE(rule->>'label', ''))
    FROM app_settings
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(seo_redirects->'rules', '[]'::jsonb)) AS rule
    WHERE id = 'system'
      AND NULLIF(BTRIM(rule->>'sourcePath'), '') IS NOT NULL
      AND NULLIF(BTRIM(rule->>'targetPath'), '') IS NOT NULL
    ON CONFLICT (source_path) DO UPDATE
    SET target_path = EXCLUDED.target_path,
        status_code = EXCLUDED.status_code,
        is_active = EXCLUDED.is_active,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
  `);
}

async function ensureProviderOrdersMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_order_assignments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id) ON DELETE CASCADE,
      provider_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending_confirmation',
      internal_note TEXT NOT NULL DEFAULT '',
      provider_note TEXT NOT NULL DEFAULT '',
      provider_reference TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      accepted_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_order_assignments_status_check
      CHECK (status IN ('pending_confirmation', 'accepted', 'in_progress', 'ready_for_review', 'completed', 'cancelled'))
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_order_assignments' AND column_name = 'provider_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_order_assignments' AND column_name = 'provider_user_id'
      ) THEN
        ALTER TABLE provider_order_assignments RENAME COLUMN provider_id TO provider_user_id;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_order_assignments' AND column_name = 'provider_id'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_order_assignments' AND column_name = 'provider_user_id'
      ) THEN
        UPDATE provider_order_assignments SET provider_user_id = COALESCE(provider_user_id, provider_id);
        ALTER TABLE provider_order_assignments DROP COLUMN provider_id;
      END IF;
    END $$;
  `);
  await pool.query(`DROP INDEX IF EXISTS provider_order_assignments_provider_id_idx;`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_order_assignments_provider_user_id_idx
    ON provider_order_assignments(provider_user_id, status, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_order_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      assignment_id TEXT NOT NULL REFERENCES provider_order_assignments(id) ON DELETE CASCADE,
      actor_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      actor_type TEXT NOT NULL DEFAULT 'system',
      event_type TEXT NOT NULL DEFAULT 'note_added',
      message TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_order_events_actor_type_check
      CHECK (actor_type IN ('admin', 'provider', 'system')),
      CONSTRAINT provider_order_events_event_type_check
      CHECK (event_type IN ('assignment_created', 'assignment_reassigned', 'status_changed', 'note_added'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_order_events_assignment_id_idx
    ON provider_order_events(assignment_id, created_at DESC);
  `);
}

async function ensureProviderOfferingSubmissionsMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id");
  const offeringIdType = await getColumnTypeSql("offerings", "id");
  const categoryIdType = await getColumnTypeSql("offering_categories", "id");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_offering_submissions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      linked_offering_id ${offeringIdType} REFERENCES offerings(id) ON DELETE SET NULL,
      category_id ${categoryIdType} REFERENCES offering_categories(id) ON DELETE SET NULL,
      submission_type TEXT NOT NULL DEFAULT 'create',
      review_status TEXT NOT NULL DEFAULT 'draft',
      name TEXT NOT NULL DEFAULT '',
      slug_candidate TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      fulfillment_type TEXT NOT NULL DEFAULT 'service',
      service_kind TEXT NOT NULL DEFAULT 'general',
      duration_minutes INT NOT NULL DEFAULT 0,
      service_area TEXT NOT NULL DEFAULT '',
      purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      proposed_stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 0,
      allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
      provider_sku TEXT NOT NULL DEFAULT '',
      provider_note TEXT NOT NULL DEFAULT '',
      admin_sell_price NUMERIC(12,2),
      review_note TEXT NOT NULL DEFAULT '',
      submitted_at TIMESTAMPTZ,
      reviewed_at TIMESTAMPTZ,
      reviewed_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_offering_submissions_submission_type_check
      CHECK (submission_type IN ('create', 'update', 'discontinue')),
      CONSTRAINT provider_offering_submissions_review_status_check
      CHECK (review_status IN ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'archived')),
      CONSTRAINT provider_offering_submissions_fulfillment_type_check
      CHECK (fulfillment_type IN ('digital', 'physical', 'service')),
      CONSTRAINT provider_offering_submissions_purchase_cost_check
      CHECK (purchase_cost >= 0),
      CONSTRAINT provider_offering_submissions_admin_sell_price_check
      CHECK (admin_sell_price IS NULL OR admin_sell_price >= 0),
      CONSTRAINT provider_offering_submissions_stock_quantity_check
      CHECK (proposed_stock_quantity >= 0 OR allow_backorder = TRUE),
      CONSTRAINT provider_offering_submissions_low_stock_threshold_check
      CHECK (low_stock_threshold >= 0)
    );
  `);

  await pool.query(`
    ALTER TABLE provider_offering_submissions
    ADD COLUMN IF NOT EXISTS service_kind TEXT NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS service_area TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE provider_offering_submissions
    ALTER COLUMN fulfillment_type SET DEFAULT 'service';
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_submissions' AND column_name = 'provider_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_submissions' AND column_name = 'provider_user_id'
      ) THEN
        ALTER TABLE provider_offering_submissions RENAME COLUMN provider_id TO provider_user_id;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_submissions' AND column_name = 'provider_id'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_submissions' AND column_name = 'provider_user_id'
      ) THEN
        UPDATE provider_offering_submissions SET provider_user_id = COALESCE(provider_user_id, provider_id);
        ALTER TABLE provider_offering_submissions DROP COLUMN provider_id;
      END IF;
    END $$;
  `);
  await pool.query(`DROP INDEX IF EXISTS provider_offering_submissions_provider_id_idx;`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_offering_submissions_provider_user_id_idx
    ON provider_offering_submissions(provider_user_id, review_status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_offering_submissions_review_status_idx
    ON provider_offering_submissions(review_status, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_offering_submission_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      submission_id TEXT NOT NULL REFERENCES provider_offering_submissions(id) ON DELETE CASCADE,
      actor_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      actor_type TEXT NOT NULL DEFAULT 'system',
      event_type TEXT NOT NULL DEFAULT 'note_added',
      message TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_offering_submission_events_actor_type_check
      CHECK (actor_type IN ('admin', 'provider', 'system')),
      CONSTRAINT provider_offering_submission_events_event_type_check
      CHECK (event_type IN ('created', 'submitted', 'review_started', 'changes_requested', 'approved', 'rejected', 'updated', 'archived', 'note_added'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_offering_submission_events_submission_id_idx
    ON provider_offering_submission_events(submission_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offering_provider_suppliers (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      offering_id ${offeringIdType} NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      provider_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active',
      source TEXT NOT NULL DEFAULT 'admin',
      purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      provider_sku TEXT NOT NULL DEFAULT '',
      lead_time_days INT NOT NULL DEFAULT 0,
      monthly_capacity INT NOT NULL DEFAULT 0,
      service_area TEXT NOT NULL DEFAULT '',
      quality_note TEXT NOT NULL DEFAULT '',
      approved_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT offering_provider_suppliers_status_check CHECK (status IN ('active', 'paused', 'suspended', 'revoked')),
      CONSTRAINT offering_provider_suppliers_source_check CHECK (source IN ('admin', 'proposal', 'supplier_request')),
      CONSTRAINT offering_provider_suppliers_purchase_cost_check CHECK (purchase_cost >= 0),
      CONSTRAINT offering_provider_suppliers_lead_time_days_check CHECK (lead_time_days >= 0),
      CONSTRAINT offering_provider_suppliers_monthly_capacity_check CHECK (monthly_capacity >= 0),
      CONSTRAINT offering_provider_suppliers_offering_provider_user_unique UNIQUE (offering_id, provider_user_id)
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offering_provider_suppliers' AND column_name = 'provider_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offering_provider_suppliers' AND column_name = 'provider_user_id'
      ) THEN
        ALTER TABLE offering_provider_suppliers RENAME COLUMN provider_id TO provider_user_id;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offering_provider_suppliers' AND column_name = 'provider_id'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offering_provider_suppliers' AND column_name = 'provider_user_id'
      ) THEN
        UPDATE offering_provider_suppliers SET provider_user_id = COALESCE(provider_user_id, provider_id);
        ALTER TABLE offering_provider_suppliers DROP COLUMN provider_id;
      END IF;
    END $$;
  `);
  await pool.query(`ALTER TABLE offering_provider_suppliers DROP CONSTRAINT IF EXISTS offering_provider_suppliers_offering_provider_unique;`);
  await pool.query(`ALTER TABLE offering_provider_suppliers DROP CONSTRAINT IF EXISTS offering_provider_suppliers_offering_provider_user_unique;`);
  await pool.query(`
    ALTER TABLE offering_provider_suppliers
    ADD CONSTRAINT offering_provider_suppliers_offering_provider_user_unique UNIQUE (offering_id, provider_user_id);
  `);
  await pool.query(`DROP INDEX IF EXISTS offering_provider_suppliers_provider_id_idx;`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS offering_provider_suppliers_provider_user_id_idx
    ON offering_provider_suppliers(provider_user_id, status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS offering_provider_suppliers_offering_id_idx
    ON offering_provider_suppliers(offering_id, status, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_offering_supplier_requests (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      offering_id ${offeringIdType} NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
      provider_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      review_status TEXT NOT NULL DEFAULT 'submitted',
      purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      provider_sku TEXT NOT NULL DEFAULT '',
      lead_time_days INT NOT NULL DEFAULT 0,
      monthly_capacity INT NOT NULL DEFAULT 0,
      service_area TEXT NOT NULL DEFAULT '',
      sample_image_url TEXT NOT NULL DEFAULT '',
      material_note TEXT NOT NULL DEFAULT '',
      quality_note TEXT NOT NULL DEFAULT '',
      provider_note TEXT NOT NULL DEFAULT '',
      review_note TEXT NOT NULL DEFAULT '',
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_offering_supplier_requests_review_status_check CHECK (review_status IN ('submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'archived')),
      CONSTRAINT provider_offering_supplier_requests_purchase_cost_check CHECK (purchase_cost >= 0),
      CONSTRAINT provider_offering_supplier_requests_lead_time_days_check CHECK (lead_time_days >= 0),
      CONSTRAINT provider_offering_supplier_requests_monthly_capacity_check CHECK (monthly_capacity >= 0)
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_supplier_requests' AND column_name = 'provider_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_supplier_requests' AND column_name = 'provider_user_id'
      ) THEN
        ALTER TABLE provider_offering_supplier_requests RENAME COLUMN provider_id TO provider_user_id;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_supplier_requests' AND column_name = 'provider_id'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'provider_offering_supplier_requests' AND column_name = 'provider_user_id'
      ) THEN
        UPDATE provider_offering_supplier_requests SET provider_user_id = COALESCE(provider_user_id, provider_id);
        ALTER TABLE provider_offering_supplier_requests DROP COLUMN provider_id;
      END IF;
    END $$;
  `);
  await pool.query(`
    DROP INDEX IF EXISTS provider_offering_supplier_requests_open_uidx;
  `);
  await pool.query(`DROP INDEX IF EXISTS provider_offering_supplier_requests_active_uidx;`);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS provider_offering_supplier_requests_active_uidx
    ON provider_offering_supplier_requests(offering_id, provider_user_id)
    WHERE review_status IN ('submitted', 'under_review', 'changes_requested');
  `);

  await pool.query(`DROP INDEX IF EXISTS provider_offering_supplier_requests_provider_id_idx;`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_offering_supplier_requests_provider_user_id_idx
    ON provider_offering_supplier_requests(provider_user_id, review_status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_offering_supplier_requests_review_status_idx
    ON provider_offering_supplier_requests(review_status, updated_at DESC);
  `);
}

async function ensureProviderApplicationsMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_applications (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT,
      categories TEXT,
      website TEXT,
      experience TEXT,
      notes TEXT,
      review_status TEXT NOT NULL DEFAULT 'pending_review',
      review_note TEXT NOT NULL DEFAULT '',
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_applications_review_status_check
      CHECK (review_status IN ('pending_review', 'contacted', 'approved', 'rejected', 'archived'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_applications_review_status_idx
    ON provider_applications(review_status, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS provider_applications_email_idx
    ON provider_applications(lower(email));
  `);
}

async function ensureAffiliateApplicationsMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_applications (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      preferred_code TEXT,
      city TEXT,
      channel_link TEXT,
      audience_note TEXT,
      notes TEXT,
      review_status TEXT NOT NULL DEFAULT 'pending_review',
      review_note TEXT NOT NULL DEFAULT '',
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT affiliate_applications_review_status_check
      CHECK (review_status IN ('pending_review', 'contacted', 'approved', 'rejected', 'archived'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS affiliate_applications_review_status_idx
    ON affiliate_applications(review_status, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS affiliate_applications_email_idx
    ON affiliate_applications(lower(email));
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS affiliate_applications_active_preferred_code_idx
    ON affiliate_applications(preferred_code)
    WHERE preferred_code IS NOT NULL
      AND review_status IN ('pending_review', 'contacted', 'approved');
  `);
}

async function ensureChatTablesMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id");

 await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_conversations (
   id TEXT PRIMARY KEY DEFAULT app_random_id(),
   title TEXT NOT NULL DEFAULT '',
   kind TEXT NOT NULL DEFAULT 'direct',
   created_by_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT chat_conversations_kind_check
   CHECK (kind IN ('direct', 'group', 'support'))
  );
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS chat_conversations_updated_at_idx
  ON chat_conversations(updated_at DESC);
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS owner_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS request_category TEXT;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS requester_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN NOT NULL DEFAULT FALSE;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  DROP CONSTRAINT IF EXISTS chat_conversations_status_check;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD CONSTRAINT chat_conversations_status_check
  CHECK (status IN ('open', 'pending', 'resolved', 'closed'));
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  DROP CONSTRAINT IF EXISTS chat_conversations_request_category_check;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD CONSTRAINT chat_conversations_request_category_check
  CHECK (
   request_category IS NULL OR
   request_category IN ('general', 'bug_report', 'order_support', 'billing', 'affiliate_support', 'provider_support', 'other')
  );
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  DROP CONSTRAINT IF EXISTS chat_conversations_priority_check;
 `);

 await pool.query(`
  ALTER TABLE chat_conversations
  ADD CONSTRAINT chat_conversations_priority_check
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
 `);

 await pool.query(`
  UPDATE chat_conversations
  SET requester_user_id = created_by_user_id
  WHERE kind = 'support'
    AND requester_user_id IS NULL;
 `);

 await pool.query(`
  UPDATE chat_conversations
  SET is_legacy = TRUE
  WHERE kind = 'support'
    AND request_category IS NULL;
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_conversation_participants (
   conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
   user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   last_read_at TIMESTAMPTZ,
   PRIMARY KEY (conversation_id, user_id)
  );
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS chat_conversation_participants_user_id_idx
  ON chat_conversation_participants(user_id, conversation_id);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_messages (
   id TEXT PRIMARY KEY DEFAULT app_random_id(),
   conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
   sender_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   body TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'all';
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS attachment_kind TEXT;
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL;
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_visibility_check;
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_visibility_check
  CHECK (visibility IN ('all', 'internal'));
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_attachment_kind_check;
 `);

 await pool.query(`
  ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_attachment_kind_check
  CHECK (attachment_kind IS NULL OR attachment_kind IN ('image', 'file'));
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx
  ON chat_messages(conversation_id, created_at ASC);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_message_user_states (
   message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
   user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   PRIMARY KEY (message_id, user_id)
  );
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS chat_message_user_states_user_pinned_idx
  ON chat_message_user_states(user_id, is_pinned);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_conversation_user_states (
   conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
   user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
   is_marked_unread BOOLEAN NOT NULL DEFAULT FALSE,
   priority TEXT NOT NULL DEFAULT 'none',
   is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   PRIMARY KEY (conversation_id, user_id)
  );
 `);

 await pool.query(`
  ALTER TABLE chat_conversation_user_states
  ADD COLUMN IF NOT EXISTS is_marked_unread BOOLEAN NOT NULL DEFAULT FALSE;
 `);

 await pool.query(`
  ALTER TABLE chat_conversation_user_states
  DROP CONSTRAINT IF EXISTS chat_conversation_user_states_priority_check;
 `);

 await pool.query(`
  ALTER TABLE chat_conversation_user_states
  ADD CONSTRAINT chat_conversation_user_states_priority_check
  CHECK (priority IN ('none', 'low', 'normal', 'high', 'urgent'));
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS chat_conversation_user_states_user_sort_idx
  ON chat_conversation_user_states(user_id, is_hidden, is_pinned, priority);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_typing_states (
   conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
   user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   PRIMARY KEY (conversation_id, user_id)
  );
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS chat_typing_states_updated_at_idx
  ON chat_typing_states(updated_at DESC);
 `);

 await pool.query(`
  CREATE OR REPLACE FUNCTION app_notify_chat_message_realtime()
  RETURNS TRIGGER AS $$
  DECLARE
   participant_record RECORD;
  BEGIN
   PERFORM pg_notify(
    'app_realtime',
    json_build_object('topic', 'chat-conversation', 'resourceId', NEW.conversation_id)::text
   );

   FOR participant_record IN
    SELECT user_id::text AS user_id
    FROM chat_conversation_participants
    WHERE conversation_id = NEW.conversation_id
   LOOP
    PERFORM pg_notify(
     'app_realtime',
     json_build_object('topic', 'chat-inbox', 'resourceId', participant_record.user_id)::text
    );
   END LOOP;

   RETURN NEW;
  END
  $$ LANGUAGE plpgsql;
 `);

 await pool.query(`
  DROP TRIGGER IF EXISTS chat_messages_realtime_notify ON chat_messages;
 `);

 await pool.query(`
  CREATE TRIGGER chat_messages_realtime_notify
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION app_notify_chat_message_realtime();
 `);

 await pool.query(`
  CREATE OR REPLACE FUNCTION app_notify_chat_participant_realtime()
  RETURNS TRIGGER AS $$
  BEGIN
   PERFORM pg_notify(
    'app_realtime',
    json_build_object('topic', 'chat-inbox', 'resourceId', NEW.user_id::text)::text
   );

   PERFORM pg_notify(
    'app_realtime',
    json_build_object('topic', 'chat-conversation', 'resourceId', NEW.conversation_id)::text
   );

   RETURN NEW;
  END
  $$ LANGUAGE plpgsql;
 `);

 await pool.query(`
  DROP TRIGGER IF EXISTS chat_participants_realtime_notify ON chat_conversation_participants;
 `);

 await pool.query(`
  CREATE TRIGGER chat_participants_realtime_notify
  AFTER INSERT ON chat_conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION app_notify_chat_participant_realtime();
 `);

 await pool.query(`
  CREATE OR REPLACE FUNCTION app_notify_chat_typing_realtime()
  RETURNS TRIGGER AS $$
  DECLARE
   target_conversation_id TEXT;
  BEGIN
   target_conversation_id := COALESCE(NEW.conversation_id, OLD.conversation_id);

   PERFORM pg_notify(
    'app_realtime',
    json_build_object('topic', 'chat-conversation', 'resourceId', target_conversation_id)::text
   );

   RETURN COALESCE(NEW, OLD);
  END
  $$ LANGUAGE plpgsql;
 `);

 await pool.query(`
  DROP TRIGGER IF EXISTS chat_typing_states_realtime_notify ON chat_typing_states;
 `);

 await pool.query(`
  CREATE TRIGGER chat_typing_states_realtime_notify
  AFTER INSERT OR UPDATE OR DELETE ON chat_typing_states
  FOR EACH ROW
  EXECUTE FUNCTION app_notify_chat_typing_realtime();
 `);
}

async function ensureNotificationTablesMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id");

 await pool.query(`
  CREATE TABLE IF NOT EXISTS notifications (
   id TEXT PRIMARY KEY DEFAULT app_random_id(),
   title TEXT NOT NULL,
   body TEXT NOT NULL DEFAULT '',
   link_url TEXT NOT NULL DEFAULT '',
   audience_type TEXT NOT NULL DEFAULT 'all',
   created_by_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
   status TEXT NOT NULL DEFAULT 'sent',
   scheduled_at TIMESTAMPTZ,
   metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT notifications_audience_type_check CHECK (audience_type IN ('all', 'role', 'users')),
   CONSTRAINT notifications_status_check CHECK (status IN ('draft', 'scheduled', 'sent', 'archived'))
  );
 `);

 await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`);
 await pool.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check`);
 await pool.query(`
  ALTER TABLE notifications
  ADD CONSTRAINT notifications_status_check CHECK (status IN ('draft', 'scheduled', 'sent', 'archived'))
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON notifications(status, created_at DESC);
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS notifications_scheduled_at_idx
  ON notifications(status, scheduled_at);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS notification_target_roles (
   notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
   role TEXT NOT NULL,
   PRIMARY KEY (notification_id, role),
   CONSTRAINT notification_target_roles_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'PROVIDER'))
  );
 `);

 await pool.query(`ALTER TABLE notification_target_roles DROP CONSTRAINT IF EXISTS notification_target_roles_role_check;`);
 await pool.query(`
  ALTER TABLE notification_target_roles
  ADD CONSTRAINT notification_target_roles_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'PROVIDER'));
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS notification_target_roles_role_idx
  ON notification_target_roles(role, notification_id);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS notification_target_users (
   notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
   user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   PRIMARY KEY (notification_id, user_id)
  );
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS notification_target_users_user_id_idx
  ON notification_target_users(user_id, notification_id);
 `);

 await pool.query(`
  CREATE TABLE IF NOT EXISTS notification_user_states (
   notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
   user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   read_at TIMESTAMPTZ,
   dismissed_at TIMESTAMPTZ,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   PRIMARY KEY (notification_id, user_id)
  );
 `);

 await pool.query(`ALTER TABLE notification_user_states ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ`);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS notification_user_states_user_unread_idx
  ON notification_user_states(user_id, read_at, updated_at DESC);
 `);
}

async function ensureContentCommentsMigration() {
 const pool = getPool();
 const userIdType = await getColumnTypeSql("users", "id", "TEXT");

 await pool.query(`
  CREATE TABLE IF NOT EXISTS content_comments (
   id TEXT PRIMARY KEY DEFAULT app_random_id(),
   target_type TEXT NOT NULL,
   target_id TEXT NOT NULL,
   target_slug TEXT NOT NULL DEFAULT '',
   target_title TEXT NOT NULL DEFAULT '',
   target_url TEXT NOT NULL DEFAULT '',
   author_name TEXT NOT NULL,
   author_email TEXT NOT NULL DEFAULT '',
   author_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
   content TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'pending',
   admin_note TEXT NOT NULL DEFAULT '',
   approved_at TIMESTAMPTZ,
   approved_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT content_comments_target_type_check CHECK (target_type IN ('offering', 'blog_post', 'page', 'invitation')),
   CONSTRAINT content_comments_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'spam', 'deleted'))
  );
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS content_comments_target_status_idx
  ON content_comments(target_type, target_id, status, created_at DESC);
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS content_comments_status_created_idx
  ON content_comments(status, created_at DESC);
 `);

 await pool.query(`
  CREATE INDEX IF NOT EXISTS content_comments_author_email_idx
  ON content_comments(author_email);
 `);
}

async function ensureAdsTablesMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS advertisers (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      website_url TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT advertisers_status_check CHECK (status IN ('active', 'inactive', 'archived'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_placements (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      placement_type TEXT NOT NULL DEFAULT 'banner',
      surface TEXT NOT NULL DEFAULT 'website',
      description TEXT,
      max_items INT NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ad_placements_type_check CHECK (placement_type IN ('banner', 'provider_listing', 'offering_listing', 'mixed')),
      CONSTRAINT ad_placements_surface_check CHECK (surface IN ('website', 'provider_directory', 'category', 'search', 'blog', 'checkout', 'footer')),
      CONSTRAINT ad_placements_max_items_check CHECK (max_items > 0)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_creatives (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      advertiser_id TEXT REFERENCES advertisers(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      creative_type TEXT NOT NULL DEFAULT 'image',
      image_url TEXT NOT NULL,
      mobile_image_url TEXT,
      target_url TEXT,
      alt_text TEXT,
      headline TEXT,
      body TEXT,
      cta_label TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ad_creatives_type_check CHECK (creative_type IN ('image', 'html', 'text')),
      CONSTRAINT ad_creatives_status_check CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_campaigns (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      advertiser_id TEXT NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
      placement_id TEXT NOT NULL REFERENCES ad_placements(id) ON DELETE RESTRICT,
      creative_id TEXT REFERENCES ad_creatives(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      target_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ad_campaigns_status_check CHECK (status IN ('draft', 'pending', 'approved', 'active', 'paused', 'expired', 'rejected', 'archived')),
      CONSTRAINT ad_campaigns_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'waived')),
      CONSTRAINT ad_campaigns_price_check CHECK (price >= 0),
      CONSTRAINT ad_campaigns_date_range_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
      placement_id TEXT REFERENCES ad_placements(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      session_id TEXT,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      target_type TEXT,
      target_id TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT ad_events_type_check CHECK (event_type IN ('impression', 'click', 'lead', 'booking', 'conversion'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_promotion_plans (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      placement_id TEXT REFERENCES ad_placements(id) ON DELETE SET NULL,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      duration_days INT NOT NULL DEFAULT 30,
      priority_weight INT NOT NULL DEFAULT 100,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_promotion_plans_price_check CHECK (price >= 0),
      CONSTRAINT provider_promotion_plans_duration_check CHECK (duration_days > 0),
      CONSTRAINT provider_promotion_plans_priority_check CHECK (priority_weight >= 0)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_promotions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      plan_id TEXT REFERENCES provider_promotion_plans(id) ON DELETE SET NULL,
      placement_id TEXT REFERENCES ad_placements(id) ON DELETE SET NULL,
      offering_id TEXT REFERENCES offerings(id) ON DELETE SET NULL,
      target_type TEXT NOT NULL DEFAULT 'provider',
      target_id TEXT,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      priority_weight INT NOT NULL DEFAULT 100,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      admin_notes TEXT,
      provider_notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT provider_promotions_target_type_check CHECK (target_type IN ('provider', 'offering', 'category', 'search')),
      CONSTRAINT provider_promotions_status_check CHECK (status IN ('draft', 'pending', 'approved', 'active', 'paused', 'expired', 'rejected', 'archived')),
      CONSTRAINT provider_promotions_payment_status_check CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'waived')),
      CONSTRAINT provider_promotions_price_check CHECK (price >= 0),
      CONSTRAINT provider_promotions_priority_check CHECK (priority_weight >= 0),
      CONSTRAINT provider_promotions_date_range_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_promotion_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      promotion_id TEXT NOT NULL REFERENCES provider_promotions(id) ON DELETE CASCADE,
      provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      session_id TEXT,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      target_type TEXT,
      target_id TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      CONSTRAINT provider_promotion_events_type_check CHECK (event_type IN ('impression', 'click', 'lead', 'booking', 'conversion'))
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS advertisers_status_idx ON advertisers(status, updated_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ad_placements_active_idx ON ad_placements(key, is_active);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ad_campaigns_active_lookup_idx ON ad_campaigns(placement_id, status, payment_status, starts_at, ends_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ad_campaigns_advertiser_idx ON ad_campaigns(advertiser_id, updated_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ad_events_campaign_type_idx ON ad_events(campaign_id, event_type, occurred_at DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS provider_promotions_active_lookup_idx ON provider_promotions(provider_id, placement_id, status, payment_status, starts_at, ends_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS provider_promotions_target_idx ON provider_promotions(target_type, target_id, status, priority_weight DESC);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS provider_promotion_events_idx ON provider_promotion_events(promotion_id, event_type, occurred_at DESC);`);

  await pool.query(`
    INSERT INTO ad_placements (key, label, placement_type, surface, description, max_items)
    VALUES
      ('home_hero_banner', 'Homepage hero banner', 'banner', 'website', 'Banner lớn ở trang chủ.', 1),
      ('blog_sidebar', 'Blog sidebar', 'banner', 'blog', 'Banner cạnh bài viết/blog.', 2),
      ('provider_directory_top', 'Provider directory top', 'provider_listing', 'provider_directory', 'Nhà cung cấp ưu tiên ở đầu danh sách.', 6),
      ('category_top', 'Category top', 'mixed', 'category', 'Vị trí đầu trang category.', 4),
      ('search_result_top', 'Search result top', 'mixed', 'search', 'Vị trí đầu kết quả tìm kiếm.', 4),
      ('offering_detail_related', 'Offering detail related', 'mixed', 'website', 'Gợi ý liên quan trong trang offering.', 4),
      ('footer_banner', 'Footer banner', 'banner', 'footer', 'Banner cuối trang.', 1)
    ON CONFLICT (key) DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO provider_promotion_plans (key, name, description, placement_id, price, duration_days, priority_weight)
    SELECT seed.key, seed.name, seed.description, placement.id, seed.price, seed.duration_days, seed.priority_weight
    FROM (
      VALUES
        ('featured_provider_30', 'Featured Provider 30 ngày', 'Ưu tiên provider trong danh sách nhà cung cấp trong 30 ngày.', 'provider_directory_top', 0::numeric, 30, 120),
        ('category_top_30', 'Category Top 30 ngày', 'Ưu tiên trong category phù hợp trong 30 ngày.', 'category_top', 0::numeric, 30, 150),
        ('search_boost_14', 'Search Boost 14 ngày', 'Tăng thứ hạng provider/offering trong kết quả tìm kiếm.', 'search_result_top', 0::numeric, 14, 100)
    ) AS seed(key, name, description, placement_key, price, duration_days, priority_weight)
    LEFT JOIN ad_placements placement ON placement.key = seed.placement_key
    ON CONFLICT (key) DO NOTHING;
  `);
}

async function ensureOfferingProviderPaperTypeMigration() {
  const pool = getPool();
  await pool.query(`ALTER TABLE offerings DROP CONSTRAINT IF EXISTS offerings_type_check`);
  await pool.query(`ALTER TABLE wedding_sites DROP CONSTRAINT IF EXISTS wedding_sites_type_check`);
  await pool.query(`ALTER TABLE commerce_order_items DROP CONSTRAINT IF EXISTS commerce_order_items_offering_type_check`);
  await pool.query(`
    ALTER TABLE commerce_order_items
    ADD CONSTRAINT commerce_order_items_offering_type_check
    CHECK (offering_type <> '')
  `);
  await pool.query(`
    ALTER TABLE wedding_sites
    ADD CONSTRAINT wedding_sites_type_check
    CHECK (site_type IN ('coded', 'editable'))
  `);
}

async function ensureOfferingProviderCostFieldsMigration() {
  const pool = getPool();

  await pool.query(`
    ALTER TABLE physical_offerings
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provider_sku TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS allow_provider_supply BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'physical_offerings_cost_price_check'
      ) THEN
        ALTER TABLE physical_offerings
        ADD CONSTRAINT physical_offerings_cost_price_check
        CHECK (cost_price >= 0);
      END IF;
    END $$;
  `);
}

async function ensureOfferingSeed() {
  const pool = getPool();

  if (offeringSeedCatalog.categories.length === 0 || offeringSeedCatalog.offerings.length === 0) {
    return;
  }

  for (const category of offeringSeedCatalog.categories) {
    await pool.query(
      `
          INSERT INTO offering_categories (slug, name, description, status)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (slug) DO UPDATE
          SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            updated_at = NOW()
        `,
      [category.slug, category.name, category.description, category.status]
    );
  }

  for (const offering of offeringSeedCatalog.offerings) {
    const offeringType = offering.offeringType;
    const seedOffering = offering as typeof offering & {
      templateEngine?: string;
      config?: Record<string, unknown>;
    };
    const seedTemplateEngine = typeof seedOffering.templateEngine === "string" ? seedOffering.templateEngine : "";
    const templateEngine =
      seedTemplateEngine ||
      (offeringType === "digital_template" ? "coded" : "");
    const templateMode = templateEngine === "builder" ? "editable" : templateEngine ? "fixed" : "";
    const templateKey = offering.templateKey;
    const seedConfig = (offering.config ?? {}) as Record<string, unknown>;
    const {
      inventory: _inventory,
      pricing_rules: _pricingRules,
      permissions: _permissions,
      analytics: _analytics,
      booking_logic: _bookingLogic,
      relational_data: _relationalData,
      siteDefaults: _siteDefaults,
      generalOffering: _generalOffering,
      ...safeOfferingConfig
    } = seedConfig;

    void _inventory;
    void _pricingRules;
    void _permissions;
    void _analytics;
    void _bookingLogic;
    void _relationalData;
    void _siteDefaults;
    void _generalOffering;
    const created = await pool.query<{ id: string }>(
      `
          INSERT INTO offerings (
            slug,
            category_id,
            name,
            excerpt,
            description,
            status,
            offering_type,
            template_key,
            template_engine,
            template_mode,
            thumbnail_url,
            price,
            fulfillment_type,
            track_inventory,
            stock_quantity,
            low_stock_threshold,
            allow_backorder,
            config
          )
          SELECT
            $1,
            categories.id,
            $2,
            $3,
            $4,
            'published',
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16
          FROM offering_categories categories
          WHERE categories.slug = $17
          ON CONFLICT (slug) DO UPDATE
          SET
            category_id = EXCLUDED.category_id,
            name = EXCLUDED.name,
            excerpt = EXCLUDED.excerpt,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            offering_type = EXCLUDED.offering_type,
            template_key = EXCLUDED.template_key,
            template_engine = EXCLUDED.template_engine,
            template_mode = EXCLUDED.template_mode,
            thumbnail_url = EXCLUDED.thumbnail_url,
            price = EXCLUDED.price,
            fulfillment_type = EXCLUDED.fulfillment_type,
            track_inventory = EXCLUDED.track_inventory,
            stock_quantity = EXCLUDED.stock_quantity,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            allow_backorder = EXCLUDED.allow_backorder,
            config = EXCLUDED.config,
            updated_at = NOW()
          RETURNING id
        `,
      [
        offering.slug,
        offering.name,
        offering.excerpt,
        offering.description,
        offeringType,
        templateKey,
        templateEngine,
        templateMode,
        offering.thumbnailUrl,
        offering.price,
        offering.fulfillmentType,
        offering.trackInventory ?? false,
        offering.stockQuantity ?? 0,
        offering.lowStockThreshold ?? 0,
        offering.allowBackorder ?? false,
        safeOfferingConfig,
        offering.categorySlug,
      ]
    );

    const offeringId = created.rows[0]?.id;
    if (!offeringId) {
      continue;
    }

    await pool.query("DELETE FROM digital_template_offerings WHERE offering_id = $1", [offeringId]);
    await pool.query("DELETE FROM physical_offerings WHERE offering_id = $1", [offeringId]);

    if (offeringType === "digital_template") {
      await pool.query(
        `
            INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
            VALUES ($1, $2, $3, $4, $5)
          `,
        [
          offeringId,
          templateKey,
          templateEngine || "coded",
          templateMode || "fixed",
          seedOffering.config?.siteDefaults ?? {},
        ]
      );
    }

    if (
      offeringType !== "digital_template" &&
      (offering.fulfillmentType === "physical" ||
        Boolean(offering.trackInventory) ||
        ("allowProviderSupply" in offering && Boolean(offering.allowProviderSupply)))
    ) {
      await pool.query(
        `
            INSERT INTO physical_offerings (
              offering_id,
              fulfillment_type,
              track_inventory,
              stock_quantity,
              low_stock_threshold,
              allow_backorder,
              cost_price,
              provider_sku,
              allow_provider_supply,
              provider_type,
              provider_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NULL, NULL)
          `,
        [
          offeringId,
          offering.fulfillmentType,
          offering.trackInventory ?? false,
          offering.stockQuantity ?? 0,
          offering.lowStockThreshold ?? 0,
          offering.allowBackorder ?? false,
          0,
          "",
        ]
      );
    }
  }
}

async function ensureOfferingTemplateKeyUniqueness() {
  const pool = getPool();
  await pool.query(`DROP INDEX IF EXISTS offerings_offering_type_template_key_unique_idx`);

  const duplicates = await pool.query<{ template_key: string; total: string }>(`
    SELECT template_key, COUNT(*)::text AS total
    FROM offerings
    WHERE offering_type = 'digital_template'
      AND template_engine = 'coded'
    GROUP BY template_key
    HAVING COUNT(*) > 1
  `);

  if (duplicates.rows.length > 0) {
    console.warn(
      "Skipping digital template unique index because duplicate template keys still exist:",
      duplicates.rows
    );
    return;
  }

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS offerings_digital_template_coded_key_unique_idx
    ON offerings(template_key)
    WHERE offering_type = 'digital_template' AND template_engine = 'coded';
  `);
}

export async function ensureOfferingCatalogReady() {
  await ensureDb();
  await ensureOfferingTablesMigration();
  await ensureOfferingProviderPaperTypeMigration();
  await ensureOfferingSeed();
  await ensureOfferingTemplateKeyUniqueness();
}

async function ensureManagedPagesSeed() {
  const pool = getPool();

  for (const [legacySlug, nextSlug] of Object.entries(CONTENT_PAGE_SLUG_ALIASES)) {
    await pool.query(
      `
      UPDATE managed_pages
      SET
        slug = $2,
        updated_at = NOW()
      WHERE slug = $1
        AND NOT EXISTS (
          SELECT 1
          FROM managed_pages existing
          WHERE existing.slug = $2
        )
      `,
      [legacySlug, nextSlug]
    );

    await pool.query(
      `
      UPDATE managed_pages
      SET breadcrumb_parent_slug = $2,
          updated_at = NOW()
      WHERE breadcrumb_parent_slug = $1
      `,
      [legacySlug, nextSlug]
    );

    try {
      await pool.query(
        `
        UPDATE navigation_menu_items
        SET page_slug = $2
        WHERE page_slug = $1
        `,
        [legacySlug, nextSlug]
      );
    } catch {
      // Ignore legacy table absence during transitional menu storage migrations.
    }

    try {
      await pool.query(
        `
        UPDATE cms_menu_items
        SET page_slug = $2
        WHERE page_slug = $1
        `,
        [legacySlug, nextSlug]
      );
    } catch {
      // Ignore legacy table absence during transitional menu storage migrations.
    }
  }

  for (const [slug, config] of Object.entries(AUTH_PAGES)) {
    await pool.query(
      `
      INSERT INTO managed_pages (slug, name, title, status, custom_fields)
      VALUES ($1, $2, $3, 'published', '{}'::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        updated_at = NOW()
      `,
      [slug, config.name, config.name]
    );
  }

  for (const [slug, config] of Object.entries(CONTENT_PAGES)) {
    const defaultStatus = slug === "providers/apply" || slug === "affiliates" || slug === "thiep-giay" ? "published" : "draft";
    await pool.query(
      `
      INSERT INTO managed_pages (slug, name, title, status, custom_fields)
      VALUES ($1, $2, $3, $4, '{}'::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        name = EXCLUDED.name,
        updated_at = NOW()
      `,
      [slug, config.name, config.name, defaultStatus]
    );
  }
}

async function ensureBlogSeed() {
  const pool = getPool();

  const categories = [
    {
      slug: "kinh-nghiem-thiep-cuoi",
      name: "Kinh nghiệm thiệp cưới",
      description: "Các bài viết về chọn mẫu thiệp, viết nội dung và tối ưu flow tạo thiệp online.",
    },
    {
      slug: "ke-hoach-ngan-sach",
      name: "Kế hoạch ngân sách",
      description: "Gợi ý chia chi phí cưới và cách giảm chi không cần thiết.",
    },
    {
      slug: "cam-hung-y-tuong",
      name: "Cảm hứng & ý tưởng",
      description: "Các concept, tone màu và ý tưởng để làm website cưới rõ ràng hơn.",
    },
  ] as const;

  for (const category of categories) {
    await pool.query(
      `
        INSERT INTO blog_categories (slug, name, description, status)
        VALUES ($1, $2, $3, 'published')
        ON CONFLICT (slug) DO UPDATE
        SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          updated_at = NOW()
      `,
      [category.slug, category.name, category.description]
    );
  }

  const posts = [
    {
      categorySlug: "kinh-nghiem-thiep-cuoi",
      slug: "5-noi-dung-khong-nen-thieu-tren-thiep-cuoi-online",
      title: "5 nội dung không nên thiếu trên thiệp cưới online",
      excerpt: "Nếu muốn khách xem thiệp là hiểu ngay thời gian, địa điểm và cách xác nhận tham dự, bạn nên khóa 5 phần nội dung này trước.",
      content:
        "Thiệp cưới online không chỉ là một tấm ảnh đẹp. Nó phải giúp khách nắm được thông tin ngay trong vài giây đầu tiên.\n\nPhần đầu tiên luôn là tên cô dâu chú rể và ngày diễn ra lễ cưới. Đây là cụm thông tin được nhìn thấy sớm nhất nên cần gọn và rõ.\n\nTiếp theo là địa điểm tổ chức. Đừng chỉ ghi tên nhà hàng nếu khách của bạn đến từ nhiều khu vực khác nhau. Hãy thêm địa chỉ cụ thể và gợi ý đường đi nếu cần.\n\nPhần lịch trình cũng rất quan trọng. Nhiều cặp đôi chỉ ghi giờ lễ nhưng bỏ qua giờ đón khách, điều này dễ làm khách bị động.\n\nBạn cũng nên có một đoạn lời mời ngắn. Đủ ấm áp, không quá dài, và thống nhất với phong cách của toàn bộ mẫu thiệp.\n\nCuối cùng là phần xác nhận tham dự hoặc cách liên hệ nhanh. Nếu có website thiệp cưới, đây là nơi nên tận dụng để khách phản hồi thuận tiện hơn.",
    },
    {
      categorySlug: "ke-hoach-ngan-sach",
      slug: "cach-chia-ngan-sach-cuoi-khi-ban-chua-biet-bat-dau-tu-dau",
      title: "Cách chia ngân sách cưới khi bạn chưa biết bắt đầu từ đâu",
      excerpt: "Một khung ngân sách tốt sẽ giúp bạn biết hạng mục nào cần ưu tiên trước và phần nào có thể tối ưu sau.",
      content:
        "Sai lầm phổ biến nhất là chốt từng hạng mục riêng lẻ mà không có tổng ngân sách ban đầu. Điều này làm chi phí cưới tăng rất nhanh.\n\nHãy bắt đầu từ tổng số tiền bạn thực sự có thể chi. Sau đó chia thành các nhóm lớn như nhà hàng, chụp ảnh, trang phục, trang trí và thiệp cưới.\n\nNhà hàng thường là phần lớn nhất, tiếp theo là hình ảnh và trang phục. Thiệp cưới và phần in ấn thường chiếm tỷ trọng nhỏ hơn nhưng lại có nhiều lựa chọn để tối ưu.\n\nNếu bạn dùng thiệp online cho phần mời khách, bạn có thể giảm chi phí in ấn và linh hoạt hơn khi cần sửa thông tin.\n\nSau khi có tỷ lệ khung, bạn mới nên đi sâu vào từng nhà cung cấp. Cách này giúp việc ra quyết định rõ ràng hơn nhiều.",
    },
    {
      categorySlug: "cam-hung-y-tuong",
      slug: "3-huong-chon-tone-mau-thiep-cuoi-de-dep-va-khong-bi-roi",
      title: "3 hướng chọn tone màu thiệp cưới để đẹp và không bị rối",
      excerpt: "Khi chưa biết bắt đầu với màu sắc nào, bạn có thể đi từ bối cảnh lễ cưới, tính cách cặp đôi hoặc mức độ trang trọng mong muốn.",
      content:
        "Một mẫu thiệp đẹp chưa chắc là mẫu có nhiều màu. Điều quan trọng hơn là tổng thể dễ nhìn và có điểm nhấn đúng chỗ.\n\nHướng đầu tiên là chọn tone màu dựa trên bối cảnh lễ cưới. Cưới sân vườn hợp với màu nhẹ và thoáng. Cưới buổi tối trong sảnh lớn có thể dùng tone đậm hơn để tăng độ sang.\n\nHướng thứ hai là chọn theo cá tính của cặp đôi. Nếu muốn cảm giác gần gũi, màu ấm và ít tương phản sẽ phù hợp. Nếu muốn hiện đại, có thể dùng nền sáng và typography rõ ràng.\n\nHướng thứ ba là chọn theo mức độ trang trọng. Sự kiện formal nên tiết chế số màu và giữ khoảng trắng tốt.\n\nDù chọn hướng nào, bạn cũng nên thống nhất giữa ảnh, màu nền, màu chữ và các khối nội dung để tránh cảm giác rời rạc.",
    },
    {
      categorySlug: "kinh-nghiem-thiep-cuoi",
      slug: "khi-nao-nen-dung-mau-code-san-va-khi-nao-nen-dung-builder",
      title: "Khi nào nên dùng mẫu code sẵn và khi nào nên dùng builder",
      excerpt: "Nếu bạn đang phân vân giữa đi nhanh bằng mẫu có sẵn và tự chỉnh sâu bằng builder, đây là cách chọn ngắn gọn nhất.",
      content:
        "Mẫu code sẵn phù hợp khi bạn muốn triển khai nhanh và không muốn mất thời gian sắp xếp bố cục. Bạn chỉ cần thay nội dung, ảnh và xuất bản.\n\nBuilder phù hợp khi bạn muốn chủ động hơn về cấu trúc section, thứ tự nội dung và phong cách trình bày.\n\nNếu thời gian gấp, nên bắt đầu bằng mẫu code sẵn. Nếu bạn đã có ý tưởng rõ và muốn thiệp mang dấu ấn riêng hơn, builder sẽ hợp hơn.\n\nTrong thực tế, nhiều cặp đôi có thể xem mẫu code sẵn trước để xác định gu, sau đó mới chuyển sang builder nếu cần chỉnh sâu hơn.",
    },
  ] as const;

  for (const post of posts) {
    await pool.query(
      `
        INSERT INTO blog_posts (category_id, slug, title, excerpt, content, status)
        SELECT id, $2, $3, $4, $5, 'published'
        FROM blog_categories
        WHERE slug = $1
        ON CONFLICT (slug) DO UPDATE
        SET
          category_id = EXCLUDED.category_id,
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          status = EXCLUDED.status,
          updated_at = NOW()
      `,
      [post.categorySlug, post.slug, post.title, post.excerpt, post.content]
    );
  }
}

export async function ensureDb() {
  if (!globalForDb.ensurePromise) {
    globalForDb.ensurePromise = (async () => {
      if (!globalForDb.initPromise) {
        globalForDb.initPromise = initSchema();
      }
      await globalForDb.initPromise;

      if (!globalForDb.roleMigrationDone) {
        await ensureUsersRoleMigration();
        globalForDb.roleMigrationDone = true;
      }

      if (!globalForDb.userAccountStatusMigrationDone) {
        await ensureUserAccountStatusMigration();
        globalForDb.userAccountStatusMigrationDone = true;
      }

      if (!globalForDb.userWishlistMigrationDone) {
        await ensureUserWishlistMigration();
        globalForDb.userWishlistMigrationDone = true;
      }

      if (!globalForDb.userProfilesMigrationDone) {
        await ensureUserProfilesMigration();
        globalForDb.userProfilesMigrationDone = true;
      }

      if (!globalForDb.userAddressesMigrationDone) {
        await ensureUserAddressesMigration();
        globalForDb.userAddressesMigrationDone = true;
      }

      if (!globalForDb.userShippingProfilesMigrationDone) {
        await ensureUserShippingProfilesMigration();
        globalForDb.userShippingProfilesMigrationDone = true;
      }

      await ensureAppSettingsMigration();

      if (!globalForDb.oauthAccountsMigrationDone) {
        await ensureOauthAccountsMigration();
        globalForDb.oauthAccountsMigrationDone = true;
      }

	      if (!globalForDb.managedPagesMigrationDone) {
	        await ensureManagedPagesMigrationOnce();
	      }

      if (!globalForDb.menuTablesMigrationDone) {
        await ensureMenuTablesMigration();
        globalForDb.menuTablesMigrationDone = true;
      }

      if (!globalForDb.affiliateTablesMigrationDone) {
        await ensureAffiliateTablesMigration();
        globalForDb.affiliateTablesMigrationDone = true;
      }

      if (!globalForDb.internalAccountsMigrationDone) {
        await ensureInternalAccountsMigration();
        globalForDb.internalAccountsMigrationDone = true;
      }

      if (!globalForDb.adminRbacMigrationDone) {
        await ensureAdminRbacMigration();
        globalForDb.adminRbacMigrationDone = true;
      }

      if (!globalForDb.offeringTablesMigrationDone) {
        await ensureOfferingTablesMigration();
        globalForDb.offeringTablesMigrationDone = true;
      }

      if (!globalForDb.coreDatabaseRefactorMigrationDone) {
        await ensureCoreDatabaseRefactorMigration();
        globalForDb.coreDatabaseRefactorMigrationDone = true;
      }

      if (!globalForDb.landingPageTablesMigrationDone) {
        await ensureLandingPageTablesMigration();
        globalForDb.landingPageTablesMigrationDone = true;
      }

      if (!globalForDb.blogTablesMigrationDone) {
        await ensureBlogTablesMigration();
        globalForDb.blogTablesMigrationDone = true;
      }

      if (!globalForDb.commerceTablesMigrationDone) {
        await ensureCommerceTablesMigration();
        globalForDb.commerceTablesMigrationDone = true;
      }

      if (!globalForDb.offeringProviderPaperTypeMigrationDone) {
        await ensureOfferingProviderPaperTypeMigration();
        globalForDb.offeringProviderPaperTypeMigrationDone = true;
      }

      if (!globalForDb.offeringProviderCostFieldsMigrationDone) {
        await ensureOfferingProviderCostFieldsMigration();
        globalForDb.offeringProviderCostFieldsMigrationDone = true;
      }

      if (!globalForDb.providerOrdersMigrationDone) {
        await ensureProviderOrdersMigration();
        globalForDb.providerOrdersMigrationDone = true;
      }

      if (!globalForDb.providerOfferingSubmissionsMigrationDone) {
        await ensureProviderOfferingSubmissionsMigration();
        globalForDb.providerOfferingSubmissionsMigrationDone = true;
      }

      if (!globalForDb.providerApplicationsMigrationDone) {
        await ensureProviderApplicationsMigration();
        globalForDb.providerApplicationsMigrationDone = true;
      }

      if (!globalForDb.affiliateApplicationsMigrationDone) {
        await ensureAffiliateApplicationsMigration();
        globalForDb.affiliateApplicationsMigrationDone = true;
      }

      if (!globalForDb.chatTablesMigrationDone) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationDone = true;
      }

      if (!globalForDb.notificationTablesMigrationDone) {
        await ensureNotificationTablesMigration();
        globalForDb.notificationTablesMigrationDone = true;
      }

      if (!globalForDb.adsTablesMigrationDone) {
        await ensureAdsTablesMigration();
        globalForDb.adsTablesMigrationDone = true;
      }

      if (!globalForDb.contentCommentsMigrationDone) {
        await ensureContentCommentsMigration();
        globalForDb.contentCommentsMigrationDone = true;
      }

      if (!globalForDb.finalArchitectureCleanupMigrationDone) {
        await ensureFinalArchitectureCleanupMigration();
        globalForDb.finalArchitectureCleanupMigrationDone = true;
      }

      const managedPagesSeedSignature = getManagedPagesSeedSignature();
      if (globalForDb.managedPagesSeedSignature !== managedPagesSeedSignature) {
        await ensureManagedPagesSeed();
        globalForDb.managedPagesSeedSignature = managedPagesSeedSignature;
      }

      if (!globalForDb.offeringSeedDone) {
        await ensureOfferingSeed();
        globalForDb.offeringSeedDone = true;
      }

      if (!globalForDb.blogSeedDone) {
        await ensureBlogSeed();
        globalForDb.blogSeedDone = true;
      }
    })().catch((error) => {
      globalForDb.ensurePromise = undefined;
      throw error;
    });
  }

  await globalForDb.ensurePromise;

	  if (!globalForDb.managedPagesMigrationDone) {
	    await ensureManagedPagesMigrationOnce();
	  }

  if (!globalForDb.notificationTablesMigrationDone) {
    await ensureNotificationTablesMigration();
    globalForDb.notificationTablesMigrationDone = true;
  }

  if (!globalForDb.adsTablesMigrationDone) {
    await ensureAdsTablesMigration();
    globalForDb.adsTablesMigrationDone = true;
  }

  if (!globalForDb.contentCommentsMigrationDone) {
    await ensureContentCommentsMigration();
    globalForDb.contentCommentsMigrationDone = true;
  }
}

export async function query<T extends import("pg").QueryResultRow>(text: string, values?: unknown[]) {
 await ensureDb();
 return getPool().query<T>(text, values);
}

export type DbExecutor = <T extends QueryResultRow>(text: string, values?: unknown[]) => Promise<import("pg").QueryResult<T>>;

export async function withTransaction<T>(callback: (execute: DbExecutor) => Promise<T>): Promise<T> {
 await ensureDb();
 const client = await getPool().connect();

 try {
  await client.query("BEGIN");
  const result = await callback((text, values) => client.query(text, values));
  await client.query("COMMIT");
  return result;
 } catch (error) {
  await client.query("ROLLBACK");
  throw error;
 } finally {
 client.release();
 }
}

export async function connectDbListener(): Promise<PoolClient> {
 await ensureDb();
 return getPool().connect();
}
