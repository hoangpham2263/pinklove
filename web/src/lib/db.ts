import"server-only";

import { Pool } from"pg";
import { SYSTEM_PAGES } from "@/features/system-pages/registry";

const globalForDb = globalThis as unknown as {
 pool?: Pool;
 initPromise?: Promise<void>;
 roleMigrationDone?: boolean;
 userProfilesMigrationDone?: boolean;
 userSettingsDensityMigrationDone?: boolean;
 oauthAccountsMigrationDone?: boolean;
 menuTablesMigrationDone?: boolean;
 affiliateTablesMigrationDone?: boolean;
 systemPagesSeedDone?: boolean;
};

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

async function initSchema() {
 const pool = getPool();

 await pool.query(`
 CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 `);

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
 ALTER COLUMN role SET DEFAULT 'user';
 `);

 await pool.query(`
 UPDATE users
 SET role = 'admin'
 WHERE role IS NULL;
 `);

 await pool.query(`
 ALTER TABLE users
 ALTER COLUMN role SET NOT NULL;
 `);

 await pool.query(`
 DO $$
 BEGIN
  IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'users_role_check'
  ) THEN
  ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
  END IF;
 END
 $$;
 `);
}

async function ensureUserProfilesMigration() {
 const pool = getPool();

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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

async function ensureOauthAccountsMigration() {
 const pool = getPool();

 await pool.query(`
 CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
 );
 `);
}

async function ensureCmsPagesMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id BIGSERIAL PRIMARY KEY,
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
    ALTER TABLE cms_pages
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS excerpt TEXT,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'default',
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
    ADD COLUMN IF NOT EXISTS canonical_url TEXT,
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
    UPDATE cms_pages
    SET
      status = COALESCE(status, 'draft'),
      template = COALESCE(template, 'default'),
      noindex = COALESCE(noindex, false),
      nofollow = COALESCE(nofollow, false),
      custom_fields = COALESCE(custom_fields, '{}'::jsonb),
      created_at = COALESCE(created_at, NOW()),
      updated_at = COALESCE(updated_at, NOW());
  `);

  await pool.query(`
    ALTER TABLE cms_pages
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
    CREATE TABLE IF NOT EXISTS cms_menus (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_menu_items (
      id BIGSERIAL PRIMARY KEY,
      menu_id BIGINT NOT NULL REFERENCES cms_menus(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      page_slug TEXT,
      url TEXT,
      position INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT cms_menu_items_type_check CHECK (type IN ('page', 'custom'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS cms_menu_items_menu_id_idx
    ON cms_menu_items(menu_id);
  `);
}

async function ensureAffiliateTablesMigration() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_accounts (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      commission_type TEXT NOT NULL DEFAULT 'percent',
      commission_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT affiliate_accounts_status_check CHECK (status IN ('pending', 'active', 'rejected', 'blocked')),
      CONSTRAINT affiliate_accounts_commission_type_check CHECK (commission_type IN ('percent', 'fixed'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id BIGSERIAL PRIMARY KEY,
      affiliate_user_id BIGINT NOT NULL REFERENCES affiliate_accounts(user_id) ON DELETE CASCADE,
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
      id BIGSERIAL PRIMARY KEY,
      affiliate_user_id BIGINT NOT NULL REFERENCES affiliate_accounts(user_id) ON DELETE CASCADE,
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

async function ensureSystemPagesSeed() {
  const pool = getPool();

  for (const [slug, config] of Object.entries(SYSTEM_PAGES)) {
    await pool.query(
      `
      INSERT INTO cms_pages (slug, name, title, status, template, custom_fields)
      VALUES ($1, $2, $3, 'draft', $4, '{}'::jsonb)
      ON CONFLICT (slug) DO UPDATE
      SET
        name = EXCLUDED.name,
        template = EXCLUDED.template,
        updated_at = NOW()
      `,
      [slug, config.name, config.name, config.template]
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

  if (!globalForDb.oauthAccountsMigrationDone) {
    await ensureOauthAccountsMigration();
    globalForDb.oauthAccountsMigrationDone = true;
  }

  if (!(globalForDb as Record<string, unknown>).cmsPagesMigrationV2Done) {
    await ensureCmsPagesMigration();
    (globalForDb as Record<string, unknown>).cmsPagesMigrationV2Done = true;
  }

  if (!globalForDb.menuTablesMigrationDone) {
    await ensureMenuTablesMigration();
    globalForDb.menuTablesMigrationDone = true;
  }

  if (!globalForDb.affiliateTablesMigrationDone) {
    await ensureAffiliateTablesMigration();
    globalForDb.affiliateTablesMigrationDone = true;
  }

  if (!globalForDb.systemPagesSeedDone) {
    await ensureSystemPagesSeed();
    globalForDb.systemPagesSeedDone = true;
  }
}

export async function query<T extends import("pg").QueryResultRow>(text: string, values?: unknown[]) {
 await ensureDb();
 return getPool().query<T>(text, values);
}
