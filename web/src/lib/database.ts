import"server-only";

import { Pool, type PoolClient, type QueryResultRow } from"pg";
import { CONTENT_PAGE_SLUG_ALIASES, CONTENT_PAGES } from "@/features/pages/registry";
import { AUTH_PAGES } from "@/features/auth/page-registry";
import productSeedCatalog from "@/lib/product-seed-data.json";

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
  userSettingsDensityMigrationDone?: boolean;
  oauthAccountsMigrationDone?: boolean;
  menuTablesMigrationDone?: boolean;
  affiliateTablesMigrationDone?: boolean;
  internalAccountsMigrationDone?: boolean;
  productTablesMigrationDone?: boolean;
  blogTablesMigrationDone?: boolean;
  commerceTablesMigrationDone?: boolean;
  productVendorPaperTypeMigrationDone?: boolean;
  productVendorCostFieldsMigrationDone?: boolean;
  vendorOrdersMigrationDone?: boolean;
  vendorProductSubmissionsMigrationDone?: boolean;
  vendorApplicationsMigrationDone?: boolean;
  affiliateApplicationsMigrationDone?: boolean;
  chatTablesMigrationDone?: boolean;
  chatTablesMigrationV2Done?: boolean;
  chatTablesMigrationV3Done?: boolean;
  chatTablesMigrationV4Done?: boolean;
  chatTablesMigrationV5Done?: boolean;
  chatTablesMigrationV6Done?: boolean;
  chatTablesMigrationV7Done?: boolean;
  notificationTablesMigrationDone?: boolean;
  contentCommentsMigrationDone?: boolean;
  mediaTablesMigrationDone?: boolean;
  productSeedDone?: boolean;
  productCategorySeedDone?: boolean;
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

async function initSchema() {
 const pool = getPool();

 await pool.query(`
 CREATE OR REPLACE FUNCTION app_random_id()
 RETURNS TEXT AS $$
   SELECT md5(random()::text || clock_timestamp()::text || random()::text)
 $$ LANGUAGE SQL;
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

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ui_density TEXT NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_settings_ui_density_check
  CHECK (ui_density IN ('small', 'medium', 'large'))
 );
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
  ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'VENDOR'));
 EXCEPTION
  WHEN duplicate_object THEN
  NULL;
 END
 $$;
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
 ADD COLUMN IF NOT EXISTS wishlist_product_ids JSONB;
 `);

 await pool.query(`
 UPDATE users
 SET wishlist_product_ids = '[]'::jsonb
 WHERE wishlist_product_ids IS NULL
 OR jsonb_typeof(wishlist_product_ids) <> 'array';
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN wishlist_product_ids SET DEFAULT '[]'::jsonb;
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN wishlist_product_ids SET NOT NULL;
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
  vendor_portal_slug TEXT,
  bio TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

  await pool.query(`
  ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS vendor_portal_slug TEXT;
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
  CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_vendor_portal_slug_uidx
  ON user_profiles (LOWER(vendor_portal_slug))
  WHERE vendor_portal_slug IS NOT NULL;
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

async function ensureUserSettingsDensityMigration() {
 const pool = getPool();

 await pool.query(`
 ALTER TABLE user_settings
 DROP CONSTRAINT IF EXISTS user_settings_ui_density_check;
 `);

 await pool.query(`
 ALTER TABLE user_settings
 ALTER COLUMN ui_density SET DEFAULT 'medium';
 `);

 await pool.query(`
 UPDATE user_settings
 SET ui_density = CASE
  WHEN ui_density = 'compact' THEN 'small'
  WHEN ui_density = 'comfortable' THEN 'medium'
  ELSE ui_density
 END;
 `);

 await pool.query(`
 DO $$
 BEGIN
  ALTER TABLE user_settings
  ADD CONSTRAINT user_settings_ui_density_check
  CHECK (ui_density IN ('small', 'medium', 'large'));
 EXCEPTION
  WHEN duplicate_object THEN
  NULL;
 END
 $$;
 `);
}

async function ensureAppSettingsMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY,
      theme TEXT NOT NULL DEFAULT 'pink',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT app_settings_id_check CHECK (id = 1),
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
    VALUES (1, 'pink', NOW())
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
    WHERE id = 1
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
  const pool = getPool();

  await pool.query(`
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

  await pool.query(`
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
      custom_fields JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
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
    ADD COLUMN IF NOT EXISTS custom_fields JSONB,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `);

  await pool.query(`
    UPDATE managed_pages
    SET
      status = COALESCE(status, 'draft'),
      template = COALESCE(template, 'default'),
      noindex = COALESCE(noindex, false),
      nofollow = COALESCE(nofollow, false),
      custom_fields = COALESCE(custom_fields, '{}'::jsonb),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW());
  `);

  await pool.query(`DROP INDEX IF EXISTS managed_pages_permalink_idx;`);

  await pool.query(`
    ALTER TABLE managed_pages
    DROP COLUMN IF EXISTS permalink;
  `);

  await pool.query(`
    ALTER TABLE managed_pages
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN template SET DEFAULT 'default',
    ALTER COLUMN noindex SET DEFAULT false,
    ALTER COLUMN nofollow SET DEFAULT false,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();
  `);
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

async function ensureProductTablesMigration() {
  const pool = getPool();
  const productIdType = await getColumnTypeSql("products", "id", "TEXT");
  const userIdType = await getColumnTypeSql("users", "id", "TEXT");
  const normalizedUserIdType = userIdType.toLowerCase();
  const ownerVendorUserIdSelectSql =
    normalizedUserIdType.includes("bigint") || normalizedUserIdType === "integer" || normalizedUserIdType === "int"
      ? `
          CASE
            WHEN COALESCE(products.config -> 'generalProduct' ->> 'ownerType', '') = 'vendor'
              AND COALESCE(products.config -> 'generalProduct' ->> 'vendorUserId', '') ~ '^[0-9]+$'
              THEN NULLIF(products.config -> 'generalProduct' ->> 'vendorUserId', '')::${userIdType}
            ELSE NULL
          END
        `
      : `
          CASE
            WHEN COALESCE(products.config -> 'generalProduct' ->> 'ownerType', '') = 'vendor'
              THEN NULLIF(products.config -> 'generalProduct' ->> 'vendorUserId', '')::${userIdType}
            ELSE NULL
          END
        `;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT product_categories_status_check CHECK (status IN ('draft', 'published'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      slug TEXT NOT NULL UNIQUE,
      category_id TEXT REFERENCES product_categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      excerpt TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      product_type TEXT NOT NULL,
      template_key TEXT NOT NULL,
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
      CONSTRAINT products_status_check CHECK (status IN ('draft', 'published')),
      CONSTRAINT products_type_check CHECK (product_type IN ('coded_template', 'builder_template', 'general_product')),
      CONSTRAINT products_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service')),
      CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0 OR allow_backorder = TRUE),
      CONSTRAINT products_low_stock_threshold_check CHECK (low_stock_threshold >= 0)
    );
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id TEXT,
    ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'digital',
    ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT FALSE;
  `);

  await pool.query(`
    UPDATE products
    SET
      fulfillment_type = COALESCE(NULLIF(fulfillment_type, ''), 'digital'),
      track_inventory = COALESCE(track_inventory, FALSE),
      stock_quantity = COALESCE(stock_quantity, 0),
      low_stock_threshold = COALESCE(low_stock_threshold, 0),
      allow_backorder = COALESCE(allow_backorder, FALSE);
  `);

  await pool.query(`
    ALTER TABLE products
    ALTER COLUMN fulfillment_type SET NOT NULL,
    ALTER COLUMN track_inventory SET NOT NULL,
    ALTER COLUMN stock_quantity SET NOT NULL,
    ALTER COLUMN low_stock_threshold SET NOT NULL,
    ALTER COLUMN allow_backorder SET NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_fulfillment_type_check,
    DROP CONSTRAINT IF EXISTS products_stock_quantity_check,
    DROP CONSTRAINT IF EXISTS products_low_stock_threshold_check;
  `);

  await pool.query(`
    DO $$
    BEGIN
      ALTER TABLE products
      ADD CONSTRAINT products_fulfillment_type_check
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
      ALTER TABLE products
      ADD CONSTRAINT products_stock_quantity_check
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
      ALTER TABLE products
      ADD CONSTRAINT products_low_stock_threshold_check
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
        WHERE conname = 'products_category_id_fkey'
      ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS products_category_id_idx
    ON products(category_id);
  `);

  await pool.query(`
    DROP INDEX IF EXISTS products_template_key_unique_idx;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coded_template_products (
      product_id ${productIdType} PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      template_key TEXT NOT NULL,
      site_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS builder_products (
      product_id ${productIdType} PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      template_key TEXT NOT NULL,
      site_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS general_products (
      product_id ${productIdType} PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      fulfillment_type TEXT NOT NULL DEFAULT 'digital',
      track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
      stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 0,
      allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
      cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      vendor_sku TEXT NOT NULL DEFAULT '',
      owner_type TEXT NOT NULL DEFAULT 'internal',
      owner_vendor_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT general_products_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service')),
      CONSTRAINT general_products_owner_type_check CHECK (owner_type IN ('internal', 'vendor')),
      CONSTRAINT general_products_cost_price_check CHECK (cost_price >= 0),
      CONSTRAINT general_products_stock_quantity_check CHECK (stock_quantity >= 0 OR allow_backorder = TRUE),
      CONSTRAINT general_products_low_stock_threshold_check CHECK (low_stock_threshold >= 0)
    );
  `);

  await pool.query(`
    ALTER TABLE general_products
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vendor_sku TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    INSERT INTO coded_template_products (product_id, template_key, site_defaults)
    SELECT
      products.id,
      products.template_key,
      CASE
        WHEN jsonb_typeof(products.config -> 'siteDefaults') = 'object' THEN products.config -> 'siteDefaults'
        ELSE '{}'::jsonb
      END
    FROM products
    WHERE products.product_type = 'coded_template'
    ON CONFLICT (product_id) DO UPDATE
    SET
      template_key = EXCLUDED.template_key,
      site_defaults = EXCLUDED.site_defaults,
      updated_at = NOW();
  `);

  await pool.query(`
    INSERT INTO builder_products (product_id, template_key, site_defaults)
    SELECT
      products.id,
      products.template_key,
      CASE
        WHEN jsonb_typeof(products.config -> 'siteDefaults') = 'object' THEN products.config -> 'siteDefaults'
        ELSE '{}'::jsonb
      END
    FROM products
    WHERE products.product_type = 'builder_template'
    ON CONFLICT (product_id) DO UPDATE
    SET
      template_key = EXCLUDED.template_key,
      site_defaults = EXCLUDED.site_defaults,
      updated_at = NOW();
  `);

  await pool.query(`
    INSERT INTO general_products (
      product_id,
      fulfillment_type,
      track_inventory,
      stock_quantity,
      low_stock_threshold,
      allow_backorder,
      cost_price,
      vendor_sku,
      owner_type,
      owner_vendor_user_id
    )
    SELECT
      products.id,
      products.fulfillment_type,
      products.track_inventory,
      products.stock_quantity,
      products.low_stock_threshold,
      products.allow_backorder,
      0,
      '',
      CASE
        WHEN COALESCE(products.config -> 'generalProduct' ->> 'ownerType', '') = 'vendor' THEN 'vendor'
        ELSE 'internal'
      END,
      ${ownerVendorUserIdSelectSql}
    FROM products
    WHERE products.product_type = 'general_product'
    ON CONFLICT (product_id) DO UPDATE
    SET
      fulfillment_type = EXCLUDED.fulfillment_type,
      track_inventory = EXCLUDED.track_inventory,
      stock_quantity = EXCLUDED.stock_quantity,
      low_stock_threshold = EXCLUDED.low_stock_threshold,
      allow_backorder = EXCLUDED.allow_backorder,
      owner_type = EXCLUDED.owner_type,
      owner_vendor_user_id = EXCLUDED.owner_vendor_user_id,
      updated_at = NOW();
  `);

  await pool.query(`
    DELETE FROM coded_template_products
    WHERE product_id IN (
      SELECT id
      FROM products
      WHERE product_type <> 'coded_template'
    );
  `);

  await pool.query(`
    DELETE FROM builder_products
    WHERE product_id IN (
      SELECT id
      FROM products
      WHERE product_type <> 'builder_template'
    );
  `);

  await pool.query(`
    DELETE FROM general_products
    WHERE product_id IN (
      SELECT id
      FROM products
      WHERE product_type <> 'general_product'
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS coded_template_products_template_key_idx
    ON coded_template_products(template_key);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS builder_products_template_key_idx
    ON builder_products(template_key);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS general_products_owner_vendor_user_id_idx
    ON general_products(owner_vendor_user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wedding_sites (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      site_type TEXT NOT NULL,
      template_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      custom_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT wedding_sites_type_check CHECK (site_type IN ('coded_template', 'builder_template')),
      CONSTRAINT wedding_sites_status_check CHECK (status IN ('draft', 'published'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS wedding_sites_user_id_idx
    ON wedding_sites(user_id);
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
  const productIdType = await getColumnTypeSql("products", "id");
  const affiliateUserIdType = await getColumnTypeSql("affiliate_accounts", "user_id", userIdType);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_cart_items (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id ${productIdType} NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL DEFAULT 1,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT shopping_cart_items_quantity_check CHECK (quantity > 0),
      CONSTRAINT shopping_cart_items_user_product_unique UNIQUE (user_id, product_id)
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
      product_id ${productIdType} REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      product_slug TEXT NOT NULL,
      product_type TEXT NOT NULL,
      fulfillment_type TEXT NOT NULL DEFAULT 'digital',
      quantity INT NOT NULL DEFAULT 1,
      unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      line_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_order_items_quantity_check CHECK (quantity > 0),
      CONSTRAINT commerce_order_items_product_type_check CHECK (product_type IN ('coded_template', 'builder_template', 'general_product')),
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
      product_id ${productIdType} NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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
    ON commerce_entitlements(user_id, product_id, order_id);
  `);
}

async function ensureVendorOrdersMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_order_assignments (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      order_id TEXT NOT NULL UNIQUE REFERENCES commerce_orders(id) ON DELETE CASCADE,
      vendor_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending_confirmation',
      internal_note TEXT NOT NULL DEFAULT '',
      vendor_note TEXT NOT NULL DEFAULT '',
      vendor_reference TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      accepted_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_order_assignments_status_check
      CHECK (status IN ('pending_confirmation', 'accepted', 'in_progress', 'ready_for_review', 'completed', 'cancelled'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_order_assignments_vendor_user_id_idx
    ON vendor_order_assignments(vendor_user_id, status, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_order_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      assignment_id TEXT NOT NULL REFERENCES vendor_order_assignments(id) ON DELETE CASCADE,
      actor_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      actor_type TEXT NOT NULL DEFAULT 'system',
      event_type TEXT NOT NULL DEFAULT 'note_added',
      message TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_order_events_actor_type_check
      CHECK (actor_type IN ('admin', 'vendor', 'system')),
      CONSTRAINT vendor_order_events_event_type_check
      CHECK (event_type IN ('assignment_created', 'assignment_reassigned', 'status_changed', 'note_added'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_order_events_assignment_id_idx
    ON vendor_order_events(assignment_id, created_at DESC);
  `);
}

async function ensureVendorProductSubmissionsMigration() {
  const pool = getPool();
  const userIdType = await getColumnTypeSql("users", "id");
  const productIdType = await getColumnTypeSql("products", "id");
  const categoryIdType = await getColumnTypeSql("product_categories", "id");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_product_submissions (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      vendor_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      linked_product_id ${productIdType} REFERENCES products(id) ON DELETE SET NULL,
      category_id ${categoryIdType} REFERENCES product_categories(id) ON DELETE SET NULL,
      submission_type TEXT NOT NULL DEFAULT 'create',
      review_status TEXT NOT NULL DEFAULT 'draft',
      name TEXT NOT NULL DEFAULT '',
      slug_candidate TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      fulfillment_type TEXT NOT NULL DEFAULT 'physical',
      purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      proposed_stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 0,
      allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
      vendor_sku TEXT NOT NULL DEFAULT '',
      vendor_note TEXT NOT NULL DEFAULT '',
      admin_sell_price NUMERIC(12,2),
      review_note TEXT NOT NULL DEFAULT '',
      submitted_at TIMESTAMPTZ,
      reviewed_at TIMESTAMPTZ,
      reviewed_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_product_submissions_submission_type_check
      CHECK (submission_type IN ('create', 'update', 'discontinue')),
      CONSTRAINT vendor_product_submissions_review_status_check
      CHECK (review_status IN ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'archived')),
      CONSTRAINT vendor_product_submissions_fulfillment_type_check
      CHECK (fulfillment_type IN ('digital', 'physical', 'service')),
      CONSTRAINT vendor_product_submissions_purchase_cost_check
      CHECK (purchase_cost >= 0),
      CONSTRAINT vendor_product_submissions_admin_sell_price_check
      CHECK (admin_sell_price IS NULL OR admin_sell_price >= 0),
      CONSTRAINT vendor_product_submissions_stock_quantity_check
      CHECK (proposed_stock_quantity >= 0 OR allow_backorder = TRUE),
      CONSTRAINT vendor_product_submissions_low_stock_threshold_check
      CHECK (low_stock_threshold >= 0)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_product_submissions_vendor_user_id_idx
    ON vendor_product_submissions(vendor_user_id, review_status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_product_submissions_review_status_idx
    ON vendor_product_submissions(review_status, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_product_submission_events (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      submission_id TEXT NOT NULL REFERENCES vendor_product_submissions(id) ON DELETE CASCADE,
      actor_user_id ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      actor_type TEXT NOT NULL DEFAULT 'system',
      event_type TEXT NOT NULL DEFAULT 'note_added',
      message TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_product_submission_events_actor_type_check
      CHECK (actor_type IN ('admin', 'vendor', 'system')),
      CONSTRAINT vendor_product_submission_events_event_type_check
      CHECK (event_type IN ('created', 'submitted', 'review_started', 'changes_requested', 'approved', 'rejected', 'updated', 'archived', 'note_added'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_product_submission_events_submission_id_idx
    ON vendor_product_submission_events(submission_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_vendor_suppliers (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      product_id ${productIdType} NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      vendor_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active',
      source TEXT NOT NULL DEFAULT 'admin',
      purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      vendor_sku TEXT NOT NULL DEFAULT '',
      lead_time_days INT NOT NULL DEFAULT 0,
      monthly_capacity INT NOT NULL DEFAULT 0,
      service_area TEXT NOT NULL DEFAULT '',
      quality_note TEXT NOT NULL DEFAULT '',
      approved_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT product_vendor_suppliers_status_check CHECK (status IN ('active', 'paused', 'suspended', 'revoked')),
      CONSTRAINT product_vendor_suppliers_source_check CHECK (source IN ('admin', 'proposal', 'supplier_request')),
      CONSTRAINT product_vendor_suppliers_purchase_cost_check CHECK (purchase_cost >= 0),
      CONSTRAINT product_vendor_suppliers_lead_time_days_check CHECK (lead_time_days >= 0),
      CONSTRAINT product_vendor_suppliers_monthly_capacity_check CHECK (monthly_capacity >= 0),
      CONSTRAINT product_vendor_suppliers_product_vendor_unique UNIQUE (product_id, vendor_user_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS product_vendor_suppliers_vendor_user_id_idx
    ON product_vendor_suppliers(vendor_user_id, status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS product_vendor_suppliers_product_id_idx
    ON product_vendor_suppliers(product_id, status, updated_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_product_supplier_requests (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      product_id ${productIdType} NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      vendor_user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      review_status TEXT NOT NULL DEFAULT 'submitted',
      purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      vendor_sku TEXT NOT NULL DEFAULT '',
      lead_time_days INT NOT NULL DEFAULT 0,
      monthly_capacity INT NOT NULL DEFAULT 0,
      service_area TEXT NOT NULL DEFAULT '',
      sample_image_url TEXT NOT NULL DEFAULT '',
      material_note TEXT NOT NULL DEFAULT '',
      quality_note TEXT NOT NULL DEFAULT '',
      vendor_note TEXT NOT NULL DEFAULT '',
      review_note TEXT NOT NULL DEFAULT '',
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by ${userIdType} REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vendor_product_supplier_requests_review_status_check CHECK (review_status IN ('submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'archived')),
      CONSTRAINT vendor_product_supplier_requests_purchase_cost_check CHECK (purchase_cost >= 0),
      CONSTRAINT vendor_product_supplier_requests_lead_time_days_check CHECK (lead_time_days >= 0),
      CONSTRAINT vendor_product_supplier_requests_monthly_capacity_check CHECK (monthly_capacity >= 0)
    );
  `);

  await pool.query(`
    DROP INDEX IF EXISTS vendor_product_supplier_requests_open_uidx;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS vendor_product_supplier_requests_active_uidx
    ON vendor_product_supplier_requests(product_id, vendor_user_id)
    WHERE review_status IN ('submitted', 'under_review', 'changes_requested');
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_product_supplier_requests_vendor_user_id_idx
    ON vendor_product_supplier_requests(vendor_user_id, review_status, updated_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_product_supplier_requests_review_status_idx
    ON vendor_product_supplier_requests(review_status, updated_at DESC);
  `);
}

async function ensureVendorApplicationsMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_applications (
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
      CONSTRAINT vendor_applications_review_status_check
      CHECK (review_status IN ('pending_review', 'contacted', 'approved', 'rejected', 'archived'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_applications_review_status_idx
    ON vendor_applications(review_status, created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS vendor_applications_email_idx
    ON vendor_applications(lower(email));
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
   request_category IN ('general', 'bug_report', 'order_support', 'billing', 'affiliate_support', 'vendor_support', 'other')
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
   CONSTRAINT notification_target_roles_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'VENDOR'))
  );
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
   CONSTRAINT content_comments_target_type_check CHECK (target_type IN ('product', 'blog_post', 'page', 'invitation')),
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

async function ensureProductVendorPaperTypeMigration() {
  const pool = getPool();
  await pool.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check`);
  await pool.query(`ALTER TABLE commerce_order_items DROP CONSTRAINT IF EXISTS commerce_order_items_product_type_check`);
  await pool.query(`
    UPDATE products
    SET product_type = 'general_product'
    WHERE product_type = 'vendor_paper'
  `);
  await pool.query(`
    UPDATE commerce_order_items
    SET product_type = 'general_product'
    WHERE product_type = 'vendor_paper'
  `);
  await pool.query(`
    ALTER TABLE products
    ADD CONSTRAINT products_type_check
    CHECK (product_type IN ('coded_template', 'builder_template', 'general_product'))
  `);
  await pool.query(`
    ALTER TABLE commerce_order_items
    ADD CONSTRAINT commerce_order_items_product_type_check
    CHECK (product_type IN ('coded_template', 'builder_template', 'general_product'))
  `);
}

async function ensureProductVendorCostFieldsMigration() {
  const pool = getPool();

  await pool.query(`
    ALTER TABLE general_products
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vendor_sku TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'general_products_cost_price_check'
      ) THEN
        ALTER TABLE general_products
        ADD CONSTRAINT general_products_cost_price_check
        CHECK (cost_price >= 0);
      END IF;
    END $$;
  `);
}

async function ensureProductSeed() {
  const pool = getPool();

  if (productSeedCatalog.categories.length === 0 || productSeedCatalog.products.length === 0) {
    return;
  }

  for (const category of productSeedCatalog.categories) {
    await pool.query(
      `
          INSERT INTO product_categories (slug, name, description, status)
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

  for (const product of productSeedCatalog.products) {
    const created = await pool.query<{ id: string }>(
      `
          INSERT INTO products (
            slug,
            category_id,
            name,
            excerpt,
            description,
            status,
            product_type,
            template_key,
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
            $14
          FROM product_categories categories
          WHERE categories.slug = $15
          ON CONFLICT (slug) DO UPDATE
          SET
            category_id = EXCLUDED.category_id,
            name = EXCLUDED.name,
            excerpt = EXCLUDED.excerpt,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            product_type = EXCLUDED.product_type,
            template_key = EXCLUDED.template_key,
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
        product.slug,
        product.name,
        product.excerpt,
        product.description,
        product.productType,
        product.templateKey,
        product.thumbnailUrl,
        product.price,
        product.fulfillmentType,
        product.trackInventory ?? false,
        product.stockQuantity ?? 0,
        product.lowStockThreshold ?? 0,
        product.allowBackorder ?? false,
        product.config,
        product.categorySlug,
      ]
    );

    const productId = created.rows[0]?.id;
    if (!productId) {
      continue;
    }

    await pool.query("DELETE FROM coded_template_products WHERE product_id = $1", [productId]);
    await pool.query("DELETE FROM builder_products WHERE product_id = $1", [productId]);
    await pool.query("DELETE FROM general_products WHERE product_id = $1", [productId]);

    if (product.productType === "coded_template") {
      await pool.query(
        `
            INSERT INTO coded_template_products (product_id, template_key, site_defaults)
            VALUES ($1, $2, $3)
          `,
        [productId, product.templateKey, product.config.siteDefaults ?? {}]
      );
    }

    if (product.productType === "builder_template") {
      await pool.query(
        `
            INSERT INTO builder_products (product_id, template_key, site_defaults)
            VALUES ($1, $2, $3)
          `,
        [productId, product.templateKey, product.config.siteDefaults ?? {}]
      );
    }

    if (product.productType === "general_product") {
      await pool.query(
        `
            INSERT INTO general_products (
              product_id,
              fulfillment_type,
              track_inventory,
              stock_quantity,
              low_stock_threshold,
              allow_backorder,
              cost_price,
              vendor_sku,
              owner_type,
              owner_vendor_user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)
          `,
        [
          productId,
          product.fulfillmentType,
          product.trackInventory ?? false,
          product.stockQuantity ?? 0,
          product.lowStockThreshold ?? 0,
          product.allowBackorder ?? false,
          product.config.generalProduct?.costPrice ?? 0,
          product.config.generalProduct?.vendorSku ?? "",
          product.config.generalProduct?.ownerType === "vendor" ? "vendor" : "internal",
        ]
      );
    }
  }
}

async function ensureProductTemplateKeyUniqueness() {
  const pool = getPool();
  await pool.query(`DROP INDEX IF EXISTS products_product_type_template_key_unique_idx`);

  const duplicates = await pool.query<{ template_key: string; total: string }>(`
    SELECT template_key, COUNT(*)::text AS total
    FROM products
    WHERE product_type = 'coded_template'
    GROUP BY template_key
    HAVING COUNT(*) > 1
  `);

  if (duplicates.rows.length > 0) {
    console.warn(
      "Skipping coded template unique index because duplicate template keys still exist:",
      duplicates.rows
    );
    return;
  }

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS products_coded_template_key_unique_idx
    ON products(template_key)
    WHERE product_type = 'coded_template';
  `);
}

export async function ensureProductCatalogReady() {
  await ensureDb();
  await ensureProductTablesMigration();
  await ensureProductVendorPaperTypeMigration();
  await ensureProductSeed();
  await ensureProductTemplateKeyUniqueness();
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
    const defaultStatus = slug === "partner-apply" || slug === "affiliate-apply" || slug === "thiep-giay" ? "published" : "draft";
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

      if (!globalForDb.userSettingsDensityMigrationDone) {
        await ensureUserSettingsDensityMigration();
        globalForDb.userSettingsDensityMigrationDone = true;
      }

      await ensureAppSettingsMigration();

      if (!globalForDb.oauthAccountsMigrationDone) {
        await ensureOauthAccountsMigration();
        globalForDb.oauthAccountsMigrationDone = true;
      }

      if (!(globalForDb as Record<string, unknown>).managedPagesMigrationDone) {
        await ensureManagedPagesMigration();
        (globalForDb as Record<string, unknown>).managedPagesMigrationDone = true;
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

      if (!globalForDb.productTablesMigrationDone) {
        await ensureProductTablesMigration();
        globalForDb.productTablesMigrationDone = true;
      }

      if (!globalForDb.blogTablesMigrationDone) {
        await ensureBlogTablesMigration();
        globalForDb.blogTablesMigrationDone = true;
      }

      if (!globalForDb.commerceTablesMigrationDone) {
        await ensureCommerceTablesMigration();
        globalForDb.commerceTablesMigrationDone = true;
      }

      if (!globalForDb.productVendorPaperTypeMigrationDone) {
        await ensureProductVendorPaperTypeMigration();
        globalForDb.productVendorPaperTypeMigrationDone = true;
      }

      if (!globalForDb.productVendorCostFieldsMigrationDone) {
        await ensureProductVendorCostFieldsMigration();
        globalForDb.productVendorCostFieldsMigrationDone = true;
      }

      if (!globalForDb.vendorOrdersMigrationDone) {
        await ensureVendorOrdersMigration();
        globalForDb.vendorOrdersMigrationDone = true;
      }

      if (!globalForDb.vendorProductSubmissionsMigrationDone) {
        await ensureVendorProductSubmissionsMigration();
        globalForDb.vendorProductSubmissionsMigrationDone = true;
      }

      if (!globalForDb.vendorApplicationsMigrationDone) {
        await ensureVendorApplicationsMigration();
        globalForDb.vendorApplicationsMigrationDone = true;
      }

      if (!globalForDb.affiliateApplicationsMigrationDone) {
        await ensureAffiliateApplicationsMigration();
        globalForDb.affiliateApplicationsMigrationDone = true;
      }

      if (!globalForDb.chatTablesMigrationDone) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationDone = true;
      }

      if (!globalForDb.chatTablesMigrationV2Done) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationV2Done = true;
      }

      if (!globalForDb.chatTablesMigrationV3Done) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationV3Done = true;
      }

      if (!globalForDb.chatTablesMigrationV4Done) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationV4Done = true;
      }

      if (!globalForDb.chatTablesMigrationV5Done) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationV5Done = true;
      }

      if (!globalForDb.chatTablesMigrationV6Done) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationV6Done = true;
      }

      if (!globalForDb.chatTablesMigrationV7Done) {
        await ensureChatTablesMigration();
        globalForDb.chatTablesMigrationV7Done = true;
      }

      if (!globalForDb.notificationTablesMigrationDone) {
        await ensureNotificationTablesMigration();
        globalForDb.notificationTablesMigrationDone = true;
      }

      if (!globalForDb.contentCommentsMigrationDone) {
        await ensureContentCommentsMigration();
        globalForDb.contentCommentsMigrationDone = true;
      }

      const managedPagesSeedSignature = getManagedPagesSeedSignature();
      if (globalForDb.managedPagesSeedSignature !== managedPagesSeedSignature) {
        await ensureManagedPagesSeed();
        globalForDb.managedPagesSeedSignature = managedPagesSeedSignature;
      }

      if (!globalForDb.productSeedDone) {
        await ensureProductSeed();
        globalForDb.productSeedDone = true;
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

  if (!globalForDb.chatTablesMigrationV5Done) {
    await ensureChatTablesMigration();
    globalForDb.chatTablesMigrationV5Done = true;
  }

  if (!globalForDb.chatTablesMigrationV6Done) {
    await ensureChatTablesMigration();
    globalForDb.chatTablesMigrationV6Done = true;
  }

  if (!globalForDb.chatTablesMigrationV7Done) {
    await ensureChatTablesMigration();
    globalForDb.chatTablesMigrationV7Done = true;
  }

  if (!globalForDb.notificationTablesMigrationDone) {
    await ensureNotificationTablesMigration();
    globalForDb.notificationTablesMigrationDone = true;
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
