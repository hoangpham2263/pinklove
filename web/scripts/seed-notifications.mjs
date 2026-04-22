import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const rootDir = path.resolve(process.cwd(), "..");
const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "12313";
const SEED_KEY = "notification-demo-seed";

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
loadEnvFile(path.join(process.cwd(), ".env.local"));

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

async function getColumnTypeSql(client, tableName, columnName, fallbackType = "TEXT") {
  const result = await client.query(
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

async function ensureSchema(client) {
  await client.query(`
    CREATE OR REPLACE FUNCTION app_random_id()
    RETURNS TEXT AS $$
      SELECT md5(random()::text || clock_timestamp()::text || random()::text)
    $$ LANGUAGE SQL;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT app_random_id(),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT");
  await client.query(`
    UPDATE users
    SET role = CASE
      WHEN role IS NULL OR BTRIM(role) = '' THEN 'CUSTOMER'
      WHEN LOWER(role) = 'admin' THEN 'ADMIN'
      WHEN LOWER(role) = 'user' THEN 'CUSTOMER'
      ELSE UPPER(role)
    END
  `);
  await client.query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'CUSTOMER'");
  await client.query("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
  await client.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
  await client.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'VENDOR'))
  `);

  const userIdType = await getColumnTypeSql(client, "users", "id");

  await client.query(`
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ");
  await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb");
  await client.query("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_audience_type_check");
  await client.query("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_status_check");
  await client.query(`
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_audience_type_check CHECK (audience_type IN ('all', 'role', 'users'))
  `);
  await client.query(`
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_status_check CHECK (status IN ('draft', 'scheduled', 'sent', 'archived'))
  `);
  await client.query("CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(status, created_at DESC)");
  await client.query("CREATE INDEX IF NOT EXISTS notifications_scheduled_at_idx ON notifications(status, scheduled_at)");

  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_target_roles (
      notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      PRIMARY KEY (notification_id, role)
    );
  `);
  await client.query("ALTER TABLE notification_target_roles DROP CONSTRAINT IF EXISTS notification_target_roles_role_check");
  await client.query(`
    ALTER TABLE notification_target_roles
    ADD CONSTRAINT notification_target_roles_role_check CHECK (role IN ('ADMIN', 'CUSTOMER', 'AFFILIATE', 'VENDOR'))
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_target_users (
      notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (notification_id, user_id)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS notification_user_states (
      notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      read_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (notification_id, user_id)
    );
  `);
}

async function upsertUser(client, { username, role }) {
  const result = await client.query(
    `
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username)
      DO UPDATE SET role = EXCLUDED.role
      RETURNING id, username, role
    `,
    [username, hashPassword(PASSWORD), role]
  );

  return result.rows[0];
}

async function insertNotification(client, input) {
  const result = await client.query(
    `
      INSERT INTO notifications (
        title,
        body,
        link_url,
        audience_type,
        created_by_user_id,
        status,
        scheduled_at,
        metadata,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, NOW())
      RETURNING id
    `,
    [
      input.title,
      input.body,
      input.linkUrl ?? "",
      input.audienceType,
      input.createdByUserId,
      input.status,
      input.scheduledAt ?? null,
      JSON.stringify({ seed: SEED_KEY, key: input.key }),
      input.createdAt,
    ]
  );

  const notificationId = result.rows[0].id;

  for (const role of input.roles ?? []) {
    await client.query(
      "INSERT INTO notification_target_roles (notification_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [notificationId, role]
    );
  }

  for (const userId of input.userIds ?? []) {
    await client.query(
      "INSERT INTO notification_target_users (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [notificationId, userId]
    );
  }

  return notificationId;
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");
    await ensureSchema(client);

    const admin = await upsertUser(client, { username: "seed-admin", role: "ADMIN" });
    const customer = await upsertUser(client, { username: "seed-customer", role: "CUSTOMER" });
    const affiliate = await upsertUser(client, { username: "seed-affiliate", role: "AFFILIATE" });
    const vendor = await upsertUser(client, { username: "seed-vendor", role: "VENDOR" });

    await client.query(
      `
        DELETE FROM notifications
        WHERE metadata->>'seed' = $1
      `,
      [SEED_KEY]
    );

    const now = new Date();
    const minutesAgo = (minutes) => new Date(now.getTime() - minutes * 60_000);
    const minutesFromNow = (minutes) => new Date(now.getTime() + minutes * 60_000);

    const allNoticeId = await insertNotification(client, {
      key: "sent-all",
      title: "Thông báo toàn hệ thống",
      body: "Demo thông báo gửi cho tất cả role. Người nhận sẽ thấy badge chưa xem trên bell header.",
      linkUrl: "/customer/dashboard",
      audienceType: "all",
      createdByUserId: admin.id,
      status: "sent",
      createdAt: minutesAgo(90),
    });

    const adminRoleNoticeId = await insertNotification(client, {
      key: "sent-admin-role",
      title: "Thông báo riêng cho admin",
      body: "Demo target theo role ADMIN, dùng để kiểm tra bell trong admin header.",
      linkUrl: "/admin/orders",
      audienceType: "role",
      roles: ["ADMIN"],
      createdByUserId: admin.id,
      status: "sent",
      createdAt: minutesAgo(70),
    });

    await insertNotification(client, {
      key: "sent-customer-affiliate-role",
      title: "Ưu đãi cho khách hàng và affiliate",
      body: "Demo target nhiều role: CUSTOMER + AFFILIATE.",
      linkUrl: "/customer/affiliate",
      audienceType: "role",
      roles: ["CUSTOMER", "AFFILIATE"],
      createdByUserId: admin.id,
      status: "sent",
      createdAt: minutesAgo(55),
    });

    const vendorNoticeId = await insertNotification(client, {
      key: "sent-vendor-role",
      title: "Cập nhật quy trình vendor",
      body: "Demo target role VENDOR, hiển thị trong bell ở partner portal.",
      linkUrl: "/partner/orders",
      audienceType: "role",
      roles: ["VENDOR"],
      createdByUserId: admin.id,
      status: "sent",
      createdAt: minutesAgo(40),
    });

    await insertNotification(client, {
      key: "sent-personal-customer",
      title: "Thông báo cá nhân cho seed-customer",
      body: "Demo target cá nhân, chỉ account được chọn mới nhìn thấy.",
      linkUrl: "/customer/orders",
      audienceType: "users",
      userIds: [customer.id],
      createdByUserId: admin.id,
      status: "sent",
      createdAt: minutesAgo(25),
    });

    await insertNotification(client, {
      key: "scheduled-all",
      title: "Lịch gửi toàn hệ thống",
      body: "Demo thông báo lên lịch cho toàn bộ user, sẽ chuyển sang đã gửi khi API notification được gọi sau thời điểm hẹn.",
      linkUrl: "/customer/dashboard",
      audienceType: "all",
      createdByUserId: admin.id,
      status: "scheduled",
      scheduledAt: minutesFromNow(30),
      createdAt: minutesAgo(10),
    });

    await insertNotification(client, {
      key: "scheduled-vendor",
      title: "Lịch nhắc vendor kiểm tra đơn",
      body: "Demo thông báo lên lịch theo role VENDOR.",
      linkUrl: "/partner/orders",
      audienceType: "role",
      roles: ["VENDOR"],
      createdByUserId: admin.id,
      status: "scheduled",
      scheduledAt: minutesFromNow(120),
      createdAt: minutesAgo(8),
    });

    await insertNotification(client, {
      key: "draft-personal-affiliate",
      title: "Bản nháp cá nhân affiliate",
      body: "Demo trạng thái draft trong màn quản trị, không hiển thị ở bell người nhận.",
      linkUrl: "/customer/affiliate",
      audienceType: "users",
      userIds: [affiliate.id],
      createdByUserId: admin.id,
      status: "draft",
      createdAt: minutesAgo(6),
    });

    await insertNotification(client, {
      key: "archived-all",
      title: "Thông báo đã lưu trữ",
      body: "Demo trạng thái archived trong danh sách quản trị.",
      linkUrl: "/admin/notifications",
      audienceType: "all",
      createdByUserId: admin.id,
      status: "archived",
      createdAt: minutesAgo(4),
    });

    await client.query(
      `
        INSERT INTO notification_user_states (notification_id, user_id, read_at, updated_at)
        VALUES
          ($1, $2, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
          ($3, $4, NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '35 minutes'),
          ($5, $6, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
        ON CONFLICT (notification_id, user_id)
        DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = EXCLUDED.updated_at
      `,
      [allNoticeId, admin.id, adminRoleNoticeId, admin.id, vendorNoticeId, vendor.id]
    );

    await client.query("COMMIT");
    console.log("Seeded notification demo data.");
    console.log(`Demo password for seeded users: ${PASSWORD}`);
    console.log("Users: seed-admin, seed-customer, seed-affiliate, seed-vendor");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
