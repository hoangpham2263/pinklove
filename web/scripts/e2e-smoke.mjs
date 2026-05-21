import { Client } from "pg";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const PASSWORD = "12313";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const state = {
  userUsername: `smoke_user_${runId}`.toLowerCase(),
  affiliateCode: `smoke-${runId}`.toLowerCase(),
  codedSiteSlug: `smoke-coded-${runId}`.toLowerCase(),
  builderSiteSlug: `smoke-builder-${runId}`.toLowerCase(),
  adminManagedUsername: `smoke_admin_user_${runId}`.toLowerCase(),
  productSlug: `smoke-product-${runId}`.toLowerCase(),
  pageMarker: `Smoke page marker ${runId}`,
  menuLabel: `Header Smoke ${runId}`,
};

const restore = {
  page: null,
  menu: null,
};

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function log(message) {
  console.log(message);
}

async function step(name, fn) {
  log(`\n[step] ${name}`);
  const started = Date.now();
  try {
    const result = await fn();
    log(`[pass] ${name} (${Date.now() - started}ms)`);
    return result;
  } catch (error) {
    log(`[fail] ${name}`);
    throw error;
  }
}

function encodeFormBody(form) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  return params;
}

class Session {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }

  cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  storeSetCookie(headers) {
    const cookieHeaders =
      typeof headers.getSetCookie === "function"
        ? headers.getSetCookie()
        : headers.get("set-cookie")
          ? [headers.get("set-cookie")]
          : [];

    for (const header of cookieHeaders) {
      if (!header) continue;
      const firstPart = header.split(";")[0];
      const eqIndex = firstPart.indexOf("=");
      if (eqIndex < 0) continue;
      const key = firstPart.slice(0, eqIndex).trim();
      const value = firstPart.slice(eqIndex + 1).trim();
      if (!key) continue;
      if (!value) {
        this.cookies.delete(key);
        continue;
      }
      this.cookies.set(key, value);
    }
  }

  async request(path, init = {}) {
    const headers = new Headers(init.headers ?? {});
    const cookie = this.cookieHeader();
    if (cookie) {
      headers.set("cookie", cookie);
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      redirect: init.redirect ?? "manual",
    });

    this.storeSetCookie(response.headers);
    return response;
  }

  async getText(path, expectedStatus = 200) {
    const response = await this.request(path);
    const text = await response.text();
    assert(
      response.status === expectedStatus,
      `${this.name} GET ${path} expected ${expectedStatus}, received ${response.status}\n${text.slice(0, 400)}`
    );
    return text;
  }

  async getJson(path, expectedStatus = 200) {
    const response = await this.request(path, {
      headers: {
        accept: "application/json",
      },
    });
    const text = await response.text();
    assert(
      response.status === expectedStatus,
      `${this.name} GET ${path} expected ${expectedStatus}, received ${response.status}\n${text.slice(0, 400)}`
    );
    return text ? JSON.parse(text) : null;
  }

  async postForm(path, form, expectedStatus = 303) {
    const response = await this.request(path, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: encodeFormBody(form).toString(),
    });
    const text = await response.text();
    assert(
      response.status === expectedStatus,
      `${this.name} POST ${path} expected ${expectedStatus}, received ${response.status}\n${text.slice(0, 400)}`
    );
    return {
      response,
      text,
      location: response.headers.get("location"),
    };
  }

  async postMultipart(path, formData, expectedStatus) {
    const response = await this.request(path, {
      method: "POST",
      body: formData,
    });
    const text = await response.text();
    assert(
      response.status === expectedStatus,
      `${this.name} POST ${path} expected ${expectedStatus}, received ${response.status}\n${text.slice(0, 400)}`
    );
    return text ? JSON.parse(text) : null;
  }

  async delete(path, expectedStatus = 200) {
    const response = await this.request(path, {
      method: "DELETE",
      headers: {
        accept: "application/json",
      },
    });
    const text = await response.text();
    assert(
      response.status === expectedStatus,
      `${this.name} DELETE ${path} expected ${expectedStatus}, received ${response.status}\n${text.slice(0, 400)}`
    );
    return text ? JSON.parse(text) : null;
  }
}

async function fetchRow(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0] ?? null;
}

async function fetchValue(client, sql, params = [], key = "value") {
  const row = await fetchRow(client, sql, params);
  return row?.[key] ?? null;
}

async function tableExists(client, tableName) {
  const exists = await fetchValue(
    client,
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS value
    `,
    [tableName]
  );

  return Boolean(exists);
}

function expectLocation(location, expectedPrefix) {
  assert(Boolean(location), `Missing redirect location, expected ${expectedPrefix}`);
  assert(
    location.startsWith(expectedPrefix),
    `Unexpected redirect location ${location}, expected prefix ${expectedPrefix}`
  );
}

async function main() {
  assert(process.env.DATABASE_URL, "DATABASE_URL is required for smoke test");

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await db.connect();
  const pageTable = (await tableExists(db, "managed_pages")) ? "managed_pages" : "cms_pages";
  const menusTable = (await tableExists(db, "navigation_menus")) ? "navigation_menus" : "cms_menus";
  const menuItemsTable = (await tableExists(db, "navigation_menu_items")) ? "navigation_menu_items" : "cms_menu_items";

  const guest = new Session("guest");
  const user = new Session("user");
  const admin = new Session("admin");

  try {
    await step("public pages respond", async () => {
      for (const path of [
        "/",
        "/gioi-thieu",
        "/lien-he",
        "/mau-thiep",
        "/mau-thiep/mau-thiep-cuoi-golden-aisle",
        "/tu-tao-thiep",
        "/tu-tao-thiep/mau-thiep-cuoi-editorial-story",
        "/login",
        "/register",
        "/admin/login",
      ]) {
        const html = await guest.getText(path);
        assert(html.includes("<html"), `Page ${path} did not render HTML`);
      }
    });

    await step("guest access control works", async () => {
      const dashboardResponse = await guest.request("/customer/dashboard");
      assert(dashboardResponse.status === 307, `Expected 307 for guest dashboard, got ${dashboardResponse.status}`);
      expectLocation(dashboardResponse.headers.get("location"), "/login");

      const mediaUnauthorized = await guest.request("/api/media", {
        headers: { accept: "application/json" },
      });
      const mediaUnauthorizedBody = await mediaUnauthorized.text();
      assert(mediaUnauthorized.status === 401, `Expected 401 for guest media, got ${mediaUnauthorized.status}`);
      assert(mediaUnauthorizedBody.includes("Unauthorized"), "Guest media should return Unauthorized");
    });

    await step("register new user and reach protected pages", async () => {
      const register = await user.postForm("/api/auth/register", {
        username: state.userUsername,
        password: PASSWORD,
      });
      expectLocation(register.location, "/customer/dashboard");
      assert(user.cookies.has("pinklove_session"), "User session cookie was not set after register");

      for (const path of [
        "/customer/dashboard",
        "/customer/config/profile",
        "/customer/config",
        "/customer/invitations",
        "/customer/affiliate",
      ]) {
        const html = await user.getText(path);
        assert(html.includes("<html"), `Protected page ${path} did not render HTML`);
      }
    });

    await step("user profile update persists", async () => {
      const save = await user.postForm("/api/customer/profile", {
        fullName: "Smoke Test User",
        displayName: "Smoke User",
        phone: "0900000000",
        bio: `Bio ${runId}`,
      });
      expectLocation(save.location, "/customer/config/profile?saved=1");

      const profileRow = await fetchRow(
        db,
        `
          SELECT up.full_name, up.display_name, up.phone, up.bio
          FROM user_profiles up
          JOIN users u ON u.id = up.user_id
          WHERE u.username = $1
          LIMIT 1
        `,
        [state.userUsername]
      );
      assert(profileRow?.full_name === "Smoke Test User", "Profile full_name was not persisted");
      assert(profileRow?.display_name === "Smoke User", "Profile display_name was not persisted");
      assert(profileRow?.phone === "0900000000", "Profile phone was not persisted");
    });

    await step("affiliate apply works", async () => {
      const apply = await user.postForm("/api/customer/affiliate/apply", {
        preferredCode: state.affiliateCode,
      });
      expectLocation(apply.location, "/customer/affiliate");

      const affiliate = await fetchRow(
        db,
        `
          SELECT aa.code, aa.status
          FROM affiliate_accounts aa
          JOIN users u ON u.id = aa.user_id
          WHERE u.username = $1
          LIMIT 1
        `,
        [state.userUsername]
      );
      assert(affiliate?.code === state.affiliateCode, "Affiliate code was not saved");
      assert(affiliate?.status === "pending", "Affiliate status should start as pending");
    });

    let codedSiteId = "";
    await step("coded template site can be created, edited, and published", async () => {
      const create = await user.postForm("/api/customer/invitations/create-from-product", {
        productSlug: "mau-thiep-cuoi-golden-aisle",
      });
      expectLocation(create.location, "/customer/invitations/");
      codedSiteId = create.location.split("/").pop();
      assert(Boolean(codedSiteId), "Failed to resolve coded site id");

      const editor = await user.getText(`/customer/invitations/${codedSiteId}`);
      assert(editor.includes("Golden Aisle"), "Coded site editor did not load expected product");

      const update = await user.postForm("/api/customer/invitations/update", {
        siteId: codedSiteId,
        title: "Smoke Coded Site",
        slug: state.codedSiteSlug,
        status: "published",
        templateKey: "golden_aisle",
        brideName: "Alice",
        groomName: "Bob",
        heroSubtitle: "Thu moi smoke test",
        eventDate: "21.12.2026",
        venue: "Smoke Venue",
        gallery: "https://example.com/a.jpg\nhttps://example.com/b.jpg",
        storyTitle: "Smoke Story",
        storyBody: `Story ${runId}`,
      });
      expectLocation(update.location, `/customer/invitations/${codedSiteId}`);

      const siteRow = await fetchRow(
        db,
        "SELECT slug, status, custom_data FROM wedding_sites WHERE id::text = $1 LIMIT 1",
        [codedSiteId]
      );
      assert(siteRow?.slug === state.codedSiteSlug, "Coded site slug was not updated");
      assert(siteRow?.status === "published", "Coded site should be published");
      assert(siteRow?.custom_data?.brideName === "Alice", "Coded site brideName missing");

      const publicHtml = await guest.getText(`/invitations/${state.codedSiteSlug}`);
      assert(publicHtml.includes("Alice"), "Public coded site is missing bride name");
      assert(publicHtml.includes("Bob"), "Public coded site is missing groom name");
      assert(publicHtml.includes("Smoke Story"), "Public coded site is missing custom content");
    });

    let builderSiteId = "";
    await step("builder site can be created, edited with groups, and published", async () => {
      const create = await user.postForm("/api/customer/invitations/create-builder", {});
      expectLocation(create.location, "/customer/design/");
      builderSiteId = create.location.split("/").pop();
      assert(Boolean(builderSiteId), "Failed to resolve builder site id");

      const editor = await user.getText(`/customer/design/${builderSiteId}`);
      assert(editor.includes("Builder"), "Builder editor page did not render");

      const builderDocument = {
        width: 1200,
        height: 2200,
        background: "#fff8fb",
        nodes: [
          {
            id: "group-smoke",
            type: "group",
            x: 100,
            y: 120,
            width: 760,
            height: 320,
            nodes: [
              {
                id: "shape-smoke",
                type: "shape",
                x: 0,
                y: 0,
                width: 760,
                height: 320,
                rotation: 0,
                opacity: 1,
                fill: "#ffe4ec",
                cornerRadius: 32,
              },
              {
                id: "text-smoke",
                type: "text",
                x: 40,
                y: 60,
                width: 680,
                rotation: 0,
                opacity: 1,
                text: `Builder Smoke ${runId}`,
                fontSize: 44,
                fontFamily: "Georgia",
                fontStyle: "bold",
                fill: "#6f1d3a",
                align: "center",
              },
            ],
          },
        ],
      };

      const update = await user.postForm("/api/customer/invitations/update", {
        siteId: builderSiteId,
        title: "Smoke Builder Site",
        slug: state.builderSiteSlug,
        status: "published",
        templateKey: "freeform_sections",
        builderDocument: JSON.stringify(builderDocument),
      });
      expectLocation(update.location, `/customer/design/${builderSiteId}`);

      const siteRow = await fetchRow(
        db,
        "SELECT slug, status, custom_data FROM wedding_sites WHERE id::text = $1 LIMIT 1",
        [builderSiteId]
      );
      assert(siteRow?.slug === state.builderSiteSlug, "Builder site slug was not updated");
      assert(siteRow?.status === "published", "Builder site should be published");
      assert(siteRow?.custom_data?.builderDocument?.height === 2200, "Builder document height was not saved");
      assert(siteRow?.custom_data?.builderDocument?.nodes?.[0]?.type === "group", "Builder group node was not saved");

      const publicHtml = await guest.getText(`/invitations/${state.builderSiteSlug}`);
      assert(publicHtml.includes(`Builder Smoke ${runId}`), "Public builder site is missing grouped text");
    });

    await step("media API works for authenticated user", async () => {
      const listBefore = await user.getJson("/api/media");
      assert(Array.isArray(listBefore?.items), "Media list should return items array");

      const gifBytes = Uint8Array.from([
        71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255,
        33, 249, 4, 1, 10, 0, 1, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
      ]);
      const formData = new FormData();
      formData.set("file", new File([gifBytes], "smoke.gif", { type: "image/gif" }));

      const upload = await user.postMultipart("/api/media", formData, 201);
      assert(upload?.item?.id, "Media upload did not return id");
      assert(upload?.item?.url?.startsWith("/uploads/"), "Media upload did not return expected url");

      const listAfter = await user.getJson("/api/media");
      const uploaded = listAfter.items.find((item) => item.id === upload.item.id);
      assert(Boolean(uploaded), "Uploaded media item did not appear in listing");

      const deleted = await user.delete(`/api/media?id=${encodeURIComponent(upload.item.id)}`);
      assert(deleted?.ok === true, "Media delete did not return ok=true");
    });

    await step("admin login and protected pages work", async () => {
      const login = await admin.postForm("/api/admin/auth/login", {
        username: "admin",
        password: PASSWORD,
      });
      expectLocation(login.location, "/admin/dashboard");
      assert(admin.cookies.has("pinklove_session"), "Admin session cookie was not set");

      for (const path of [
        "/admin/dashboard",
        "/admin/config",
        "/admin/users",
        "/admin/products",
        "/admin/product-templates/mau-thiep-cuoi-golden-aisle",
        "/admin/pages",
        "/admin/pages/gioi-thieu",
        "/admin/menus",
        "/admin/menus/1",
        "/admin/affiliates",
        "/admin/media",
      ]) {
        const html = await admin.getText(path);
        assert(html.includes("<html"), `Admin page ${path} did not render HTML`);
      }
    });

    await step("admin affiliate approval works", async () => {
      const smokeUserId = await fetchValue(
        db,
        "SELECT id AS value FROM users WHERE username = $1 LIMIT 1",
        [state.userUsername]
      );
      assert(smokeUserId, "Smoke user id not found");

      const update = await admin.postForm("/api/admin/affiliates/update", {
        userId: smokeUserId,
        status: "active",
        commissionType: "percent",
        commissionValue: "12",
        notes: `Approved ${runId}`,
      });
      expectLocation(update.location, "/admin/affiliates/accounts");

      const affiliate = await fetchRow(
        db,
        "SELECT status, commission_type, commission_value, notes FROM affiliate_accounts WHERE user_id = $1 LIMIT 1",
        [smokeUserId]
      );
      assert(affiliate?.status === "active", "Affiliate status was not updated to active");
      assert(affiliate?.commission_type === "percent", "Affiliate commission_type was not saved");
      assert(Number(affiliate?.commission_value) === 12, "Affiliate commission_value was not saved");
    });

    let managedUserId = "";
    await step("admin can create, update, change role, and delete users", async () => {
      const create = await admin.postForm("/api/admin/users/create", {
        username: state.adminManagedUsername,
        password: PASSWORD,
        role: "CUSTOMER",
      });
      expectLocation(create.location, "/admin/users");

      managedUserId = await fetchValue(
        db,
        "SELECT id AS value FROM users WHERE username = $1 LIMIT 1",
        [state.adminManagedUsername]
      );
      assert(managedUserId, "Admin-created user was not found");

      const update = await admin.postForm("/api/admin/users/update", {
        userId: managedUserId,
        username: state.adminManagedUsername,
        password: PASSWORD,
        role: "CUSTOMER",
        fullName: "Managed User",
        displayName: "Managed Display",
        phone: "0911111111",
        bio: `Managed bio ${runId}`,
      });
      expectLocation(update.location, `/admin/users/${managedUserId}`);

      const profile = await fetchRow(
        db,
        `
          SELECT u.username, u.role, up.full_name, up.display_name, up.phone
          FROM users u
          LEFT JOIN user_profiles up ON up.user_id = u.id
          WHERE u.id = $1
          LIMIT 1
        `,
        [managedUserId]
      );
      assert(profile?.username === state.adminManagedUsername, "Admin update did not preserve username");
      assert(profile?.full_name === "Managed User", "Admin update did not save user profile");

      const promote = await admin.postForm("/api/admin/users/role", {
        userId: managedUserId,
        role: "ADMIN",
      });
      expectLocation(promote.location, "/admin/users");

      const roleAfterPromote = await fetchValue(
        db,
        "SELECT role AS value FROM users WHERE id = $1 LIMIT 1",
        [managedUserId]
      );
      assert(roleAfterPromote === "ADMIN", "User was not promoted to admin");

      const demote = await admin.postForm("/api/admin/users/role", {
        userId: managedUserId,
        role: "CUSTOMER",
      });
      expectLocation(demote.location, "/admin/users");

      const roleAfterDemote = await fetchValue(
        db,
        "SELECT role AS value FROM users WHERE id = $1 LIMIT 1",
        [managedUserId]
      );
      assert(roleAfterDemote === "CUSTOMER", "User was not demoted to customer");

      const remove = await admin.postForm("/api/admin/users/delete", {
        userId: managedUserId,
      });
      expectLocation(remove.location, "/admin/users");

      const gone = await fetchValue(
        db,
        "SELECT id AS value FROM users WHERE id = $1 LIMIT 1",
        [managedUserId]
      );
      assert(gone === null, "Admin user delete did not remove the account");
    });

    await step("admin cannot create coded template products from admin", async () => {
      const create = await admin.postForm("/api/admin/products/create", {
        name: "Smoke Product",
        slug: state.productSlug,
        productType: "coded_template",
        templateKey: "golden_aisle",
      });
      expectLocation(create.location, "/admin/products");

      const gone = await fetchValue(
        db,
        "SELECT slug AS value FROM products WHERE slug = $1 LIMIT 1",
        [state.productSlug]
      );
      assert(gone === null, "Coded template admin create should not create a new product");
    });

    await step("admin can update CMS page and published page reflects it", async () => {
      restore.page = await fetchRow(
        db,
        `
          SELECT slug, name, title, excerpt, body, status, seo_title, seo_description,
                 seo_keywords, canonical_url, og_title, og_description, og_image,
                 noindex, nofollow, custom_fields
          FROM ${pageTable}
          WHERE slug = 'gioi-thieu'
          LIMIT 1
        `
      );
      assert(restore.page, "gioi-thieu page not found for restore");

      const update = await admin.postForm("/api/admin/pages/update", {
        originalSlug: "gioi-thieu",
        slug: "gioi-thieu",
        name: restore.page.name,
        title: "About Us Smoke",
        excerpt: restore.page.excerpt ?? "",
        body: `${restore.page.body ?? ""}\n\n${state.pageMarker}`,
        status: "published",
        seoTitle: restore.page.seo_title ?? "",
        seoDescription: restore.page.seo_description ?? "",
        seoKeywords: restore.page.seo_keywords ?? "",
        canonicalUrl: restore.page.canonical_url ?? "",
        ogTitle: restore.page.og_title ?? "",
        ogDescription: restore.page.og_description ?? "",
        ogImage: restore.page.og_image ?? "",
        noindex: restore.page.noindex ? "on" : "",
        nofollow: restore.page.nofollow ? "on" : "",
        customFields: JSON.stringify(restore.page.custom_fields ?? {}),
      });
      expectLocation(update.location, "/admin/pages/gioi-thieu");

      const publicHtml = await guest.getText("/gioi-thieu");
      assert(publicHtml.includes(state.pageMarker), "Published gioi-thieu page did not reflect updated body");
    });

    await step("admin can update menus", async () => {
      restore.menu = await fetchRow(
        db,
        `
          SELECT
            m.id,
            m.label,
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'label', mi.label,
                    'type', mi.type,
                    'pageSlug', mi.page_slug,
                    'url', mi.url,
                    'position', mi.position
                  )
                  ORDER BY mi.position ASC
                )
                FROM ${menuItemsTable} mi
                WHERE mi.menu_id = m.id
              ),
              '[]'::json
            ) AS items
          FROM ${menusTable} m
          WHERE m.name = 'header'
          LIMIT 1
        `
      );
      assert(restore.menu?.id, "Header menu not found");

      const items = [
        { label: "About Us", type: "page", pageSlug: "gioi-thieu", url: null, position: 0 },
        { label: `Smoke Link ${runId}`, type: "custom", pageSlug: null, url: "/smoke-link", position: 1 },
      ];

      const update = await admin.postForm("/api/admin/menus/update", {
        id: restore.menu.id,
        label: state.menuLabel,
        items: JSON.stringify(items),
      });
      expectLocation(update.location, "/admin/menus/header");

      const menuRow = await fetchRow(
        db,
        `
          SELECT
            m.label,
            (
              SELECT COUNT(*)::text
              FROM ${menuItemsTable} mi
              WHERE mi.menu_id = m.id
            ) AS item_count
          FROM ${menusTable} m
          WHERE m.id = $1
          LIMIT 1
        `,
        [restore.menu.id]
      );
      assert(menuRow?.label === state.menuLabel, "Menu label was not updated");
      assert(menuRow?.item_count === "2", "Menu items were not replaced");
    });

    await step("logout works for user session", async () => {
      const logout = await user.postForm("/api/auth/logout", {});
      expectLocation(logout.location, "/");

      const response = await user.request("/customer/dashboard");
      assert(response.status === 307, `Expected 307 after logout, got ${response.status}`);
      expectLocation(response.headers.get("location"), "/login");
    });

    log("\nSmoke test completed successfully.");
    log(`User tested: ${state.userUsername}`);
    log(`Coded site: /invitations/${state.codedSiteSlug}`);
    log(`Builder site: /invitations/${state.builderSiteSlug}`);
  } finally {
    if (restore.page) {
      await db.query(
        `
          UPDATE ${pageTable}
          SET
            name = $2,
            title = $3,
            excerpt = $4,
            body = $5,
            status = $6,
            seo_title = $7,
            seo_description = $8,
            seo_keywords = $9,
            canonical_url = $10,
            og_title = $11,
            og_description = $12,
            og_image = $13,
            noindex = $14,
            nofollow = $15,
            custom_fields = $16,
            updated_at = NOW()
          WHERE slug = $1
        `,
        [
          restore.page.slug,
          restore.page.name,
          restore.page.title,
          restore.page.excerpt,
          restore.page.body,
          restore.page.status,
          restore.page.seo_title,
          restore.page.seo_description,
          restore.page.seo_keywords,
          restore.page.canonical_url,
          restore.page.og_title,
          restore.page.og_description,
          restore.page.og_image,
          restore.page.noindex,
          restore.page.nofollow,
          restore.page.custom_fields ?? {},
        ]
      );
    }

    if (restore.menu?.id) {
      await db.query(`UPDATE ${menusTable} SET label = $1, updated_at = NOW() WHERE id = $2`, [
        restore.menu.label,
        restore.menu.id,
      ]);
      await db.query(`DELETE FROM ${menuItemsTable} WHERE menu_id = $1`, [restore.menu.id]);

      const items = Array.isArray(restore.menu.items) ? restore.menu.items : [];
      for (const item of items) {
        await db.query(
          `
            INSERT INTO ${menuItemsTable} (menu_id, label, type, page_slug, url, position)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            restore.menu.id,
            item.label,
            item.type,
            item.pageSlug ?? null,
            item.url ?? null,
            item.position,
          ]
        );
      }
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error("\nSmoke test failed:");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
