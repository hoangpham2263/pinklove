import { readFileSync, existsSync } from "node:fs";
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

const categories = [
  {
    slug: "coded-templates",
    name: "Mẫu thiệp code sẵn",
    description: "Catalog template cưới hoàn thiện với preview dài như landing page.",
    status: "published",
  },
  {
    slug: "builder-templates",
    name: "Mẫu thiệp tự chỉnh sửa",
    description: "Catalog starter cho builder với preview dài để xem flow toàn trang.",
    status: "published",
  },
];

const products = [
  {
    categorySlug: "coded-templates",
    slug: "mau-thiep-cuoi-aurora-veil",
    name: "Mẫu thiệp cưới Aurora Veil",
    excerpt: "Mẫu landing page cưới tông kem hồng với preview dài toàn trang để hover cuộn dọc.",
    description: "Template code sẵn với bố cục hero, câu chuyện, gallery và RSVP theo nhịp đọc mềm mại.",
    productType: "coded_template",
    templateKey: "romantic_bloom",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-01.png",
    price: "1190000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        brideName: "An",
        groomName: "Khang",
        heroSubtitle: "Trân trọng mời bạn cùng chúng tôi bước vào ngày hạnh phúc nhất.",
        eventDate: "18.01.2027",
        venue: "White Palace, TP.HCM",
      },
    },
  },
  {
    categorySlug: "coded-templates",
    slug: "mau-thiep-cuoi-golden-aisle",
    name: "Mẫu thiệp cưới Golden Aisle",
    excerpt: "Phong cách sang trọng với preview dài như một website cưới đầy đủ section.",
    description: "Template code sẵn cho lễ cưới trang nhã, nhấn vào hero lớn, timeline và gallery dọc.",
    productType: "coded_template",
    templateKey: "classic_garden",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-02.png",
    price: "1390000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        brideName: "Thao",
        groomName: "Long",
        heroSubtitle: "Một lời mời ấm áp đến những người chúng tôi yêu quý nhất.",
        eventDate: "05.03.2027",
        venue: "Park Hyatt Saigon",
      },
    },
  },
  {
    categorySlug: "coded-templates",
    slug: "mau-thiep-cuoi-blush-sonata",
    name: "Mẫu thiệp cưới Blush Sonata",
    excerpt: "Bản phối pastel và typography mềm với ảnh preview dọc rất dài để hover scroll mượt hơn.",
    description: "Template code sẵn tối ưu cho cô dâu chú rể muốn landing page nữ tính và rõ thông tin.",
    productType: "coded_template",
    templateKey: "romantic_bloom",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-03.png",
    price: "1090000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        brideName: "Linh",
        groomName: "Hieu",
        heroSubtitle: "Mời bạn cùng chúng tôi ghi nhớ một ngày thật dịu dàng và đáng nhớ.",
        eventDate: "28.03.2027",
        venue: "Mia Saigon, Thu Duc",
      },
    },
  },
  {
    categorySlug: "coded-templates",
    slug: "mau-thiep-cuoi-moonlight-garden",
    name: "Mẫu thiệp cưới Moonlight Garden",
    excerpt: "Mẫu thiệp cưới đêm vườn ánh trăng với preview website dài, rõ từng section nội dung.",
    description: "Template code sẵn phù hợp với lễ cưới buổi tối và phần gallery ảnh chân dung dài.",
    productType: "coded_template",
    templateKey: "classic_garden",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-01.png",
    price: "1490000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        brideName: "Vy",
        groomName: "Minh",
        heroSubtitle: "Xin mời bạn đến chung vui cùng chúng tôi dưới những ánh đèn dịu nhẹ.",
        eventDate: "12.06.2027",
        venue: "The Reverie Saigon",
      },
    },
  },
  {
    categorySlug: "coded-templates",
    slug: "mau-thiep-cuoi-pearl-manor",
    name: "Mẫu thiệp cưới Pearl Manor",
    excerpt: "Bố cục tinh gọn, ảnh dài kiểu editorial và nhịp cuộn phù hợp card gallery hover-scroll.",
    description: "Template code sẵn cho cặp đôi thích phong cách tối giản sang trọng và câu chuyện ngắn gọn.",
    productType: "coded_template",
    templateKey: "classic_garden",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-02.png",
    price: "1290000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        brideName: "Nhi",
        groomName: "Phat",
        heroSubtitle: "Rất mong được gặp bạn trong ngày lễ thành hôn của chúng tôi.",
        eventDate: "21.08.2027",
        venue: "Sheraton Saigon Grand Opera",
      },
    },
  },
  {
    categorySlug: "coded-templates",
    slug: "mau-thiep-cuoi-linen-vows",
    name: "Mẫu thiệp cưới Linen Vows",
    excerpt: "Tông linen sáng, preview website rất dài và khoảng trắng đẹp cho hiệu ứng cuộn dọc.",
    description: "Template code sẵn dành cho cặp đôi muốn một landing page nhẹ, tinh tế và dễ đọc trên mobile.",
    productType: "coded_template",
    templateKey: "romantic_bloom",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-03.png",
    price: "990000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        brideName: "Ha",
        groomName: "Tung",
        heroSubtitle: "Một trang thiệp tinh giản để gửi đi lời mời chân thành nhất của chúng tôi.",
        eventDate: "03.10.2027",
        venue: "An Lam Retreats Saigon River",
      },
    },
  },
  {
    categorySlug: "builder-templates",
    slug: "mau-thiep-cuoi-editorial-story",
    name: "Mẫu thiệp cưới Editorial Story",
    excerpt: "Starter builder theo phong cách tạp chí với preview dài như landing page nhiều section.",
    description: "Builder starter thiên về kể chuyện, phù hợp với flow hero lớn, story, timeline và gallery.",
    productType: "builder_template",
    templateKey: "freeform_sections",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-01.png",
    price: "390000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        heroTitle: "Editorial wedding story",
        sectionOneTitle: "Our cover story",
      },
    },
  },
  {
    categorySlug: "builder-templates",
    slug: "mau-thiep-cuoi-floral-scroll",
    name: "Mẫu thiệp cưới Floral Scroll",
    excerpt: "Builder mềm mại với ảnh preview dài liên tục để người xem cảm giác như đang xem một website thật.",
    description: "Starter builder tông hoa lá, dễ kéo thành flow romantic với nhiều section ảnh dọc.",
    productType: "builder_template",
    templateKey: "freeform_sections",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-03.png",
    price: "420000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        heroTitle: "Floral wedding scroll",
        sectionOneTitle: "Hero bloom",
      },
    },
  },
  {
    categorySlug: "builder-templates",
    slug: "mau-thiep-cuoi-timeline-ceremony",
    name: "Mẫu thiệp cưới Timeline Ceremony",
    excerpt: "Builder preview dạng timeline dọc dài, rất hợp hiệu ứng hover scroll top-to-bottom.",
    description: "Starter builder tập trung vào lịch trình, tiện cho lễ cưới có nhiều cột mốc và CTA RSVP.",
    productType: "builder_template",
    templateKey: "freeform_sections",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-02.png",
    price: "350000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        heroTitle: "Timeline ceremony",
        sectionOneTitle: "Wedding schedule",
      },
    },
  },
  {
    categorySlug: "builder-templates",
    slug: "mau-thiep-cuoi-minimal-portrait",
    name: "Mẫu thiệp cưới Minimal Portrait",
    excerpt: "Bản builder tối giản với thumbnail dài kiểu editorial portrait để hover lướt mượt.",
    description: "Starter builder sạch và gọn, ưu tiên ảnh lớn, text ít và nhịp section thoáng.",
    productType: "builder_template",
    templateKey: "freeform_sections",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-03.png",
    price: "290000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        heroTitle: "Minimal portrait",
        sectionOneTitle: "Essential details",
      },
    },
  },
  {
    categorySlug: "builder-templates",
    slug: "mau-thiep-cuoi-velvet-chapel",
    name: "Mẫu thiệp cưới Velvet Chapel",
    excerpt: "Builder tone trầm sang với screenshot dọc dài như một homepage cưới hoàn chỉnh.",
    description: "Starter builder dành cho giao diện trong nhà, nhấn typography mạnh và section gallery lớn.",
    productType: "builder_template",
    templateKey: "freeform_sections",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-01.png",
    price: "450000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        heroTitle: "Velvet chapel",
        sectionOneTitle: "Opening scene",
      },
    },
  },
  {
    categorySlug: "builder-templates",
    slug: "mau-thiep-cuoi-ivory-atelier",
    name: "Mẫu thiệp cưới Ivory Atelier",
    excerpt: "Builder sáng, thoáng và có thumbnail preview rất dài để thể hiện rõ flow toàn trang.",
    description: "Starter builder theo hướng studio hiện đại với các section nhẹ, gallery và thông tin RSVP.",
    productType: "builder_template",
    templateKey: "freeform_sections",
    thumbnailUrl: "/uploads/seed-products/seed-red-wedding-web-02.png",
    price: "320000",
    fulfillmentType: "digital",
    config: {
      siteDefaults: {
        heroTitle: "Ivory atelier",
        sectionOneTitle: "Welcome screen",
      },
    },
  },
];

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM products");

    for (const category of categories) {
      await client.query(
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

    for (const product of products) {
      await client.query(
        `
          INSERT INTO products (
            slug, category_id, name, excerpt, description, status, product_type, template_key, thumbnail_url, price, fulfillment_type, config
          )
          SELECT $1, categories.id, $2, $3, $4, 'published', $5, $6, $7, $8, $9, $10::jsonb
          FROM product_categories categories
          WHERE categories.slug = $11
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
          JSON.stringify(product.config),
          product.categorySlug,
        ]
      );
    }

    await client.query("COMMIT");

    const result = await client.query("SELECT COUNT(*)::int AS count FROM products");
    console.log(`Re-seeded product catalog. Total products: ${result.rows[0]?.count ?? 0}`);
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
