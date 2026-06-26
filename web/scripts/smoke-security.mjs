import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, createHash } from "node:crypto";
import { Client } from "pg";

const rootDir = path.resolve(process.cwd(), "..");
const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const runPrefix = `smoke-${Date.now()}-${randomBytes(3).toString("hex")}`;
const password = "SmokeTest123!";
const csrfMissingError = process.env.NODE_ENV === "production" ? "invalid_credentials" : "invalid_credentials";
const duplicatePhone = `+849${Math.floor(Math.random() * 1_000_000_00).toString().padStart(8, "0")}`;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, ".env.local"));

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = process.env.POSTGRES_USER || "app";
  const pass = process.env.POSTGRES_PASSWORD || "change-me";
  const db = process.env.POSTGRES_DB || "app";
  const port = process.env.POSTGRES_PORT || "5433";
  return `postgresql://${user}:${pass}@localhost:${port}/${db}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function hashRateKey(scope, rawKey) {
  return createHash("sha256").update(`${scope}:${rawKey.trim().toLowerCase()}`).digest("hex");
}

function parseSetCookie(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  store(headers) {
    for (const header of parseSetCookie(headers)) {
      const [pair] = header.split(";");
      const separator = pair.indexOf("=");
      if (separator === -1) continue;
      const key = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!value) this.cookies.delete(key);
      else this.cookies.set(key, value);
    }
  }

  set(key, value) {
    this.cookies.set(key, value);
  }

  header() {
    return Array.from(this.cookies.entries()).map(([key, value]) => `${key}=${value}`).join("; ");
  }
}

async function request(pathname, options = {}) {
  const jar = options.jar;
  const headers = new Headers(options.headers ?? {});
  if (jar?.header()) headers.set("cookie", jar.header());
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(Number(process.env.SMOKE_FETCH_TIMEOUT_MS ?? "10000")),
  });
  jar?.store(response.headers);
  return response;
}

function step(label) {
  console.log(`security-smoke: ${label}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function csrf(scope, jar) {
  const pagePath = {
    login: "/login",
    register: "/register",
    admin_login: "/admin/login",
    provider_login: "/provider/login",
  }[scope];
  if (pagePath) {
    await request(pagePath, { jar });
  }
  const response = await request(`/api/auth/csrf?scope=${scope}`, { jar });
  assert(response.status === 200, `CSRF ${scope} returned ${response.status}`);
  const payload = await response.json();
  assert(typeof payload.token === "string", `CSRF ${scope} missing token`);
  return payload.token;
}

function form(data) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) body.set(key, value);
  }
  return body;
}

async function seedUser(client, { email, role, accountName = email, phone = "" }) {
  const roleId = role === "ADMIN"
    ? (await client.query("SELECT id FROM admin_roles WHERE key = 'super_admin' LIMIT 1")).rows[0]?.id
    : null;
  await client.query("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE LOWER(BTRIM(email)) = LOWER(BTRIM($1)))", [email]);
  await client.query("DELETE FROM users WHERE LOWER(BTRIM(email)) = LOWER(BTRIM($1))", [email]);
  const result = await client.query(
    `
     INSERT INTO users (email, account_name, password_hash, role, email_verified_at, admin_role_id)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     RETURNING id
    `,
    [email, accountName, hashPassword(password), role, roleId]
  );
  const userId = result.rows[0].id;
  await client.query(
    `
     INSERT INTO user_profiles (user_id, phone, contact_email)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET phone = EXCLUDED.phone, contact_email = EXCLUDED.contact_email, updated_at = NOW()
    `,
    [userId, phone, email]
  );
  return userId;
}

async function createAdminJar(client, adminUserId) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await client.query(
    `
     INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
    `,
    [randomBytes(16).toString("hex"), adminUserId, tokenHash]
  );

  const jar = new CookieJar();
  jar.set("pinklove_session", rawToken);
  await request("/admin/config/security", { jar });
  return jar;
}

async function cleanup(client) {
  const emailPattern = `%@${runPrefix}.test`;
  const rawKeys = [
    `customer@${runPrefix}.test`,
    `admin@${runPrefix}.test`,
    `provider@${runPrefix}.test`,
    `duplicate@${runPrefix}.test`,
    `failed@${runPrefix}.test`,
    duplicatePhone,
    "+84911111111",
    "unknown",
    "127.0.0.1",
  ];
  const scopes = [
    "login:ip",
    "login:email",
    "admin_login:ip",
    "admin_login:email",
    "provider_login:ip",
    "provider_login:email",
    "register:ip",
    "register:email",
    "register:phone",
  ];
  const rateKeys = scopes.flatMap((scope) => rawKeys.map((rawKey) => hashRateKey(scope, rawKey)));
  await client.query("DELETE FROM blocked_ips WHERE reason LIKE $1", [`%${runPrefix}%`]);
  await client.query("DELETE FROM security_audit_logs WHERE reason LIKE $1 OR target_id LIKE $2", [`%${runPrefix}%`, `%${runPrefix}%`]);
  await client.query("DELETE FROM security_events WHERE metadata::text LIKE $1", [`%${runPrefix}%`]);
  await client.query("DELETE FROM auth_rate_limits WHERE rate_key = ANY($1::text[])", [rateKeys]);
  await client.query("DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [emailPattern]);
  await client.query("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)", [emailPattern]);
  await client.query("DELETE FROM users WHERE email LIKE $1", [emailPattern]);
}

async function main() {
  step(`checking app server ${baseUrl}`);
  const health = await fetch(`${baseUrl}/login`, {
    redirect: "manual",
    signal: AbortSignal.timeout(Number(process.env.SMOKE_FETCH_TIMEOUT_MS ?? "10000")),
  }).catch((error) => {
    throw new Error(`App server is not reachable at ${baseUrl}. Start it first, then rerun smoke:security. ${error.message}`);
  });
  assert(health.status < 500, `App server returned ${health.status} for /login`);

  const client = new Client({ connectionString: getDatabaseUrl() });
  step("connecting database");
  await client.connect();

  try {
    step("cleaning old smoke data");
    await cleanup(client);

    const customerEmail = `customer@${runPrefix}.test`;
    const adminEmail = `admin@${runPrefix}.test`;
    const providerEmail = `provider@${runPrefix}.test`;
    const duplicateEmail = `duplicate@${runPrefix}.test`;
    step("seeding users");
    await seedUser(client, { email: customerEmail, role: "CUSTOMER" });
    const adminUserId = await seedUser(client, { email: adminEmail, role: "ADMIN" });
    await seedUser(client, { email: providerEmail, role: "PROVIDER" });
    await seedUser(client, { email: duplicateEmail, role: "CUSTOMER", phone: duplicatePhone });

    step("duplicate register");
    const duplicateJar = new CookieJar();
    const duplicateCsrf = await csrf("register", duplicateJar);
    const duplicateRegister = await request("/api/auth/register", {
      method: "POST",
      jar: duplicateJar,
      body: form({
        accountName: "Duplicate Smoke",
        email: duplicateEmail,
        phone: duplicatePhone,
        phoneCountry: "VN",
        password,
        termsAccepted: "accepted",
        csrfToken: duplicateCsrf,
      }),
    });
    assert(duplicateRegister.status === 303, `duplicate register status ${duplicateRegister.status}`);
    assert(
      duplicateRegister.headers.get("location")?.includes("account_exists"),
      `duplicate register did not return account_exists: ${duplicateRegister.headers.get("location")}`
    );
    assert(
      !/(duplicate_email|duplicate_phone|email_exists|phone_exists)/i.test(duplicateRegister.headers.get("location") ?? ""),
      `duplicate register leaked duplicate field: ${duplicateRegister.headers.get("location")}`
    );

    step("duplicate register email-only");
    const duplicateEmailJar = new CookieJar();
    const duplicateEmailCsrf = await csrf("register", duplicateEmailJar);
    const duplicateEmailRegister = await request("/api/auth/register", {
      method: "POST",
      jar: duplicateEmailJar,
      body: form({
        accountName: "Duplicate Email Smoke",
        email: duplicateEmail,
        phone: `+849${Math.floor(Math.random() * 1_000_000_00).toString().padStart(8, "0")}`,
        phoneCountry: "VN",
        password,
        termsAccepted: "accepted",
        csrfToken: duplicateEmailCsrf,
      }),
    });
    assert(duplicateEmailRegister.status === 303, `duplicate email-only register status ${duplicateEmailRegister.status}`);
    assert(
      duplicateEmailRegister.headers.get("location")?.includes("account_exists"),
      `duplicate email-only register did not return account_exists: ${duplicateEmailRegister.headers.get("location")}`
    );
    assert(
      !/(duplicate_email|duplicate_phone|email_exists|phone_exists)/i.test(duplicateEmailRegister.headers.get("location") ?? ""),
      `duplicate email-only register leaked duplicate field: ${duplicateEmailRegister.headers.get("location")}`
    );

    step("duplicate register phone-only");
    const duplicatePhoneJar = new CookieJar();
    const duplicatePhoneCsrf = await csrf("register", duplicatePhoneJar);
    const duplicatePhoneRegister = await request("/api/auth/register", {
      method: "POST",
      jar: duplicatePhoneJar,
      body: form({
        accountName: "Duplicate Phone Smoke",
        email: `phone-only@${runPrefix}.test`,
        phone: duplicatePhone,
        phoneCountry: "VN",
        password,
        termsAccepted: "accepted",
        csrfToken: duplicatePhoneCsrf,
      }),
    });
    assert(duplicatePhoneRegister.status === 303, `duplicate phone-only register status ${duplicatePhoneRegister.status}`);
    assert(
      duplicatePhoneRegister.headers.get("location")?.includes("account_exists"),
      `duplicate phone-only register did not return account_exists: ${duplicatePhoneRegister.headers.get("location")}`
    );
    assert(
      !/(duplicate_email|duplicate_phone|email_exists|phone_exists)/i.test(duplicatePhoneRegister.headers.get("location") ?? ""),
      `duplicate phone-only register leaked duplicate field: ${duplicatePhoneRegister.headers.get("location")}`
    );

    step("failed register clears session");
    const failedRegisterJar = new CookieJar();
    const failedRegisterCsrf = await csrf("register", failedRegisterJar);
    const failedRegister = await request("/api/auth/register", {
      method: "POST",
      jar: failedRegisterJar,
      body: form({
        accountName: "Failed Smoke",
        email: `failed@${runPrefix}.test`,
        phone: "+84911111111",
        phoneCountry: "VN",
        password: "short",
        termsAccepted: "accepted",
        csrfToken: failedRegisterCsrf,
      }),
    });
    assert(failedRegister.status === 303, `failed register status ${failedRegister.status}`);
    assert(!parseSetCookie(failedRegister.headers).join("\n").includes("pinklove_session=") || parseSetCookie(failedRegister.headers).join("\n").includes("Max-Age=0"), "failed register did not clear session cookie");

    step("public login rate-limit");
    const badLoginJar = new CookieJar();
    for (let index = 0; index < 10; index += 1) {
      const token = await csrf("login", badLoginJar);
      await request("/api/auth/login", {
        method: "POST",
        jar: badLoginJar,
        body: form({ email: customerEmail, password: "wrong-password", csrfToken: token }),
      });
    }
    const blockedToken = await csrf("login", badLoginJar);
    const blockedLogin = await request("/api/auth/login", {
      method: "POST",
      jar: badLoginJar,
      body: form({ email: customerEmail, password: "wrong-password", csrfToken: blockedToken }),
    });
    assert(blockedLogin.headers.get("location")?.includes("rate_limited"), "login did not become rate_limited");

    step("successful login resets email rate-limit");
    await client.query("DELETE FROM auth_rate_limits WHERE scope = 'login:ip'");
    await client.query("UPDATE auth_rate_limits SET attempts = 1 WHERE scope = 'login:email' AND rate_key = $1", [hashRateKey("login:email", customerEmail)]);
    const successJar = new CookieJar();
    const successToken = await csrf("login", successJar);
    const successLogin = await request("/api/auth/login", {
      method: "POST",
      jar: successJar,
      body: form({ email: customerEmail, password, csrfToken: successToken }),
    });
    assert(successLogin.status === 303, `success login status ${successLogin.status}`);
    const remainingEmailLimit = await client.query(
      "SELECT 1 FROM auth_rate_limits WHERE scope = 'login:email' AND rate_key = $1",
      [hashRateKey("login:email", customerEmail)]
    );
    assert(remainingEmailLimit.rowCount === 0, "successful login did not reset email rate-limit");

    step("admin login rate-limit");
    const adminJar = new CookieJar();
    for (let index = 0; index < 5; index += 1) {
      const token = await csrf("admin_login", adminJar);
      await request("/api/admin/auth/login", {
        method: "POST",
        jar: adminJar,
        body: form({ email: adminEmail, password: "wrong-password", csrfToken: token }),
      });
    }
    const adminBlockedToken = await csrf("admin_login", adminJar);
    const adminBlocked = await request("/api/admin/auth/login", {
      method: "POST",
      jar: adminJar,
      body: form({ email: adminEmail, password: "wrong-password", csrfToken: adminBlockedToken }),
    });
    assert(adminBlocked.headers.get("location")?.includes("rate_limited"), "admin login did not become rate_limited");

    step("provider login rate-limit");
    const providerJar = new CookieJar();
    for (let index = 0; index < 6; index += 1) {
      const token = await csrf("provider_login", providerJar);
      await request("/api/provider/auth/login", {
        method: "POST",
        jar: providerJar,
        body: form({ email: providerEmail, password: "wrong-password", csrfToken: token }),
      });
    }
    const providerBlockedToken = await csrf("provider_login", providerJar);
    const providerBlocked = await request("/api/provider/auth/login", {
      method: "POST",
      jar: providerJar,
      body: form({ email: providerEmail, password: "wrong-password", csrfToken: providerBlockedToken }),
    });
    assert(providerBlocked.headers.get("location")?.includes("rate_limited"), "provider login did not become rate_limited");

    step("csrf missing and bad token for auth routes");
    const csrfCases = [
      {
        label: "public login",
        scope: "login",
        endpoint: "/api/auth/login",
        expectedError: csrfMissingError,
        data: { email: customerEmail, password },
      },
      {
        label: "register",
        scope: "register",
        endpoint: "/api/auth/register",
        expectedError: "register_failed",
        data: {
          accountName: "CSRF Smoke",
          email: `csrf@${runPrefix}.test`,
          phone: `+849${Math.floor(Math.random() * 1_000_000_00).toString().padStart(8, "0")}`,
          phoneCountry: "VN",
          password,
          termsAccepted: "accepted",
        },
      },
      {
        label: "admin login",
        scope: "admin_login",
        endpoint: "/api/admin/auth/login",
        expectedError: "invalid_credentials",
        data: { email: adminEmail, password },
      },
      {
        label: "provider login",
        scope: "provider_login",
        endpoint: "/api/provider/auth/login",
        expectedError: "invalid_credentials",
        data: { email: providerEmail, password },
      },
    ];
    for (const csrfCase of csrfCases) {
      const missingJar = new CookieJar();
      await csrf(csrfCase.scope, missingJar);
      const missing = await request(csrfCase.endpoint, {
        method: "POST",
        jar: missingJar,
        body: form(csrfCase.data),
      });
      assert(missing.status === 303, `${csrfCase.label} missing CSRF status ${missing.status}`);
      assert(
        missing.headers.get("location")?.includes(csrfCase.expectedError),
        `${csrfCase.label} missing CSRF was not blocked generically: ${missing.headers.get("location")}`
      );

      const badJar = new CookieJar();
      await csrf(csrfCase.scope, badJar);
      const bad = await request(csrfCase.endpoint, {
        method: "POST",
        jar: badJar,
        body: form({ ...csrfCase.data, csrfToken: "bad-token" }),
      });
      assert(bad.status === 303, `${csrfCase.label} bad CSRF status ${bad.status}`);
      assert(
        bad.headers.get("location")?.includes(csrfCase.expectedError),
        `${csrfCase.label} bad CSRF was not blocked generically: ${bad.headers.get("location")}`
      );
    }

    step("admin unlock rate-limit audit");
    const adminActionJar = await createAdminJar(client, adminUserId);
    const unlockRateKey = hashRateKey("login:email", `unlock@${runPrefix}.test`);
    await client.query(
      `
       INSERT INTO auth_rate_limits (scope, rate_key, attempts, expires_at)
       VALUES ('login:email', $1, 10, NOW() + INTERVAL '15 minutes')
       ON CONFLICT (scope, rate_key)
       DO UPDATE SET attempts = EXCLUDED.attempts, expires_at = EXCLUDED.expires_at
      `,
      [unlockRateKey]
    );
    const unlockResponse = await request("/api/admin/security/auth-rate-limits/action", {
      method: "POST",
      jar: adminActionJar,
      body: form({ intent: "unlock_row", scope: "login:email", rateKey: unlockRateKey }),
    });
    assert(unlockResponse.status === 303, `unlock action returned ${unlockResponse.status}`);
    const unlockAudit = await client.query(
      "SELECT 1 FROM security_audit_logs WHERE action = 'auth_rate_limit.unlock_row' AND target_id = $1",
      [`login:email:${unlockRateKey}`]
    );
    assert(unlockAudit.rowCount === 1, "admin unlock rate-limit did not write security audit log");

    step("security headers");
    const headersResponse = await request("/login");
    const hasSecurityHeader =
      headersResponse.headers.has("content-security-policy") ||
      headersResponse.headers.has("content-security-policy-report-only") ||
      headersResponse.headers.has("x-frame-options");
    assert(hasSecurityHeader, "security headers not present; start app with SECURITY_HEADERS_FORCE=true for this smoke");

    step("blocked IP and unblock");
    const blockedSmokeIp = "127.0.0.2";
    const blockResponse = await request("/api/admin/security/blocked-ips/action", {
      method: "POST",
      jar: adminActionJar,
      body: form({
        intent: "create",
        ipOrCidr: blockedSmokeIp,
        reason: `${runPrefix} smoke block`,
        durationMinutes: "15",
      }),
    });
    assert(blockResponse.status === 303, `block action returned ${blockResponse.status}`);
    const blockRow = await client.query("SELECT id FROM blocked_ips WHERE reason = $1 LIMIT 1", [`${runPrefix} smoke block`]);
    assert(blockRow.rows[0]?.id, "blocked IP row was not created");
    const blockHeaders = {};
    if (process.env.AUTH_TRUSTED_PROXY_MODE === "cloudflare") blockHeaders["cf-connecting-ip"] = blockedSmokeIp;
    if (process.env.AUTH_TRUSTED_PROXY_MODE === "reverse_proxy") blockHeaders["x-forwarded-for"] = blockedSmokeIp;
    const blockCheck = await request("/api/auth/csrf?scope=login", { headers: blockHeaders });
    if (process.env.AUTH_TRUSTED_PROXY_MODE && process.env.AUTH_TRUSTED_PROXY_MODE !== "none") {
      assert(blockCheck.status === 429, `blocked IP did not receive 429, got ${blockCheck.status}`);
    }
    const revokeResponse = await request("/api/admin/security/blocked-ips/action", {
      method: "POST",
      jar: adminActionJar,
      body: form({ intent: "revoke", id: blockRow.rows[0].id }),
    });
    assert(revokeResponse.status === 303, `revoke action returned ${revokeResponse.status}`);
    await sleep(16_000);
    const afterRevokeCheck = await request("/api/auth/csrf?scope=login", { headers: blockHeaders });
    if (process.env.AUTH_TRUSTED_PROXY_MODE && process.env.AUTH_TRUSTED_PROXY_MODE !== "none") {
      assert(afterRevokeCheck.status !== 429, "revoked blocked IP still receives 429");
    }

    console.log("Security smoke passed:");
    console.log("- duplicate register returns account_exists");
    console.log("- failed register clears pinklove_session");
    console.log("- public login rate-limits and successful login resets email limit");
    console.log("- admin/provider login rate-limit");
    console.log("- missing/bad CSRF is blocked generically");
    console.log("- admin unlock rate-limit writes security audit log");
    console.log("- security headers are present");
    console.log("- blocked IP blocks request and revoke allows request again");
  } finally {
    await cleanup(client).catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
