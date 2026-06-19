import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

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

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, ".env.local"));

const client = new Client({ connectionString: getDatabaseUrl() });
await client.connect();

try {
  await client.query(`
    ALTER TABLE content_comments
    ADD COLUMN IF NOT EXISTS rating INT NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS has_image BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS has_video BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reply_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS liked_count INT NOT NULL DEFAULT 0
  `);

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'content_comments_rating_check'
      ) THEN
        ALTER TABLE content_comments
        ADD CONSTRAINT content_comments_rating_check CHECK (rating BETWEEN 1 AND 5);
      END IF;
    END
    $$;
  `);

  console.log("Review columns ready.");
} finally {
  await client.end();
}
