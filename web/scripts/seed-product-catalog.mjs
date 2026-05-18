import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const rootDir = path.resolve(process.cwd(), "..");
const seedDataPath = path.join(process.cwd(), "src/lib/product-seed-data.json");
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

function getSiteDefaults(product) {
  const siteDefaults = product.config?.siteDefaults;
  return siteDefaults && typeof siteDefaults === "object" ? siteDefaults : {};
}

function getGeneralProductConfig(product) {
  const generalProduct = product.config?.generalProduct;
  return generalProduct && typeof generalProduct === "object" ? generalProduct : {};
}

async function syncProductTypeDetails(client, productId, product) {
  await client.query("DELETE FROM coded_template_products WHERE product_id = $1", [productId]);
  await client.query("DELETE FROM builder_products WHERE product_id = $1", [productId]);
  await client.query("DELETE FROM general_products WHERE product_id = $1", [productId]);

  if (product.productType === "coded_template") {
    await client.query(
      `
        INSERT INTO coded_template_products (product_id, template_key, site_defaults)
        VALUES ($1, $2, $3::jsonb)
      `,
      [productId, product.templateKey, JSON.stringify(getSiteDefaults(product))]
    );
  }

  if (product.productType === "builder") {
    await client.query(
      `
        INSERT INTO builder_products (product_id, template_key, site_defaults)
        VALUES ($1, $2, $3::jsonb)
      `,
      [productId, product.templateKey, JSON.stringify(getSiteDefaults(product))]
    );
  }

  if (product.productType === "general_product") {
    const generalProduct = getGeneralProductConfig(product);
    await client.query(
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
        product.fulfillmentType ?? "physical",
        product.trackInventory ?? false,
        product.stockQuantity ?? 0,
        product.lowStockThreshold ?? 0,
        product.allowBackorder ?? false,
        generalProduct.costPrice ?? 0,
        generalProduct.vendorSku ?? "",
        generalProduct.ownerType === "vendor" ? "vendor" : "internal",
      ]
    );
  }
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");

    const deletedProducts = await client.query("DELETE FROM products");
    const deletedCategories = await client.query("DELETE FROM product_categories");

    for (const category of seedCatalog.categories) {
      await client.query(
        `
          INSERT INTO product_categories (slug, name, description, status)
          VALUES ($1, $2, $3, $4)
        `,
        [category.slug, category.name, category.description, category.status]
      );
    }

    for (const product of seedCatalog.products) {
      const created = await client.query(
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
            $14::jsonb
          FROM product_categories categories
          WHERE categories.slug = $15
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
          JSON.stringify(product.config ?? {}),
          product.categorySlug,
        ]
      );

      const productId = created.rows[0]?.id;
      if (!productId) {
        throw new Error(`Failed to seed product ${product.slug}`);
      }

      await syncProductTypeDetails(client, productId, product);
    }

    await client.query("COMMIT");

    console.log(
      `Re-seeded product catalog. Deleted ${deletedProducts.rowCount ?? 0} products and ${
        deletedCategories.rowCount ?? 0
      } categories, then created ${seedCatalog.products.length} products in ${seedCatalog.categories.length} categories.`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to re-seed product catalog:", error);
  process.exit(1);
});
