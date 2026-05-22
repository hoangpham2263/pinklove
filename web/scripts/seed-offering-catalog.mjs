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

function getGeneralOfferingConfig(offering) {
  const generalOffering = offering.config?.generalOffering;
  return generalOffering && typeof generalOffering === "object" ? generalOffering : {};
}

async function syncOfferingTypeDetails(client, offeringId, offering) {
  await client.query("DELETE FROM coded_template_offerings WHERE offering_id = $1", [offeringId]);
  await client.query("DELETE FROM builder_offerings WHERE offering_id = $1", [offeringId]);
  await client.query("DELETE FROM general_offerings WHERE offering_id = $1", [offeringId]);

  if (offering.offeringType === "coded_template") {
    await client.query(
      `
        INSERT INTO coded_template_offerings (offering_id, template_key, site_defaults)
        VALUES ($1, $2, $3::jsonb)
      `,
      [offeringId, offering.templateKey, JSON.stringify(getSiteDefaults(offering))]
    );
  }

  if (offering.offeringType === "builder") {
    await client.query(
      `
        INSERT INTO builder_offerings (offering_id, template_key, site_defaults)
        VALUES ($1, $2, $3::jsonb)
      `,
      [offeringId, offering.templateKey, JSON.stringify(getSiteDefaults(offering))]
    );
  }

  if (offering.offeringType === "general_offering") {
    const generalOffering = getGeneralOfferingConfig(offering);
    await client.query(
      `
        INSERT INTO general_offerings (
          offering_id,
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
        offeringId,
        offering.fulfillmentType ?? "physical",
        offering.trackInventory ?? false,
        offering.stockQuantity ?? 0,
        offering.lowStockThreshold ?? 0,
        offering.allowBackorder ?? false,
        generalOffering.costPrice ?? 0,
        generalOffering.vendorSku ?? "",
        generalOffering.ownerType === "vendor" ? "vendor" : "internal",
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
            $14::jsonb
          FROM offering_categories categories
          WHERE categories.slug = $15
          RETURNING id
        `,
        [
          offering.slug,
          offering.name,
          offering.excerpt,
          offering.description,
          offering.offeringType,
          offering.templateKey,
          offering.thumbnailUrl,
          offering.price,
          offering.fulfillmentType,
          offering.trackInventory ?? false,
          offering.stockQuantity ?? 0,
          offering.lowStockThreshold ?? 0,
          offering.allowBackorder ?? false,
          JSON.stringify(offering.config ?? {}),
          offering.categorySlug,
        ]
      );

      const offeringId = created.rows[0]?.id;
      if (!offeringId) {
        throw new Error(`Failed to seed offering ${offering.slug}`);
      }

      await syncOfferingTypeDetails(client, offeringId, offering);
    }

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
