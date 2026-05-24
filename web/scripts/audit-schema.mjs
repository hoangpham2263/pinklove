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

async function scalar(client, sql, values = []) {
  const result = await client.query(sql, values);
  return result.rows[0] ? Object.values(result.rows[0])[0] : undefined;
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
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
      "seo_metadata",
      "seo_indexing_rules",
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

    const seedExpectations = [
      ["provider_types", 8],
      ["template_engines", 6],
      ["offering_statuses", 5],
      ["media_target_types", 7],
      ["media_roles", 8],
      ["domain_event_types", 11],
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
    const expectedSystemOfferingTypes = [
      "bridal_makeup",
      "digital_template",
      "physical_product",
      "wedding_decoration",
      "wedding_gift",
      "wedding_photo",
      "wedding_planner",
      "wedding_video",
    ];
    const actualSystemOfferingTypes = systemOfferingTypes.rows.map((row) => row.key);
    assert(
      JSON.stringify(actualSystemOfferingTypes) === JSON.stringify(expectedSystemOfferingTypes),
      `System offering types must be ${expectedSystemOfferingTypes.join(", ")}; found ${actualSystemOfferingTypes.join(", ")}`
    );

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
