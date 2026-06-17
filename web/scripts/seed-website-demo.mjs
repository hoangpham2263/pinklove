import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "12313";
const BASE_URL = process.env.SEED_BASE_URL ?? "";
const SKIP_USERS = process.argv.includes("--no-users");
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

function withBaseUrl(path) {
  return BASE_URL ? `${BASE_URL}${path}` : path;
}

async function fetchRow(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}

async function fetchRows(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function upsertUser(client, input) {
  const user = await fetchRow(
    client,
    `
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
      RETURNING id, username, role
    `,
    [input.username, hashPassword(PASSWORD), input.role]
  );

  await client.query(
    `
      INSERT INTO user_profiles (user_id, display_name, full_name, phone, provider_portal_slug, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        provider_portal_slug = EXCLUDED.provider_portal_slug,
        bio = EXCLUDED.bio,
        updated_at = NOW()
    `,
    [
      user.id,
      input.displayName ?? null,
      input.fullName ?? null,
      input.phone ?? null,
      input.providerPortalSlug ?? null,
      input.bio ?? null,
    ]
  );

  return user;
}

async function seedManagedPages(client) {
  const pageSeeds = [
    {
      slug: "home",
      title: "PinkLove | Thiệp cưới online, sản phẩm cưới và dịch vụ cưới",
      excerpt:
        "Nền tảng giúp cặp đôi chọn mẫu thiệp, tạo website cưới, đặt sản phẩm cưới và kết nối provider trong một hành trình rõ ràng.",
      status: "published",
      customFields: {
        bannerTopLine: "PinkLove Wedding Platform",
        bannerLine1Prefix: "Tạo",
        bannerLine1Rotating: "thiệp cưới online\nwebsite cưới\nthiệp giấy đồng bộ\nbrief dịch vụ cưới",
        bannerLine1Suffix: "cho ngày trọng đại cùng",
        bannerLine2: "PinkLove",
        bannerShortDescription: "Từ lời mời đầu tiên đến ngày cưới, mọi thứ được gom vào một hành trình dễ kiểm soát.",
        bannerDescription:
          "PinkLove giúp cặp đôi chọn mẫu thiệp, quản lý lời mời, đặt sản phẩm cưới và kết nối provider phù hợp. Nội dung seed này dùng để demo trang chủ bằng tiếng Việt và có thể chạy lại khi cần dựng môi trường mới.",
        heroTitle: "Thiệp cưới online, sản phẩm cưới và dịch vụ cưới trong một nơi",
        heroDescription:
          "PinkLove giúp cặp đôi bắt đầu từ mẫu thiệp, mở rộng sang website cưới, sản phẩm cưới và các dịch vụ cần provider thực hiện.",
        heroButtonText: "Xem mẫu thiệp",
        heroButtonLink: "/mau-thiep",
        aboutTitle: "Một nơi để bắt đầu toàn bộ hành trình cưới",
        aboutDescription:
          "Trang chủ PinkLove nên cho khách hiểu nhanh ba việc chính: chọn gu thẩm mỹ, tạo lời mời online và đặt các hạng mục cưới có thể triển khai thật. Seed Home này ưu tiên nội dung rõ, dễ chỉnh trong admin và bám đúng các field frontend đang render.",
        aboutImage: "/uploads/seed-offerings/seed-red-wedding-web-01.png",
        aboutText1:
          "Cặp đôi không cần đi qua quá nhiều trang rời rạc để hiểu PinkLove làm gì. Trang chủ dẫn họ từ cảm hứng thiệp cưới đến các bước thực tế như RSVP, sản phẩm cưới, provider và công cụ chuẩn bị.",
        aboutText2:
          "Admin vẫn quản trị nội dung qua managed page. Các section quan trọng được seed sẵn để đội vận hành có mẫu chuẩn khi dựng lại dữ liệu demo hoặc setup môi trường mới.",
        aboutText3:
          "Định hướng nội dung là nền tảng cưới có commerce và provider, không chỉ là một thư viện mẫu thiệp đơn lẻ.",
        aboutItems: [
          {
            label: "01",
            content: "Chọn mẫu thiệp hoặc sản phẩm cưới theo phong cách, màu sắc và nhu cầu sử dụng.",
          },
          {
            label: "02",
            content: "Đưa khách vào luồng customer để quản lý thiệp, website cưới, lời mời và đơn hàng.",
          },
          {
            label: "03",
            content: "Kết nối provider, quảng cáo ưu tiên và các dịch vụ cưới khi dự án cần mở rộng.",
          },
        ],
        servicesTitle: "Chọn nhanh theo nhu cầu chuẩn bị cưới",
        servicesDescription:
          "Các nhóm nội dung trên Home cần giúp khách nhận ra PinkLove có thể bắt đầu rất đơn giản, nhưng vẫn đủ nền để mở rộng thành marketplace cưới.",
        serviceItems: [
          {
            headerImage: "/uploads/seed-offerings/seed-red-wedding-web-02.png",
            title: "Thiệp online & website cưới",
            description: "Tạo lời mời online, chia sẻ thông tin tiệc cưới và gom phản hồi khách mời về một nơi.",
            descriptionItems: "Mẫu thiệp có thể chọn nhanh\nWebsite cưới dành cho từng cặp đôi\nRSVP, lời chúc, album và bản đồ",
          },
          {
            headerImage: "/uploads/seed-offerings/general-offering-01.svg",
            title: "Thiệp giấy & sản phẩm cưới",
            description: "Mở rộng từ digital invitation sang thiệp in, quà cảm ơn và các sản phẩm cưới đồng bộ.",
            descriptionItems: "Catalog offering có thể quản trị\nĐơn hàng và fulfillment rõ ràng\nPhù hợp để kết nối xưởng sản xuất",
          },
          {
            headerImage: "/uploads/seed-offerings/general-offering-03.svg",
            title: "Provider & dịch vụ cưới",
            description: "Tạo nền cho provider, sourcing, booking và ưu tiên hiển thị đối tác trả phí hoặc đối tác nổi bật.",
            descriptionItems: "Hồ sơ provider và dịch vụ\nLead, booking, báo giá theo luồng\nQuảng cáo và ưu tiên hiển thị",
          },
          {
            headerImage: "/uploads/seed-offerings/mau-thiep-cuoi-blush-sonata.svg",
            title: "Mẫu thiệp theo concept",
            description: "Tạo nhiều nhóm mẫu để khách xem nhanh gu màu, bố cục và phong cách trước khi vào catalog.",
            descriptionItems: "Có dữ liệu demo cho carousel\nPhân nhóm theo style cưới\nDễ thay bằng offering thật",
          },
          {
            headerImage: "/uploads/seed-offerings/general-offering-05.svg",
            title: "Quà tặng & phụ kiện",
            description: "Bổ sung các item nhỏ như quà cảm ơn, tag, phong bì và phụ kiện để kiểm thử luồng commerce.",
            descriptionItems: "Có giá và tồn kho mẫu\nPhù hợp đơn hàng số lượng\nCó thể gắn provider supply",
          },
          {
            headerImage: "/uploads/seed-offerings/seed-red-wedding-web-03.png",
            title: "Ảnh cưới & nội dung media",
            description: "Demo nhóm dịch vụ ảnh cưới để carousel Home có nhiều loại card và hình ảnh khác nhau.",
            descriptionItems: "Dịch vụ theo lịch hẹn\nẢnh dùng cho website cưới\nProvider xử lý fulfillment",
          },
        ],
        eventPlannerEyebrow: "Bạn đang chuẩn bị",
        eventPlannerTitle: "ngày cưới",
        eventPlannerHighlight: "5",
        eventPlannerSuffix: "việc cần gom lại",
        eventPlannerProblems: [
          {
            image: "/uploads/seed-offerings/general-offering-04.svg",
            title: "Khó nhìn tổng thể",
            description: "Thiệp, danh sách khách, sản phẩm cưới và dịch vụ thường nằm ở nhiều nơi nên đội vận hành khó theo dõi.",
          },
          {
            image: "/uploads/seed-offerings/general-offering-05.svg",
            title: "Khó chọn đúng provider",
            description: "Cặp đôi cần biết provider nào phù hợp, còn admin cần kiểm soát chất lượng và mức ưu tiên hiển thị.",
          },
          {
            image: "/uploads/seed-offerings/general-offering-06.svg",
            title: "Khó tái sử dụng dữ liệu",
            description: "Seed chuẩn giúp môi trường demo, staging và local có cùng nội dung mẫu để test giao diện ổn định hơn.",
          },
        ],
        eventPlannerSolutionTitle: "PinkLove gom mọi điểm chạm vào một hành trình",
        eventPlannerHighlightText: "một hành trình",
        eventPlannerSolutionDescription:
          "Home không chỉ giới thiệu thương hiệu. Nó phải mở đường cho các trang chính: mẫu thiệp, thiệp giấy, dịch vụ, provider, công cụ, blog và customer dashboard.",
        eventPlannerCtaText: "Bắt đầu từ mẫu thiệp",
        eventPlannerCtaLink: "/mau-thiep",
        eventPlannerFeatures: [
          {
            title: "Thiệp online có thể quản lý",
            description: "Khách chọn mẫu trên web, sau đó đăng nhập để tiếp tục trong khu vực customer.",
            accentImage: "/uploads/seed-offerings/seed-red-wedding-web-03.png",
          },
          {
            title: "Catalog có thể bán thật",
            description: "Offering được dùng cho thiệp giấy, sản phẩm cưới, dịch vụ và các luồng commerce sau này.",
            accentImage: "/uploads/seed-offerings/general-offering-02.svg",
          },
          {
            title: "Provider có vị trí rõ ràng",
            description: "Nhà cung cấp có thể có dịch vụ, booking, lead và chương trình ưu tiên hiển thị riêng.",
            accentImage: "/uploads/seed-offerings/general-offering-03.svg",
          },
          {
            title: "Admin chỉnh nội dung linh hoạt",
            description: "Các section Home lấy từ managed page để seed và admin có thể cùng dùng một cấu trúc.",
            accentImage: "/uploads/seed-offerings/general-offering-04.svg",
          },
        ],
        invitationGalleryBadge: "✨",
        invitationGalleryTitle: "Mẫu thiệp và sản phẩm nổi bật",
        invitationGalleryDescription:
          "Hiển thị một số offering đang published để khách có điểm bắt đầu cụ thể. Giai đoạn sau có thể mở rộng seed thành nhiều mẫu thiệp online hơn.",
        invitationGalleryCtaText: "Xem tất cả mẫu thiệp",
        invitationGalleryCtaLink: "/mau-thiep",
        invitationGalleryOfferingSlugs: [
          "thiep-giay-bo-sen-trang",
          "chup-anh-phong-su-cuoi",
          "hop-qua-cam-on-khach-moi",
          "thiep-giay-modern-blush",
          "thiep-giay-golden-aisle",
          "thiep-giay-floral-scroll",
          "chup-anh-le-gia-tien",
          "chup-anh-couple-session",
          "set-qua-cam-on-premium",
        ],
        sharedInvitationsBadge: "♡",
        sharedInvitationsTitle: "Bắt đầu từ một phong cách có sẵn",
        sharedInvitationsDescription:
          "Khách có thể xem mẫu trên website, sau đó đăng nhập để quản lý thiệp và nội dung cá nhân trong dashboard customer.",
        sharedInvitationsCtaText: "Vào khu quản lý thiệp",
        sharedInvitationsCtaLink: "/customer/invitations",
        sharedInvitationsOfferingSlugs: [
          "thiep-giay-floral-scroll",
          "thiep-giay-golden-aisle",
          "thiep-giay-modern-blush",
          "thiep-giay-bo-sen-trang",
          "set-qua-cam-on-premium",
          "hop-qua-cam-on-khach-moi",
          "chup-anh-couple-session",
          "chup-anh-le-gia-tien",
          "chup-anh-phong-su-cuoi",
        ],
      },
    },
    {
      slug: "gioi-thieu",
      title: "Giới thiệu PinkLove",
      excerpt: "Nền tảng hỗ trợ thiệp cưới online, catalog sản phẩm và quy trình phối hợp provider.",
      status: "published",
      customFields: {
        introHeading: "PinkLove tập trung vào trải nghiệm cưới số hóa rõ ràng, dễ vận hành",
        introText:
          "Website mẫu này đã được seed sẵn dữ liệu catalogue, blog, tài khoản khách hàng, affiliate và provider để bạn kiểm thử toàn bộ flow end-to-end.",
      },
    },
    {
      slug: "lien-he",
      title: "Liên hệ PinkLove",
      excerpt: "Thông tin liên hệ demo của hệ thống PinkLove.",
      status: "published",
      customFields: {
        heroBadge: "Hỗ trợ demo",
        supportTitle: "Liên hệ đội vận hành PinkLove",
        supportDescription:
          "Dữ liệu seed này bao gồm thông tin liên hệ, menu và các route công khai để bạn kiểm thử cả giao diện website lẫn khu làm việc đối tác.",
        responseTime: "Trong vòng 2 giờ làm việc",
        officeHours: "08:30 - 18:00, Thứ 2 - Thứ 7",
        contactEmail: "hello@pinklove.local",
        contactPhone: "0909 000 999",
        contactAddress: "123 Demo Street, District 1, Ho Chi Minh City",
        socialLinks: [],
        contactMethods: [],
        faqItems: [],
        googleMapsEmbed: "https://maps.google.com",
      },
    },
    {
      slug: "dich-vu",
      title: "Dịch vụ PinkLove",
      excerpt: "Hệ sinh thái dịch vụ cưới kết hợp thiệp online, sản phẩm cưới và provider marketplace.",
      status: "published",
      customFields: {
        heroEyebrow: "Dịch vụ cưới trên nền tảng PinkLove",
        heroTitle: "Dịch vụ cưới được tổ chức như một platform",
        heroDescription:
          "PinkLove gom thiệp online, thiệp giấy, sản phẩm cưới, provider service và workflow điều phối vào một trải nghiệm thống nhất.",
        primaryCtaText: "Tư vấn dịch vụ",
        primaryCtaLink: "/lien-he",
        secondaryCtaText: "Xem mẫu thiệp",
        secondaryCtaLink: "/mau-thiep",
        servicesEyebrow: "Nhóm dịch vụ",
        servicesTitle: "Chọn đúng dịch vụ theo nhu cầu cưới",
        servicesDescription:
          "Mỗi nhóm dịch vụ có thể mở rộng thành offering, provider, đơn hàng và lịch triển khai riêng trong hệ thống.",
        serviceItems: [
          {
            title: "Thiệp cưới online & website cưới",
            badge: "Digital",
            description: "Xây dựng thiệp online, landing page cưới và luồng chia sẻ khách mời trên một nền tảng thống nhất.",
            detailItems: "Mẫu coded và trình quản lý thiệp\nRSVP, lời chúc, album, bản đồ\nTối ưu hiển thị mobile và SEO",
            ctaText: "Xem mẫu thiệp",
            ctaLink: "/mau-thiep",
          },
          {
            title: "Thiệp giấy & sản phẩm cưới",
            badge: "Commerce",
            description: "Kết nối nhu cầu in ấn, quà cưới và sản phẩm vật lý với quy trình đặt hàng, thanh toán, fulfillment.",
            detailItems: "Thiệp giấy, phụ kiện, quà tặng\nQuản lý đơn hàng và thanh toán\nSẵn sàng mở provider supply",
            ctaText: "Khám phá thiệp giấy",
            ctaLink: "/thiep-giay",
          },
          {
            title: "Dịch vụ cưới từ provider",
            badge: "Marketplace",
            description: "Tổ chức các dịch vụ như makeup, chụp ảnh, quay video, trang trí và wedding planner theo mô hình marketplace.",
            detailItems: "Provider profile và phê duyệt dịch vụ\nLịch khả dụng theo từng dịch vụ\nSẵn sàng mở booking và điều phối",
            ctaText: "Trao đổi nhu cầu",
            ctaLink: "/lien-he",
          },
        ],
        catalogEyebrow: "Catalog đang mở",
        catalogTitle: "Dịch vụ đã được xuất bản trong hệ thống",
        catalogDescription:
          "Các dịch vụ đến trực tiếp từ offering catalog để trang phản ánh đúng dữ liệu vận hành thay vì chỉ là bảng giá tĩnh.",
        workflowEyebrow: "Workflow",
        workflowTitle: "Triển khai dịch vụ theo luồng rõ ràng",
        workflowDescription:
          "Từ brief khách hàng đến catalog, provider và lịch thực hiện, trang dịch vụ phản ánh cách nền tảng vận hành thật.",
        workflowItems: [
          {
            title: "Hiểu nhu cầu",
            description: "Xác định loại dịch vụ, thời điểm cưới, địa điểm, phong cách và mức hỗ trợ cần thiết.",
          },
          {
            title: "Ghép giải pháp",
            description: "Chọn mẫu, sản phẩm hoặc provider phù hợp; tách rõ phần digital, vật lý và dịch vụ có người thực hiện.",
          },
          {
            title: "Triển khai & điều phối",
            description: "Hoàn thiện nội dung, kết nối provider, theo dõi đơn/dịch vụ và chuẩn bị các bước booking tiếp theo.",
          },
        ],
        platformEyebrow: "Năng lực platform",
        platformTitle: "Thiết kế để mở rộng thành hệ sinh thái dịch vụ cưới",
        platformDescription:
          "Trang dịch vụ đặt trọng tâm vào catalog, provider, booking và commerce để phù hợp với định hướng platform lớn.",
        platformItems: [
          {
            title: "Catalog dịch vụ mở rộng",
            description: "Mỗi dịch vụ là một offering có loại, fulfillment, nội dung SEO và khả năng mở rộng riêng.",
          },
          {
            title: "Provider ecosystem",
            description: "Dịch vụ có thể gắn với provider, hồ sơ năng lực, vùng phục vụ, giá và lịch khả dụng.",
          },
          {
            title: "Luồng commerce thống nhất",
            description: "Digital, physical và service cùng nằm trong một kiến trúc để dễ mở checkout, order và fulfillment.",
          },
          {
            title: "Quản trị nội dung linh hoạt",
            description: "Admin vẫn chỉnh được thông điệp trang dịch vụ qua managed page mà không đổi code cho từng nội dung nhỏ.",
          },
        ],
        faqEyebrow: "FAQ dịch vụ",
        faqTitle: "Câu hỏi thường gặp",
        faqDescription: "Giải đáp nhanh trước khi khách hàng gửi brief hoặc chọn một dịch vụ cụ thể.",
        ctaTitle: "Cần triển khai một hạng mục cưới cụ thể?",
        ctaDescription:
          "Gửi brief dịch vụ, PinkLove sẽ đề xuất hướng triển khai phù hợp với digital invitation, sản phẩm cưới hoặc provider service.",
        ctaButtonText: "Gửi yêu cầu tư vấn",
        ctaButtonLink: "/lien-he",
      },
    },
    {
      slug: "cong-cu",
      title: "Công cụ cưới",
      excerpt: "Bộ công cụ hỗ trợ QR và dự toán cưới.",
      status: "published",
      customFields: {},
    },
    {
      slug: "blog",
      title: "Blog cưới PinkLove",
      excerpt: "Bài viết mẫu đã được seed sẵn cho website demo.",
      status: "published",
      customFields: {},
    },
  ];

  for (const page of pageSeeds) {
    await client.query(
      `
        UPDATE managed_pages
        SET
          title = $2,
          excerpt = $3,
          status = $4,
          custom_fields = $5::jsonb,
          updated_at = NOW()
        WHERE slug = $1
      `,
      [page.slug, page.title, page.excerpt, page.status, JSON.stringify(page.customFields)]
    );
  }
}

async function upsertMenu(client, menuName, label, items) {
  const menu = await fetchRow(
    client,
    `
      INSERT INTO navigation_menus (name, label)
      VALUES ($1, $2)
      ON CONFLICT (name)
      DO UPDATE SET
        label = EXCLUDED.label,
        updated_at = NOW()
      RETURNING id
    `,
    [menuName, label]
  );

  await client.query("DELETE FROM navigation_menu_items WHERE menu_id = $1", [menu.id]);

  for (const item of items) {
    await client.query(
      `
        INSERT INTO navigation_menu_items (menu_id, parent_id, label, type, page_slug, url, position)
        VALUES ($1, NULL, $2, $3, $4, $5, $6)
      `,
      [menu.id, item.label, item.type, item.pageSlug ?? null, item.url ?? null, item.position]
    );
  }
}

async function upsertAffiliateAccount(client, input) {
  await client.query(
    `
      INSERT INTO affiliate_accounts (
        user_id,
        code,
        status,
        commission_type,
        commission_value,
        notes,
        approved_by,
        approved_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id)
      DO UPDATE SET
        code = EXCLUDED.code,
        status = EXCLUDED.status,
        commission_type = EXCLUDED.commission_type,
        commission_value = EXCLUDED.commission_value,
        notes = EXCLUDED.notes,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at,
        updated_at = NOW()
    `,
    [
      input.userId,
      input.code,
      input.status,
      input.commissionType,
      input.commissionValue,
      input.notes,
      input.approvedBy ?? null,
      input.approvedAt ?? null,
    ]
  );

  await client.query("DELETE FROM affiliate_clicks WHERE affiliate_user_id = $1", [input.userId]);
  await client.query("DELETE FROM affiliate_conversions WHERE affiliate_user_id = $1", [input.userId]);

  for (const click of input.clicks ?? []) {
    await client.query(
      `
        INSERT INTO affiliate_clicks (affiliate_user_id, affiliate_code, landing_path, referrer, visitor_token, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [input.userId, input.code, click.landingPath, click.referrer ?? null, click.visitorToken ?? null, click.userAgent ?? null]
    );
  }

  for (const conversion of input.conversions ?? []) {
    await client.query(
      `
        INSERT INTO affiliate_conversions (
          affiliate_user_id,
          affiliate_code,
          external_order_ref,
          order_value,
          commission_amount,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        input.userId,
        input.code,
        conversion.externalOrderRef,
        conversion.orderValue,
        conversion.commissionAmount,
        conversion.status,
        JSON.stringify(conversion.metadata ?? {}),
      ]
    );
  }
}

async function upsertOrder(client, input) {
  const order = await fetchRow(
    client,
    `
      INSERT INTO commerce_orders (
        order_number,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        status,
        payment_status,
        fulfillment_status,
        currency,
        subtotal_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        shipping_name,
        shipping_phone,
        shipping_line1,
        shipping_line2,
        shipping_ward,
        shipping_district,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        notes,
        affiliate_user_id,
        affiliate_code,
        paid_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, 'VND',
        $9, 0, 0, $10,
        $3, $5,
        '123 Demo Street', '', 'Ward 1', 'District 1', 'Ho Chi Minh City', '700000', 'VN',
        $11, $12, $13,
        CASE WHEN $7 = 'paid' THEN NOW() ELSE NULL END
      )
      ON CONFLICT (order_number)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        customer_name = EXCLUDED.customer_name,
        customer_email = EXCLUDED.customer_email,
        customer_phone = EXCLUDED.customer_phone,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        fulfillment_status = EXCLUDED.fulfillment_status,
        subtotal_amount = EXCLUDED.subtotal_amount,
        total_amount = EXCLUDED.total_amount,
        shipping_name = EXCLUDED.shipping_name,
        shipping_phone = EXCLUDED.shipping_phone,
        shipping_line1 = EXCLUDED.shipping_line1,
        shipping_line2 = EXCLUDED.shipping_line2,
        shipping_ward = EXCLUDED.shipping_ward,
        shipping_district = EXCLUDED.shipping_district,
        shipping_city = EXCLUDED.shipping_city,
        shipping_postal_code = EXCLUDED.shipping_postal_code,
        shipping_country = EXCLUDED.shipping_country,
        notes = EXCLUDED.notes,
        affiliate_user_id = EXCLUDED.affiliate_user_id,
        affiliate_code = EXCLUDED.affiliate_code,
        paid_at = EXCLUDED.paid_at,
        updated_at = NOW()
      RETURNING id, order_number
    `,
    [
      input.orderNumber,
      input.userId,
      input.customerName,
      input.customerEmail,
      input.customerPhone,
      input.orderStatus,
      input.paymentStatus,
      input.fulfillmentStatus,
      input.subtotal,
      input.total,
      input.notes,
      input.affiliateUserId ?? null,
      input.affiliateCode ?? null,
    ]
  );

  await client.query(
    `
      DELETE FROM provider_order_events
      WHERE assignment_id IN (
        SELECT id FROM provider_order_assignments WHERE order_id = $1
      )
    `,
    [order.id]
  );
  await client.query("DELETE FROM provider_order_assignments WHERE order_id = $1", [order.id]);
  await client.query("DELETE FROM commerce_payments WHERE order_id = $1", [order.id]);
  await client.query("DELETE FROM commerce_order_items WHERE order_id = $1", [order.id]);

  return order;
}

async function createOrderItems(client, orderId, items) {
  for (const item of items) {
    await client.query(
      `
        INSERT INTO commerce_order_items (
          order_id,
          offering_id,
          offering_name,
          offering_slug,
          offering_type,
          fulfillment_type,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        orderId,
        item.offering.id,
        item.offering.name,
        item.offering.slug,
        item.offering.offering_type,
        item.offering.fulfillment_type,
        item.quantity,
        item.unitPrice,
        item.unitPrice * item.quantity,
      ]
    );
  }
}

async function createPayment(client, orderId, amount, externalRef) {
  await client.query(
    `
      INSERT INTO commerce_payments (order_id, method, provider, amount, status, external_ref, paid_at)
      VALUES ($1, 'bank_transfer', 'manual_bank_transfer', $2, 'paid', $3, NOW())
    `,
    [orderId, amount, externalRef]
  );
}

async function createProviderAssignment(client, input) {
  const assignment = await fetchRow(
    client,
    `
      INSERT INTO provider_order_assignments (
        order_id,
        provider_user_id,
        status,
        internal_note,
        provider_note,
        provider_reference,
        accepted_at,
        completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
    [
      input.orderId,
      input.providerId,
      input.status,
      input.internalNote,
      input.providerNote,
      input.providerReference,
      input.acceptedAt ?? null,
      input.completedAt ?? null,
    ]
  );

  for (const event of input.events ?? []) {
    await client.query(
      `
        INSERT INTO provider_order_events (assignment_id, actor_user_id, actor_type, event_type, message)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [assignment.id, event.actorUserId ?? null, event.actorType, event.eventType, event.message]
    );
  }

  return assignment;
}

async function upsertMediaAsset(client, input) {
  await client.query(
    `
      INSERT INTO media_assets (id, url, file_name, original_name, mime_type, size_bytes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id)
      DO UPDATE SET
        url = EXCLUDED.url,
        file_name = EXCLUDED.file_name,
        original_name = EXCLUDED.original_name,
        mime_type = EXCLUDED.mime_type,
        size_bytes = EXCLUDED.size_bytes
    `,
    [input.id, input.url, input.fileName, input.originalName, input.mimeType, input.sizeBytes]
  );
}

async function seedWeddingPlanningWorkspace(client, input) {
  const site = await fetchRow(
    client,
    `
      INSERT INTO wedding_sites (
        user_id,
        offering_id,
        title,
        slug,
        site_type,
        template_key,
        status,
        custom_data,
        project_status,
        budget,
        event_date,
        guest_target
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::date, $12)
      ON CONFLICT (slug)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        offering_id = EXCLUDED.offering_id,
        title = EXCLUDED.title,
        site_type = EXCLUDED.site_type,
        template_key = EXCLUDED.template_key,
        status = EXCLUDED.status,
        custom_data = EXCLUDED.custom_data,
        project_status = EXCLUDED.project_status,
        budget = EXCLUDED.budget,
        event_date = EXCLUDED.event_date,
        guest_target = EXCLUDED.guest_target,
        updated_at = NOW()
      RETURNING id, title, slug
    `,
    [
      input.userId,
      input.offeringId ?? null,
      input.title,
      input.slug,
      input.siteType ?? "coded",
      input.templateKey ?? "aurora_veil",
      input.status ?? "published",
      JSON.stringify(input.customData ?? {}),
      input.projectStatus ?? "active",
      input.budget ?? 0,
      input.eventDate ?? null,
      input.guestTarget ?? 0,
    ]
  );

  await client.query("DELETE FROM media_collection_items WHERE collection_id IN (SELECT id FROM media_collections WHERE target_type = 'wedding_site' AND target_id = $1)", [site.id]);
  await client.query("DELETE FROM media_collections WHERE target_type = 'wedding_site' AND target_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_table_guests WHERE table_id IN (SELECT id FROM wedding_tables WHERE wedding_site_id = $1)", [site.id]);
  await client.query("DELETE FROM wedding_site_rsvps WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_site_guests WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM guest_groups WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_tables WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_tasks WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_timeline_items WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_site_events WHERE wedding_site_id = $1", [site.id]);
  await client.query("DELETE FROM wedding_site_galleries WHERE wedding_site_id = $1", [site.id]);

  const groupIds = new Map();
  for (const [index, group] of input.groups.entries()) {
    const row = await fetchRow(
      client,
      `
        INSERT INTO guest_groups (wedding_site_id, name, sort_order)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [site.id, group.name, index]
    );
    groupIds.set(group.key, row.id);
  }

  const guestIds = new Map();
  for (const guest of input.guests) {
    const row = await fetchRow(
      client,
      `
        INSERT INTO wedding_site_guests (
          wedding_site_id,
          full_name,
          phone,
          email,
          group_name,
          guest_group_id,
          status,
          note,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        RETURNING id
      `,
      [
        site.id,
        guest.fullName,
        guest.phone ?? "",
        guest.email ?? "",
        guest.groupName ?? "",
        groupIds.get(guest.groupKey) ?? null,
        guest.status ?? "invited",
        guest.note ?? "",
        JSON.stringify(guest.metadata ?? {}),
      ]
    );
    guestIds.set(guest.key, row.id);
  }

  for (const rsvp of input.rsvps) {
    await client.query(
      `
        INSERT INTO wedding_site_rsvps (
          wedding_site_id,
          guest_id,
          attendee_name,
          attendee_count,
          response_status,
          message,
          meal_choice,
          special_requests,
          responded_at,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::jsonb)
      `,
      [
        site.id,
        guestIds.get(rsvp.guestKey) ?? null,
        rsvp.attendeeName,
        rsvp.attendeeCount ?? 1,
        rsvp.responseStatus ?? "pending",
        rsvp.message ?? "",
        rsvp.mealChoice ?? "",
        rsvp.specialRequests ?? "",
        rsvp.respondedAt ?? null,
        JSON.stringify(rsvp.metadata ?? {}),
      ]
    );
  }

  const tableIds = new Map();
  for (const [index, table] of input.tables.entries()) {
    const row = await fetchRow(
      client,
      `
        INSERT INTO wedding_tables (wedding_site_id, name, capacity, sort_order, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [site.id, table.name, table.capacity, index, table.notes ?? ""]
    );
    tableIds.set(table.key, row.id);
  }

  for (const assignment of input.tableAssignments) {
    await client.query(
      `
        INSERT INTO wedding_table_guests (table_id, guest_id, seat_number)
        VALUES ($1, $2, $3)
        ON CONFLICT (table_id, guest_id)
        DO UPDATE SET seat_number = EXCLUDED.seat_number
      `,
      [tableIds.get(assignment.tableKey), guestIds.get(assignment.guestKey), assignment.seatNumber ?? ""]
    );
  }

  for (const task of input.tasks) {
    await client.query(
      `
        INSERT INTO wedding_tasks (
          wedding_site_id,
          title,
          description,
          category,
          status,
          priority,
          due_date,
          completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8::timestamptz)
      `,
      [
        site.id,
        task.title,
        task.description ?? "",
        task.category ?? "other",
        task.status ?? "pending",
        task.priority ?? "normal",
        task.dueDate ?? null,
        task.completedAt ?? null,
      ]
    );
  }

  for (const item of input.timeline) {
    await client.query(
      `
        INSERT INTO wedding_timeline_items (
          wedding_site_id,
          title,
          starts_at,
          ends_at,
          timeline_type,
          notes
        )
        VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6)
      `,
      [site.id, item.title, item.startsAt ?? null, item.endsAt ?? null, item.timelineType ?? "custom", item.notes ?? ""]
    );
  }

  for (const [index, event] of (input.events ?? []).entries()) {
    await client.query(
      `
        INSERT INTO wedding_site_events (
          wedding_site_id,
          title,
          starts_at,
          ends_at,
          venue_name,
          address,
          sort_order,
          metadata
        )
        VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6, $7, $8::jsonb)
      `,
      [
        site.id,
        event.title,
        event.startsAt ?? null,
        event.endsAt ?? null,
        event.venueName ?? "",
        event.address ?? "",
        index,
        JSON.stringify(event.metadata ?? {}),
      ]
    );
  }

  for (const collection of input.collections ?? []) {
    const collectionRow = await fetchRow(
      client,
      `
        INSERT INTO media_collections (name, target_type, target_id, description)
        VALUES ($1, 'wedding_site', $2, $3)
        RETURNING id
      `,
      [collection.name, site.id, collection.description ?? ""]
    );

    for (const [index, asset] of collection.assets.entries()) {
      await upsertMediaAsset(client, asset);
      await client.query(
        `
          INSERT INTO media_collection_items (collection_id, media_asset_id, sort_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (collection_id, media_asset_id)
          DO UPDATE SET sort_order = EXCLUDED.sort_order
        `,
        [collectionRow.id, asset.id, index]
      );
    }
  }

  return site;
}

async function seedWeddingPlanningDemo(client, { customerOne, customerTwo, offeringA, offeringB }) {
  const lanMinhSite = await seedWeddingPlanningWorkspace(client, {
    userId: customerOne.id,
    offeringId: offeringA.id,
    title: "Minh & Lan - Wedding Day",
    slug: "minh-lan-wedding-day",
    siteType: "coded",
    templateKey: "aurora_veil",
    status: "published",
    projectStatus: "active",
    budget: 420000000,
    eventDate: "2026-12-15",
    guestTarget: 180,
    customData: {
      brideName: "Lan",
      groomName: "Minh",
      heroSubtitle: "Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng tôi.",
      eventDate: "15.12.2026",
      venue: "White Palace, TP.HCM",
      storyTitle: "Ngày mình chọn nhau",
      storyBody: "Một hành trình nhỏ được gom lại thành ngày vui lớn với gia đình và bạn bè.",
      gallery: [
        "/uploads/seed-offerings/seed-red-wedding-web-01.png",
        "/uploads/seed-offerings/seed-red-wedding-web-02.png",
      ],
    },
    groups: [
      { key: "nha-trai", name: "Nhà trai" },
      { key: "nha-gai", name: "Nhà gái" },
      { key: "ban-be", name: "Bạn bè" },
      { key: "cong-ty", name: "Đồng nghiệp" },
    ],
    guests: [
      { key: "guest-01", fullName: "Nguyen Van An", phone: "0901000001", email: "an@example.local", groupKey: "nha-trai", status: "confirmed", note: "Đi cùng gia đình 4 người." },
      { key: "guest-02", fullName: "Pham Thi Hoa", phone: "0901000002", email: "hoa@example.local", groupKey: "nha-gai", status: "confirmed", note: "Ăn chay." },
      { key: "guest-03", fullName: "Le Quang Huy", phone: "0901000003", email: "huy@example.local", groupKey: "ban-be", status: "invited", note: "Bạn đại học." },
      { key: "guest-04", fullName: "Tran Mai Anh", phone: "0901000004", email: "maianh@example.local", groupKey: "ban-be", status: "confirmed", note: "Phụ trách hỗ trợ check-in." },
      { key: "guest-05", fullName: "Vo Duc Khang", phone: "0901000005", email: "khang@example.local", groupKey: "cong-ty", status: "declined", note: "Bận công tác." },
      { key: "guest-06", fullName: "Do Thanh Tam", phone: "0901000006", email: "tam@example.local", groupKey: "cong-ty", status: "confirmed", note: "Đi 2 người." },
      { key: "guest-07", fullName: "Bui Kim Chi", phone: "0901000007", email: "kimchi@example.local", groupKey: "nha-gai", status: "invited", note: "Cần gọi xác nhận lại." },
      { key: "guest-08", fullName: "Hoang Gia Bao", phone: "0901000008", email: "bao@example.local", groupKey: "nha-trai", status: "confirmed", note: "Ngồi gần sân khấu." },
    ],
    rsvps: [
      { guestKey: "guest-01", attendeeName: "Nguyen Van An", attendeeCount: 4, responseStatus: "accepted", mealChoice: "Set menu tiêu chuẩn", respondedAt: "2026-06-01T03:15:00.000Z" },
      { guestKey: "guest-02", attendeeName: "Pham Thi Hoa", attendeeCount: 1, responseStatus: "accepted", mealChoice: "Vegetarian", specialRequests: "Không hành tỏi", respondedAt: "2026-06-02T08:20:00.000Z" },
      { guestKey: "guest-04", attendeeName: "Tran Mai Anh", attendeeCount: 1, responseStatus: "accepted", message: "Mình sẽ đến sớm hỗ trợ.", respondedAt: "2026-06-03T10:00:00.000Z" },
      { guestKey: "guest-05", attendeeName: "Vo Duc Khang", attendeeCount: 1, responseStatus: "declined", message: "Xin lỗi vì lịch công tác trùng ngày.", respondedAt: "2026-06-04T11:30:00.000Z" },
      { guestKey: "guest-06", attendeeName: "Do Thanh Tam", attendeeCount: 2, responseStatus: "accepted", specialRequests: "Cần ghế trẻ em nếu có.", respondedAt: "2026-06-05T02:40:00.000Z" },
    ],
    tables: [
      { key: "table-family-groom", name: "Bàn Nhà Trai 01", capacity: 10, notes: "Ưu tiên người lớn tuổi." },
      { key: "table-family-bride", name: "Bàn Nhà Gái 01", capacity: 10, notes: "Gần lối lên sân khấu." },
      { key: "table-friends", name: "Bàn Bạn Bè", capacity: 12, notes: "Nhóm bạn đại học và bạn thân." },
      { key: "table-company", name: "Bàn Đồng Nghiệp", capacity: 10, notes: "Khu giữa sảnh." },
    ],
    tableAssignments: [
      { tableKey: "table-family-groom", guestKey: "guest-01", seatNumber: "A1" },
      { tableKey: "table-family-bride", guestKey: "guest-02", seatNumber: "B1" },
      { tableKey: "table-friends", guestKey: "guest-03", seatNumber: "C1" },
      { tableKey: "table-friends", guestKey: "guest-04", seatNumber: "C2" },
      { tableKey: "table-company", guestKey: "guest-06", seatNumber: "D1" },
      { tableKey: "table-family-bride", guestKey: "guest-07", seatNumber: "B2" },
      { tableKey: "table-family-groom", guestKey: "guest-08", seatNumber: "A2" },
    ],
    tasks: [
      { title: "Chốt sảnh tiệc White Palace", description: "Xác nhận số bàn dự phòng và sơ đồ sân khấu.", category: "venue", status: "completed", priority: "high", dueDate: "2026-07-01", completedAt: "2026-05-30T09:00:00.000Z" },
      { title: "Chụp pre-wedding Đà Lạt", description: "Chuẩn bị 3 concept, lịch di chuyển và makeup.", category: "photo", status: "in_progress", priority: "high", dueDate: "2026-08-12" },
      { title: "Duyệt mẫu trang trí bàn gallery", description: "Chọn tone trắng hồng, kiểm tra backdrop welcome.", category: "decoration", status: "pending", priority: "normal", dueDate: "2026-09-05" },
      { title: "Hoàn tất danh sách khách mời", description: "Gọi xác nhận nhóm chưa RSVP.", category: "planner", status: "in_progress", priority: "high", dueDate: "2026-10-20" },
      { title: "Chuẩn bị giấy tờ đăng ký kết hôn", description: "Kiểm tra bản sao giấy tờ và lịch hẹn phường.", category: "legal", status: "pending", priority: "normal", dueDate: "2026-11-01" },
      { title: "Đặt xe đưa đón gia đình", description: "2 xe 16 chỗ cho hai bên gia đình.", category: "transportation", status: "pending", priority: "normal", dueDate: "2026-11-20" },
    ],
    timeline: [
      { title: "Makeup cô dâu", timelineType: "preparation", startsAt: "2026-12-15T00:30:00.000Z", endsAt: "2026-12-15T02:30:00.000Z", notes: "Makeup tại nhà cô dâu." },
      { title: "Lễ gia tiên", timelineType: "ceremony", startsAt: "2026-12-15T03:00:00.000Z", endsAt: "2026-12-15T04:30:00.000Z", notes: "Nhà gái, đội bưng quả có mặt trước 30 phút." },
      { title: "Chụp ảnh gia đình", timelineType: "custom", startsAt: "2026-12-15T08:30:00.000Z", endsAt: "2026-12-15T09:30:00.000Z", notes: "Sảnh chính White Palace." },
      { title: "Đón khách tiệc tối", timelineType: "reception", startsAt: "2026-12-15T10:30:00.000Z", endsAt: "2026-12-15T11:30:00.000Z", notes: "Check-in QR và ký tên." },
      { title: "Khai tiệc", timelineType: "reception", startsAt: "2026-12-15T11:45:00.000Z", endsAt: "2026-12-15T14:00:00.000Z", notes: "MC giới thiệu, nghi thức rót rượu, dùng tiệc." },
    ],
    events: [
      { title: "Lễ gia tiên", startsAt: "2026-12-15T03:00:00.000Z", endsAt: "2026-12-15T04:30:00.000Z", venueName: "Nhà cô dâu", address: "Quận 3, TP.HCM" },
      { title: "Tiệc cưới", startsAt: "2026-12-15T10:30:00.000Z", endsAt: "2026-12-15T14:00:00.000Z", venueName: "White Palace", address: "194 Hoang Van Thu, Phu Nhuan, TP.HCM" },
    ],
    collections: [
      {
        name: "Pre-wedding Da Lat",
        description: "Ảnh demo cho album pre-wedding hiển thị trong wedding planning.",
        assets: [
          { id: "seed-wp-lan-minh-01", url: "/uploads/seed-offerings/seed-red-wedding-web-01.png", fileName: "seed-red-wedding-web-01.png", originalName: "Lan Minh pre-wedding 01", mimeType: "image/png", sizeBytes: 248000 },
          { id: "seed-wp-lan-minh-02", url: "/uploads/seed-offerings/seed-red-wedding-web-02.png", fileName: "seed-red-wedding-web-02.png", originalName: "Lan Minh pre-wedding 02", mimeType: "image/png", sizeBytes: 252000 },
        ],
      },
    ],
  });

  const minhThaoSite = await seedWeddingPlanningWorkspace(client, {
    userId: customerTwo.id,
    offeringId: offeringB.id,
    title: "Minh & Thao - Reception Plan",
    slug: "minh-thao-reception-plan",
    siteType: "coded",
    templateKey: "golden_aisle",
    status: "published",
    projectStatus: "completed",
    budget: 280000000,
    eventDate: "2026-04-26",
    guestTarget: 120,
    customData: {
      brideName: "Thao",
      groomName: "Minh",
      heroSubtitle: "Cảm ơn bạn đã chung vui cùng gia đình chúng tôi.",
      eventDate: "26.04.2026",
      venue: "Gem Center, TP.HCM",
      storyTitle: "Một ngày trọn vẹn",
      storyBody: "Wedding planning demo đã hoàn tất để admin xem trạng thái completed.",
      gallery: ["/uploads/seed-offerings/seed-red-wedding-web-03.png"],
    },
    groups: [
      { key: "family", name: "Gia đình" },
      { key: "friends", name: "Bạn bè" },
      { key: "work", name: "Công ty" },
    ],
    guests: [
      { key: "guest-01", fullName: "Dang Quoc Viet", phone: "0902000001", email: "viet@example.local", groupKey: "family", status: "confirmed" },
      { key: "guest-02", fullName: "Nguyen Thu Ha", phone: "0902000002", email: "ha@example.local", groupKey: "friends", status: "confirmed" },
      { key: "guest-03", fullName: "Le Bao Tram", phone: "0902000003", email: "tram@example.local", groupKey: "work", status: "confirmed" },
    ],
    rsvps: [
      { guestKey: "guest-01", attendeeName: "Dang Quoc Viet", attendeeCount: 2, responseStatus: "accepted", respondedAt: "2026-03-20T04:00:00.000Z" },
      { guestKey: "guest-02", attendeeName: "Nguyen Thu Ha", attendeeCount: 1, responseStatus: "accepted", respondedAt: "2026-03-21T04:00:00.000Z" },
      { guestKey: "guest-03", attendeeName: "Le Bao Tram", attendeeCount: 1, responseStatus: "accepted", respondedAt: "2026-03-22T04:00:00.000Z" },
    ],
    tables: [
      { key: "table-vip", name: "Bàn VIP", capacity: 10, notes: "Gia đình hai bên." },
      { key: "table-friends", name: "Bàn Bạn Bè", capacity: 10, notes: "Bạn thân." },
    ],
    tableAssignments: [
      { tableKey: "table-vip", guestKey: "guest-01", seatNumber: "V1" },
      { tableKey: "table-friends", guestKey: "guest-02", seatNumber: "F1" },
      { tableKey: "table-friends", guestKey: "guest-03", seatNumber: "F2" },
    ],
    tasks: [
      { title: "Chốt final menu", category: "venue", status: "completed", priority: "high", dueDate: "2026-03-30", completedAt: "2026-03-28T04:00:00.000Z" },
      { title: "Gửi ảnh highlight cho khách", category: "photo", status: "completed", priority: "normal", dueDate: "2026-05-02", completedAt: "2026-05-01T04:00:00.000Z" },
    ],
    timeline: [
      { title: "Đón khách", timelineType: "reception", startsAt: "2026-04-26T10:00:00.000Z", endsAt: "2026-04-26T11:00:00.000Z" },
      { title: "Khai tiệc", timelineType: "reception", startsAt: "2026-04-26T11:00:00.000Z", endsAt: "2026-04-26T13:30:00.000Z" },
    ],
    events: [
      { title: "Tiệc cưới", startsAt: "2026-04-26T10:00:00.000Z", endsAt: "2026-04-26T13:30:00.000Z", venueName: "Gem Center", address: "8 Nguyen Binh Khiem, District 1, TP.HCM" },
    ],
    collections: [
      {
        name: "Reception Highlights",
        description: "Album demo cho wedding đã completed.",
        assets: [
          { id: "seed-wp-minh-thao-01", url: "/uploads/seed-offerings/seed-red-wedding-web-03.png", fileName: "seed-red-wedding-web-03.png", originalName: "Minh Thao reception 01", mimeType: "image/png", sizeBytes: 220000 },
        ],
      },
    ],
  });

  return [
    { title: lanMinhSite.title, slug: lanMinhSite.slug, link: withBaseUrl(`/customer/wedding-planning?site=${encodeURIComponent(lanMinhSite.id)}`) },
    { title: minhThaoSite.title, slug: minhThaoSite.slug, link: withBaseUrl(`/customer/wedding-planning?site=${encodeURIComponent(minhThaoSite.id)}`) },
  ];
}

function sumItems(items) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    await client.query("BEGIN");

    const offerings = await fetchRows(
      client,
      `
        SELECT id, slug, name, offering_type, fulfillment_type, price
        FROM offerings
        WHERE status = 'published'
        ORDER BY created_at ASC
        LIMIT 3
      `
    );

    if (offerings.length === 0) {
      throw new Error(
        "No published offerings found. Start the dev stack with `./setup up` first so database bootstrap seeds offering/blog/page data."
      );
    }

    const [offeringA, offeringB = offerings[0], offeringC = offerings[0]] = offerings.map((offering) => ({
      ...offering,
      price: Number(offering.price ?? 0),
    }));

    await seedManagedPages(client);

    await upsertMenu(client, "header", "Header Menu", [
      { label: "Trang chủ", type: "page", pageSlug: "home", position: 0 },
      { label: "Giới thiệu", type: "page", pageSlug: "gioi-thieu", position: 1 },
      { label: "Mẫu thiệp", type: "page", pageSlug: "mau-thiep", position: 2 },
      { label: "Dịch vụ", type: "page", pageSlug: "dich-vu", position: 3 },
      { label: "Blog", type: "page", pageSlug: "blog", position: 4 },
      { label: "Liên hệ", type: "page", pageSlug: "lien-he", position: 5 },
    ]);

    await upsertMenu(client, "footer", "Footer Menu", [
      { label: "Trang chủ", type: "page", pageSlug: "home", position: 0 },
      { label: "Công cụ", type: "page", pageSlug: "cong-cu", position: 1 },
      { label: "QR Builder", type: "page", pageSlug: "cong-cu/tao-ma-qr", position: 2 },
      { label: "Dự toán cưới", type: "page", pageSlug: "cong-cu/du-toan-cuoi", position: 3 },
      { label: "Blog", type: "page", pageSlug: "blog", position: 4 },
      { label: "Liên hệ", type: "page", pageSlug: "lien-he", position: 5 },
    ]);

    if (SKIP_USERS) {
      await client.query("COMMIT");
      console.log(
        JSON.stringify(
          {
            seeded: ["managed_pages", "navigation_menus", "navigation_menu_items"],
            skipped: ["users", "user_profiles", "affiliate_accounts", "orders", "provider_assignments"],
            website: {
              home: withBaseUrl("/"),
              templates: withBaseUrl("/mau-thiep"),
              invitations: withBaseUrl("/customer/invitations"),
              blog: withBaseUrl("/blog"),
              contact: withBaseUrl("/lien-he"),
            },
            notes: [
              "No users were created or updated.",
              "Create your own admin/customer/provider accounts from the app when needed.",
            ],
          },
          null,
          2
        )
      );
      return;
    }

    const providerAlpha = await upsertUser(client, {
      username: "provider_alpha",
      role: "PROVIDER",
      displayName: "Xuong In Alpha",
      fullName: "Xuong In Alpha",
      phone: "0900000001",
      providerPortalSlug: "xuong-in-alpha",
      bio: "Provider Alpha seeded for provider portal demo.",
    });

    const providerBeta = await upsertUser(client, {
      username: "provider_beta",
      role: "PROVIDER",
      displayName: "Xuong In Beta",
      fullName: "Xuong In Beta",
      phone: "0900000002",
      providerPortalSlug: "xuong-in-beta",
      bio: "Provider Beta seeded for provider portal demo.",
    });

    const customerOne = await upsertUser(client, {
      username: "customer_one",
      role: "CUSTOMER",
      displayName: "Nguyen Lan",
      fullName: "Nguyen Lan",
      phone: "0900000011",
      bio: "Customer seeded for website demo.",
    });

    const customerTwo = await upsertUser(client, {
      username: "customer_two",
      role: "CUSTOMER",
      displayName: "Tran Minh",
      fullName: "Tran Minh",
      phone: "0900000012",
      bio: "Customer seeded for website demo.",
    });

    const affiliateRose = await upsertUser(client, {
      username: "affiliate_rose",
      role: "AFFILIATE",
      displayName: "Rose Provider",
      fullName: "Rose Provider",
      phone: "0900000021",
      bio: "Active affiliate seeded for tracking demo.",
    });

    const affiliateNova = await upsertUser(client, {
      username: "affiliate_nova",
      role: "AFFILIATE",
      displayName: "Nova Provider",
      fullName: "Nova Provider",
      phone: "0900000022",
      bio: "Pending affiliate seeded for admin review demo.",
    });

    await upsertAffiliateAccount(client, {
      userId: affiliateRose.id,
      code: "rose-love",
      status: "active",
      commissionType: "percent",
      commissionValue: 8,
      notes: "Affiliate active seed account.",
      approvedAt: "2026-04-08T08:30:00.000Z",
      clicks: [
        { landingPath: "/", referrer: "https://facebook.com", visitorToken: "seed-visitor-001", userAgent: "SeedAgent/1.0" },
        { landingPath: "/mau-thiep", referrer: "https://instagram.com", visitorToken: "seed-visitor-002", userAgent: "SeedAgent/1.0" },
      ],
      conversions: [
        {
          externalOrderRef: "AFF-SEED-001",
          orderValue: 1290000,
          commissionAmount: 103200,
          status: "approved",
          metadata: { source: "seed" },
        },
      ],
    });

    await upsertAffiliateAccount(client, {
      userId: affiliateNova.id,
      code: "nova-plan",
      status: "pending",
      commissionType: "percent",
      commissionValue: 10,
      notes: "Affiliate pending seed account.",
      clicks: [
        { landingPath: "/blog", referrer: "https://tiktok.com", visitorToken: "seed-visitor-003", userAgent: "SeedAgent/1.0" },
      ],
      conversions: [],
    });

    const seededWeddingPlanning = await seedWeddingPlanningDemo(client, {
      customerOne,
      customerTwo,
      offeringA,
      offeringB,
    });

    const orderScenarios = [
      {
        orderNumber: "PL-DEMO-001",
        customer: customerOne,
        provider: providerAlpha,
        providerPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
        notes: "Demo order pending provider confirmation.",
        assignmentStatus: "pending_confirmation",
        internalNote: "Don demo 001 dang cho provider xac nhan.",
        providerNote: "",
        providerReference: "",
        items: [{ offering: offeringA, quantity: 1, unitPrice: offeringA.price || 990000 }],
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 001." },
        ],
      },
      {
        orderNumber: "PL-DEMO-002",
        customer: customerOne,
        provider: providerAlpha,
        providerPortalSlug: "xuong-in-alpha",
        customerName: "Nguyen Lan",
        customerEmail: "customer.one@pinklove.local",
        customerPhone: "0900000011",
        orderStatus: "processing",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Demo order in progress by provider Alpha.",
        assignmentStatus: "in_progress",
        internalNote: "Don in gap can theo doi hang ngay.",
        providerNote: "Da duyet file va dang san xuat.",
        providerReference: "ALPHA-002",
        acceptedAt: "2026-04-10T08:00:00.000Z",
        items: [
          { offering: offeringA, quantity: 1, unitPrice: offeringA.price || 990000 },
          { offering: offeringB, quantity: 1, unitPrice: offeringB.price || 1290000 },
        ],
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 002." },
          { actorUserId: providerAlpha.id, actorType: "provider", eventType: "status_changed", message: "Provider đã cập nhật trạng thái sang in_progress." },
          { actorUserId: providerAlpha.id, actorType: "provider", eventType: "note_added", message: "Provider note: Da duyet file va dang san xuat." },
        ],
      },
      {
        orderNumber: "PL-DEMO-003",
        customer: customerTwo,
        provider: providerBeta,
        providerPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "ready_to_ship",
        paymentStatus: "paid",
        fulfillmentStatus: "processing",
        notes: "Demo order waiting admin review.",
        assignmentStatus: "ready_for_review",
        internalNote: "Cho admin review mau in.",
        providerNote: "Da in xong mau, cho duyet.",
        providerReference: "BETA-003",
        acceptedAt: "2026-04-09T09:30:00.000Z",
        items: [{ offering: offeringC, quantity: 2, unitPrice: offeringC.price || 500000 }],
        affiliateUserId: affiliateRose.id,
        affiliateCode: "rose-love",
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 003." },
          { actorUserId: providerBeta.id, actorType: "provider", eventType: "status_changed", message: "Provider đã cập nhật trạng thái sang ready_for_review." },
          { actorUserId: providerBeta.id, actorType: "provider", eventType: "note_added", message: "Provider note: Da in xong mau, cho duyet." },
        ],
      },
      {
        orderNumber: "PL-DEMO-004",
        customer: customerTwo,
        provider: providerBeta,
        providerPortalSlug: "xuong-in-beta",
        customerName: "Tran Minh",
        customerEmail: "customer.two@pinklove.local",
        customerPhone: "0900000012",
        orderStatus: "completed",
        paymentStatus: "paid",
        fulfillmentStatus: "delivered",
        notes: "Demo order completed for reporting views.",
        assignmentStatus: "completed",
        internalNote: "Da giao xong don test 004.",
        providerNote: "Da giao hang thanh cong.",
        providerReference: "BETA-004",
        acceptedAt: "2026-04-08T10:00:00.000Z",
        completedAt: "2026-04-11T16:30:00.000Z",
        items: [{ offering: offeringB, quantity: 1, unitPrice: offeringB.price || 1290000 }],
        events: [
          { actorUserId: null, actorType: "system", eventType: "assignment_created", message: "System seeded assignment for demo order 004." },
          { actorUserId: providerBeta.id, actorType: "provider", eventType: "status_changed", message: "Provider đã cập nhật trạng thái sang completed." },
          { actorUserId: providerBeta.id, actorType: "provider", eventType: "note_added", message: "Provider note: Da giao hang thanh cong." },
        ],
      },
    ];

    const seededOrders = [];

    for (const scenario of orderScenarios) {
      const subtotal = sumItems(scenario.items);
      const order = await upsertOrder(client, {
        orderNumber: scenario.orderNumber,
        userId: scenario.customer.id,
        customerName: scenario.customerName,
        customerEmail: scenario.customerEmail,
        customerPhone: scenario.customerPhone,
        orderStatus: scenario.orderStatus,
        paymentStatus: scenario.paymentStatus,
        fulfillmentStatus: scenario.fulfillmentStatus,
        subtotal,
        total: subtotal,
        notes: scenario.notes,
        affiliateUserId: scenario.affiliateUserId,
        affiliateCode: scenario.affiliateCode,
      });

      await createOrderItems(client, order.id, scenario.items);
      await createPayment(client, order.id, subtotal, `PAY-${scenario.orderNumber}`);

      const assignment = await createProviderAssignment(client, {
        orderId: order.id,
        providerId: scenario.provider.id,
        status: scenario.assignmentStatus,
        internalNote: scenario.internalNote,
        providerNote: scenario.providerNote,
        providerReference: scenario.providerReference,
        acceptedAt: scenario.acceptedAt,
        completedAt: scenario.completedAt,
        events: scenario.events,
      });

      seededOrders.push({
        orderNumber: scenario.orderNumber,
        assignmentId: assignment.id,
        provider: scenario.provider.username,
        orderDetailLink: withBaseUrl(`/provider/orders/${assignment.id}`),
        portalLink: withBaseUrl(`/provider`),
      });
    }

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          password: PASSWORD,
          website: {
            home: withBaseUrl("/"),
            templates: withBaseUrl("/mau-thiep"),
            invitations: withBaseUrl("/customer/invitations"),
            blog: withBaseUrl("/blog"),
            contact: withBaseUrl("/lien-he"),
          },
          providers: [
            {
              username: providerAlpha.username,
              portalLink: withBaseUrl("/provider"),
            },
            {
              username: providerBeta.username,
              portalLink: withBaseUrl("/provider"),
            },
          ],
          customers: [
            { username: customerOne.username, loginLink: withBaseUrl("/customer/login") },
            { username: customerTwo.username, loginLink: withBaseUrl("/customer/login") },
          ],
          affiliates: [
            { username: affiliateRose.username, code: "rose-love" },
            { username: affiliateNova.username, code: "nova-plan" },
          ],
          weddingPlanning: seededWeddingPlanning,
          orders: seededOrders,
          notes: [
            "Khong tao admin moi. Hay dung admin co san cua he thong de test admin area.",
            "Script nay gia dinh migration + offering/blog/page seed he thong da duoc bootstrap sau khi chay `./setup up`.",
          ],
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
