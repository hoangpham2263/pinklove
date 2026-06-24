import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { REGISTERED_OFFERING_TYPES as registeredOfferingTypes } from "../src/features/offerings/registered-offering-types.mjs";

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

function humanizeSlug(value) {
  return String(value || "")
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deriveOfferingTypes(seedCatalog) {
  const categoriesBySlug = new Map(seedCatalog.categories.map((category) => [category.slug, category]));
  const byKey = new Map(registeredOfferingTypes.map((type) => [type.key, type]));
  const registeredTypeKeys = new Set(byKey.keys());

  for (const offering of seedCatalog.offerings) {
    if (offering.offeringType === "digital_template") {
      continue;
    }
    if (!registeredTypeKeys.has(offering.offeringType)) {
      throw new Error(`Seed offering ${offering.slug} uses unregistered offering type ${offering.offeringType}`);
    }

    const category = categoriesBySlug.get(offering.categorySlug);
    const current = byKey.get(offering.offeringType);
    const supportsInventory = Boolean(offering.trackInventory || current?.supportsInventory);
    const supportsProviderSupply = Boolean(current?.supportsProviderSupply || offering.fulfillmentType === "service" || supportsInventory);
    const label = current?.label || category?.name || humanizeSlug(offering.offeringType);

    byKey.set(offering.offeringType, {
      key: offering.offeringType,
      label,
      description: current?.description || category?.description || `${label} trên PinkLove.`,
      fulfillmentType: current?.fulfillmentType || offering.fulfillmentType || "digital",
      templateKey: current?.templateKey || offering.templateKey || offering.offeringType,
      templateEngine: current?.templateEngine || offering.templateEngine || "",
      templateMode: current?.templateMode || offering.templateMode || "",
      supportsInventory,
      supportsProviderSupply,
    });
  }

  return Array.from(byKey.values());
}

async function syncOfferingTypes(client) {
  const offeringTypes = deriveOfferingTypes(seedCatalog);

  for (const type of offeringTypes) {
    await client.query(
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

  const offeringTypeKeys = offeringTypes.map((type) => type.key);
  await client.query(
    "DELETE FROM offerings WHERE offering_type <> 'digital_template' AND NOT (offering_type = ANY($1::text[]))",
    [offeringTypeKeys]
  );
  await client.query(
    "DELETE FROM offering_types WHERE NOT (key = ANY($1::text[]))",
    [offeringTypeKeys]
  );
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

  const shouldStorePhysicalDetails =
    offering.offeringType !== "digital_template" &&
    (offering.fulfillmentType === "physical" ||
      offering.trackInventory ||
      offering.allowProviderSupply);

  if (shouldStorePhysicalDetails) {
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
          provider_type,
          provider_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NULL, NULL)
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
      ]
    );
  }
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");

    await syncOfferingTypes(client);

    for (const category of seedCatalog.categories) {
      await client.query(
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

    for (const offering of seedCatalog.offerings) {
      const templateEngine = offering.templateEngine || "";
      const templateMode = offering.templateMode || (templateEngine === "builder" ? "editable" : "fixed");
      const saved = await client.query(
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

      const offeringId = saved.rows[0]?.id;
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
      `Synced offering catalog. Upserted ${seedCatalog.offerings.length} offerings in ${seedCatalog.categories.length} categories.`
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
