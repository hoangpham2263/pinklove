import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const rootDir = path.resolve(process.cwd(), "..");
const seedDataPath = path.join(process.cwd(), "src/lib/offering-seed-data.json");
const seedCatalog = JSON.parse(readFileSync(seedDataPath, "utf8"));

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

function getSiteDefaults(offering) {
  const siteDefaults = offering.config?.siteDefaults;
  return siteDefaults && typeof siteDefaults === "object" ? siteDefaults : {};
}

function getOfferingConfig(offering) {
  const config = offering.config && typeof offering.config === "object" ? { ...offering.config } : {};
  delete config.inventory;
  delete config.pricing_rules;
  delete config.permissions;
  delete config.analytics;
  delete config.booking_logic;
  delete config.relational_data;
  delete config.siteDefaults;
  delete config.generalOffering;
  return config;
}

async function syncOfferingTypeDetails(client, offeringId, offering) {
  await client.query("DELETE FROM digital_template_offerings WHERE offering_id = $1", [offeringId]);
  await client.query("DELETE FROM physical_offerings WHERE offering_id = $1", [offeringId]);

  if (offering.offeringType === "digital_template") {
    const templateEngine = offering.templateEngine || "coded";
    const templateMode = offering.templateMode || (templateEngine === "builder" ? "editable" : "fixed");
    await client.query(
      `
        INSERT INTO digital_template_offerings (offering_id, template_key, template_engine, template_mode, site_defaults)
        VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [offeringId, offering.templateKey, templateEngine, templateMode, JSON.stringify(getSiteDefaults(offering))]
    );
  }

  if (offering.offeringType === "physical_product") {
    await client.query(
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
          owner_type,
          provider_type,
          provider_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9, NULL, NULL)
      `,
      [
        offeringId,
        offering.fulfillmentType ?? "physical",
        offering.trackInventory ?? false,
        offering.stockQuantity ?? 0,
        offering.lowStockThreshold ?? 0,
        offering.allowBackorder ?? false,
        offering.costPrice ?? 0,
        offering.providerSku ?? "",
        offering.ownerType === "provider" ? "provider" : "internal",
      ]
    );
  }
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");

    const deletedOfferings = await client.query("DELETE FROM offerings");
    const deletedCategories = await client.query("DELETE FROM offering_categories");

    for (const category of seedCatalog.categories) {
      await client.query(
        `
          INSERT INTO offering_categories (slug, name, description, status)
          VALUES ($1, $2, $3, $4)
        `,
        [category.slug, category.name, category.description, category.status]
      );
    }

    for (const offering of seedCatalog.offerings) {
      const templateEngine = offering.templateEngine || "";
      const templateMode = offering.templateMode || (templateEngine === "builder" ? "editable" : "fixed");
      const created = await client.query(
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
            $16::jsonb
          FROM offering_categories categories
          WHERE categories.slug = $17
          RETURNING id
        `,
        [
          offering.slug,
          offering.name,
          offering.excerpt,
          offering.description,
          offering.offeringType,
          offering.templateKey,
          templateEngine,
          templateMode,
          offering.thumbnailUrl,
          offering.price,
          offering.fulfillmentType,
          offering.trackInventory ?? false,
          offering.stockQuantity ?? 0,
          offering.lowStockThreshold ?? 0,
          offering.allowBackorder ?? false,
          JSON.stringify(getOfferingConfig(offering)),
          offering.categorySlug,
        ]
      );

      const offeringId = created.rows[0]?.id;
      if (!offeringId) {
        throw new Error(`Failed to seed offering ${offering.slug}`);
      }

      await syncOfferingTypeDetails(client, offeringId, offering);
    }

    await client.query(`
      INSERT INTO offering_search_documents (
        offering_id, search_text, filter_json, embedding
      )
      SELECT
        offering.id,
        CONCAT_WS(
          ' ',
          offering.name,
          offering.slug,
          offering.excerpt,
          offering.description,
          category.name,
          offering.offering_type,
          offering.template_key,
          offering.template_engine,
          offering.config::text
        ),
        jsonb_build_object(
          'status', offering.status,
          'offeringType', offering.offering_type,
          'fulfillmentType', offering.fulfillment_type,
          'categoryId', offering.category_id,
          'categorySlug', category.slug,
          'price', offering.price,
          'templateEngine', NULLIF(offering.template_engine, ''),
          'templateMode', NULLIF(offering.template_mode, ''),
          'customFields', COALESCE(offering.config -> 'customFields', '{}'::jsonb)
        ),
        NULL
      FROM offerings offering
      LEFT JOIN offering_categories category ON category.id = offering.category_id
      ON CONFLICT (offering_id) DO UPDATE
      SET
        search_text = EXCLUDED.search_text,
        filter_json = EXCLUDED.filter_json,
        updated_at = NOW()
    `);

    await client.query("COMMIT");

    console.log(
      `Re-seeded offering catalog. Deleted ${deletedOfferings.rowCount ?? 0} offerings and ${
        deletedCategories.rowCount ?? 0
      } categories, then created ${seedCatalog.offerings.length} offerings in ${seedCatalog.categories.length} categories.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to re-seed offering catalog:", error);
  process.exit(1);
});
