import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { buildOfferingPath } from "../src/lib/public-route-config.mjs";

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

const sampleComments = [
  {
    authorName: "Ngọc Anh",
    authorEmail: "ngocanh@example.local",
    rating: 5,
    hasImage: true,
    hasVideo: false,
    replyCount: 2,
    likedCount: 0,
    content: "Mẫu rất đẹp, mở trên điện thoại nhìn gọn và sang. Mình thích phần thông tin địa điểm rõ ràng, khách lớn tuổi cũng xem dễ.",
  },
  {
    authorName: "Minh Quân",
    authorEmail: "minhquan@example.local",
    rating: 5,
    hasImage: false,
    hasVideo: false,
    replyCount: 0,
    likedCount: 0,
    content: "Team hỗ trợ đổi nội dung nhanh. Thiệp online gửi link cho khách tiện hơn nhiều so với file ảnh rời.",
  },
  {
    authorName: "Hoàng Vy",
    authorEmail: "vyhoang@example.local",
    rating: 5,
    hasImage: false,
    hasVideo: true,
    replyCount: 0,
    likedCount: 0,
    content: "Màu sắc đúng concept tiệc, phần câu chuyện và gallery lên rất ổn. Nếu có thêm mục RSVP thì càng tiện.",
  },
];

const auroraComments = [
  ...sampleComments,
  {
    authorName: "Bảo Trâm",
    authorEmail: "baotram@example.local",
    rating: 5,
    hasImage: true,
    hasVideo: false,
    replyCount: 1,
    likedCount: 2,
    content: "Mẫu Aurora Veil nhìn rất sang, phần ảnh đại diện và thông tin tiệc lên đẹp trên iPhone. Gia đình mình xem đều khen dễ đọc.",
  },
  {
    authorName: "Gia Hân",
    authorEmail: "giahan@example.local",
    rating: 5,
    hasImage: false,
    hasVideo: false,
    replyCount: 0,
    likedCount: 1,
    content: "Mình thích tone màu và cách bố cục câu chuyện. Chỉnh tên, ngày cưới và địa điểm rất nhanh.",
  },
  {
    authorName: "Quốc Bảo",
    authorEmail: "quocbao@example.local",
    rating: 5,
    hasImage: false,
    hasVideo: true,
    replyCount: 2,
    likedCount: 4,
    content: "Gửi link cho khách tiện hơn gửi ảnh nhiều lần. Phần hiển thị trên điện thoại ổn, không bị rối.",
  },
  {
    authorName: "Mai Linh",
    authorEmail: "mailinh@example.local",
    rating: 5,
    hasImage: true,
    hasVideo: false,
    replyCount: 0,
    likedCount: 0,
    content: "Template hợp concept tiệc trắng hồng của mình. Màu primary và typography nhìn mềm, không quá sến.",
  },
  {
    authorName: "Tuấn Kiệt",
    authorEmail: "tuankiet@example.local",
    rating: 4,
    hasImage: false,
    hasVideo: false,
    replyCount: 1,
    likedCount: 1,
    content: "Thiệp đẹp và gọn. Mình muốn có thêm vài lựa chọn section timeline, còn tổng thể rất ổn.",
  },
  {
    authorName: "Phương Nhi",
    authorEmail: "phuongnhi@example.local",
    rating: 5,
    hasImage: false,
    hasVideo: false,
    replyCount: 0,
    likedCount: 2,
    content: "Dùng thử thấy phần preview rõ, nội dung mặc định dễ thay. Khách mời mở link nhanh.",
  },
  {
    authorName: "Đức Anh",
    authorEmail: "ducanh@example.local",
    rating: 5,
    hasImage: false,
    hasVideo: false,
    replyCount: 0,
    likedCount: 0,
    content: "Mẫu này hợp tiệc ballroom, không cần chỉnh quá nhiều vẫn đủ trang trọng.",
  },
  {
    authorName: "Khánh Vy",
    authorEmail: "khanhvy@example.local",
    rating: 5,
    hasImage: true,
    hasVideo: false,
    replyCount: 1,
    likedCount: 3,
    content: "Phần câu chuyện và gallery hiển thị đẹp. Mình thích nhất là bố cục thoáng và nút CTA rõ.",
  },
  {
    authorName: "Minh Thư",
    authorEmail: "minhthu@example.local",
    rating: 4,
    hasImage: false,
    hasVideo: false,
    replyCount: 0,
    likedCount: 0,
    content: "Mẫu ổn, dễ đọc. Nếu có thêm lựa chọn font chữ trong lúc tùy chỉnh thì sẽ tốt hơn.",
  },
];

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, ".env.local"));

const client = new Client({ connectionString: getDatabaseUrl() });
await client.connect();

try {
  await client.query("BEGIN");

  const offerings = await client.query(`
    SELECT offerings.id, offerings.slug, offerings.name, offerings.offering_type, categories.slug AS category_slug
    FROM offerings
    LEFT JOIN offering_categories categories ON categories.id = offerings.category_id
    WHERE offerings.status = 'published'
    ORDER BY
      CASE WHEN offering_type = 'digital_template' THEN 0 ELSE 1 END,
      name
    LIMIT 8
  `);

  await client.query(`
    DELETE FROM content_comments
    WHERE target_type = 'offering'
      AND author_email LIKE '%@example.local'
  `);

  let inserted = 0;
  for (const [offeringIndex, offering] of offerings.rows.entries()) {
    const comments = offering.slug === "mau-thiep-cuoi-aurora-veil"
      ? auroraComments
      : offering.offering_type === "digital_template"
        ? sampleComments
        : sampleComments.slice(0, 2);
    const targetUrl = buildOfferingPath(offering.slug, offering.category_slug);

    for (const [commentIndex, comment] of comments.entries()) {
      await client.query(
        `
          INSERT INTO content_comments (
            target_type,
            target_id,
            target_slug,
            target_title,
            target_url,
            author_name,
            author_email,
            content,
            rating,
            has_image,
            has_video,
            reply_count,
            liked_count,
            status,
            approved_at,
            created_at,
            updated_at
          )
          VALUES (
            'offering',
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            'approved',
            NOW(),
            NOW() - ($13 || ' days')::interval,
            NOW() - ($13 || ' days')::interval
          )
        `,
        [
          offering.id,
          offering.slug,
          offering.name,
          targetUrl,
          comment.authorName,
          comment.authorEmail,
          comment.content,
          comment.rating,
          comment.hasImage,
          comment.hasVideo,
          comment.replyCount,
          comment.likedCount,
          offeringIndex + commentIndex + 1,
        ]
      );
      inserted += 1;
    }
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({
    inserted,
    offerings: offerings.rows.map((offering) => ({
      slug: offering.slug,
      name: offering.name,
      type: offering.offering_type,
    })),
  }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
