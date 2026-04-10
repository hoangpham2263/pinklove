import"server-only";

import { Pool, type QueryResultRow } from"pg";
import { CONTENT_PAGES } from "@/features/pages/registry";
import { AUTH_PAGES } from "@/features/auth/page-registry";

const globalForDb = globalThis as unknown as {
 pool?: Pool;
 initPromise?: Promise<void>;
  roleMigrationDone?: boolean;
  userProfilesMigrationDone?: boolean;
  userSettingsDensityMigrationDone?: boolean;
  oauthAccountsMigrationDone?: boolean;
  menuTablesMigrationDone?: boolean;
  affiliateTablesMigrationDone?: boolean;
  internalAccountsMigrationDone?: boolean;
  productTablesMigrationDone?: boolean;
  blogTablesMigrationDone?: boolean;
  commerceTablesMigrationDone?: boolean;
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
 CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
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

async function ensureUserProfilesMigration() {
 const pool = getPool();

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  bio TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
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
    ADD COLUMN IF NOT EXISTS seo_permalink JSONB,
    ADD COLUMN IF NOT EXISTS seo_breadcrumb JSONB,
    ADD COLUMN IF NOT EXISTS seo_sitemap JSONB,
    ADD COLUMN IF NOT EXISTS seo_indexing JSONB,
    ADD COLUMN IF NOT EXISTS seo_branding JSONB,
    ADD COLUMN IF NOT EXISTS seo_opengraph JSONB,
    ADD COLUMN IF NOT EXISTS seo_favicon JSONB,
    ADD COLUMN IF NOT EXISTS global_fields_config JSONB,
    ADD COLUMN IF NOT EXISTS commerce_config JSONB;
  `);

  await pool.query(`
    INSERT INTO app_settings (id, theme, updated_at)
    VALUES (1, 'pink', NOW())
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function ensureOauthAccountsMigration() {
 const pool = getPool();

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id TEXT PRIMARY KEY DEFAULT app_random_id(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      permalink TEXT,
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
    ADD COLUMN IF NOT EXISTS permalink TEXT,
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
      permalink = COALESCE(
        NULLIF(permalink, ''),
        CASE
          WHEN slug = 'home' THEN '/'
          WHEN slug IN ('login', 'register') THEN '/customer/' || slug
          ELSE '/' || slug
        END
      ),
      noindex = COALESCE(noindex, false),
      nofollow = COALESCE(nofollow, false),
      custom_fields = COALESCE(custom_fields, '{}'::jsonb),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW());
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS managed_pages_permalink_idx
    ON managed_pages(permalink);
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_accounts (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      commission_type TEXT NOT NULL DEFAULT 'percent',
      commission_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
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
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT products_status_check CHECK (status IN ('draft', 'published')),
      CONSTRAINT products_type_check CHECK (product_type IN ('coded_template', 'builder_template')),
      CONSTRAINT products_fulfillment_type_check CHECK (fulfillment_type IN ('digital', 'physical', 'service'))
    );
  `);

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category_id TEXT,
    ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'digital';
  `);

  await pool.query(`
    UPDATE products
    SET fulfillment_type = COALESCE(NULLIF(fulfillment_type, ''), 'digital');
  `);

  await pool.query(`
    ALTER TABLE products
    ALTER COLUMN fulfillment_type SET NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_fulfillment_type_check;
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
    CREATE TABLE IF NOT EXISTS wedding_sites (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      CONSTRAINT commerce_order_items_product_type_check CHECK (product_type IN ('coded_template', 'builder_template')),
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
      method TEXT NOT NULL DEFAULT 'mock_online',
      provider TEXT NOT NULL DEFAULT 'mock',
      amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      external_ref TEXT,
      paid_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT commerce_payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
      CONSTRAINT commerce_payments_method_check CHECK (method IN ('mock_online', 'bank_transfer', 'cod'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS commerce_payments_order_id_idx
    ON commerce_payments(order_id, created_at DESC);
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

async function ensureProductSeed() {
  const pool = getPool();

  const seedCategories = [
    {
      slug: "coded-templates",
      name: "Coded Templates",
      description: "Nhóm sản phẩm mẫu thiệp code sẵn.",
      status: "published",
    },
    {
      slug: "builder-templates",
      name: "Builder Templates",
      description: "Nhóm sản phẩm starter cho luồng builder.",
      status: "published",
    },
  ] as const;

  for (const category of seedCategories) {
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

  const seedProducts = [
    {
      categorySlug: "coded-templates",
      slug: "romantic-bloom",
      name: "Romantic Bloom",
      excerpt: "Mẫu thiệp cưới phong cách nhẹ nhàng, hiện đại và dễ chỉnh sửa.",
      description: "Template code sẵn dành cho các cặp đôi muốn triển khai nhanh với bố cục tinh tế và trang gallery đơn giản.",
      productType: "coded_template",
      templateKey: "romantic_bloom",
      price: "990000",
      fulfillmentType: "digital",
      config: {
        siteDefaults: {
          brideName: "Lan",
          groomName: "Minh",
          heroSubtitle: "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.",
          eventDate: "15.12.2026",
          venue: "White Palace, TP.HCM",
          storyTitle: "Chuyện của chúng mình",
          storyBody: "Từ một lần gặp gỡ rất tình cờ, chúng mình đã cùng nhau đi qua nhiều kỷ niệm đẹp.",
          gallery: [],
        },
      },
    },
    {
      categorySlug: "coded-templates",
      slug: "classic-garden",
      name: "Classic Garden",
      excerpt: "Mẫu thiệp cưới cân bằng giữa phong cách cổ điển và bố cục hiện đại.",
      description: "Template code sẵn phù hợp với lễ cưới sang trọng, tối ưu cho phần lịch trình và album ảnh.",
      productType: "coded_template",
      templateKey: "classic_garden",
      price: "1290000",
      fulfillmentType: "digital",
      config: {
        siteDefaults: {
          brideName: "Trâm",
          groomName: "Huy",
          heroSubtitle: "Một lời mời ấm áp dành cho người thân yêu trong ngày cưới của chúng tôi.",
          eventDate: "20.01.2027",
          venue: "Garden Hall, Đà Lạt",
          storyTitle: "Hành trình yêu thương",
          storyBody: "Chúng mình mong được chia sẻ niềm vui này với tất cả bạn bè và người thân.",
          gallery: [],
        },
      },
    },
    {
      categorySlug: "builder-templates",
      slug: "builder-starter",
      name: "Builder Starter",
      excerpt: "Bắt đầu từ bố cục section-based để tự tạo thiệp cưới theo ý muốn.",
      description: "Sản phẩm nền tảng cho luồng tự tạo thiệp. Hiện đang ở mức section-based builder và sẵn sàng cho phase kéo-thả sau.",
      productType: "builder_template",
      templateKey: "freeform_sections",
      price: "0",
      fulfillmentType: "digital",
      config: {
        siteDefaults: {
          heroTitle: "Tự tạo thiệp cưới của bạn",
          heroSubtitle: "Bắt đầu với bố cục section-based và tùy biến nội dung theo ý muốn.",
          sectionOneTitle: "Giới thiệu",
          sectionOneBody: "Chào mừng bạn đến với ngày đặc biệt của chúng tôi.",
          sectionTwoTitle: "Lịch trình",
          sectionTwoBody: "Lễ cưới sẽ diễn ra vào lúc 18:00 tại địa điểm được ghi bên dưới.",
          sectionThreeTitle: "Lời nhắn",
          sectionThreeBody: "Rất mong được gặp bạn trong ngày vui của chúng tôi.",
        },
      },
    },
  ] as const;

  for (const product of seedProducts) {
    await pool.query(
      `
        INSERT INTO products (
          slug, category_id, name, excerpt, description, status, product_type, template_key, price, fulfillment_type, config
        )
        SELECT $1, categories.id, $2, $3, $4, 'published', $5, $6, $7, $8, $9
        FROM product_categories categories
        WHERE categories.slug = $10
        ON CONFLICT (slug) DO UPDATE
        SET
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          excerpt = EXCLUDED.excerpt,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          product_type = EXCLUDED.product_type,
          template_key = EXCLUDED.template_key,
          price = EXCLUDED.price,
          fulfillment_type = EXCLUDED.fulfillment_type,
          config = EXCLUDED.config,
          updated_at = NOW()
      `,
      [
        product.slug,
        product.name,
        product.excerpt,
        product.description,
        product.productType,
        product.templateKey,
        product.price,
        product.fulfillmentType,
        product.config,
        product.categorySlug,
      ]
    );
  }
}

export async function ensureProductCatalogReady() {
  await ensureDb();
  await ensureProductTablesMigration();
  await ensureProductSeed();
}

async function ensureManagedPagesSeed() {
  const pool = getPool();

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
    await pool.query(
      `
      INSERT INTO managed_pages (slug, name, title, status, custom_fields)
      VALUES ($1, $2, $3, 'draft', '{}'::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        name = EXCLUDED.name,
        updated_at = NOW()
      `,
      [slug, config.name, config.name]
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
  if (!globalForDb.initPromise) {
    globalForDb.initPromise = initSchema();
  }
  await globalForDb.initPromise;

  if (!globalForDb.roleMigrationDone) {
    await ensureUsersRoleMigration();
    globalForDb.roleMigrationDone = true;
  }

  if (!globalForDb.userProfilesMigrationDone) {
    await ensureUserProfilesMigration();
    globalForDb.userProfilesMigrationDone = true;
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
