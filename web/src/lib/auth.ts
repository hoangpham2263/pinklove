import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { query, withTransaction, type DbExecutor } from "@/lib/database";
import { getAdminPathPermission } from "@/features/access/config/permissions";
import { getAdminAccessContext, hasAdminPermission } from "@/features/access/server/service";
import { canAccessUserPortal, isAdminRole, isProviderRole, type UserRole, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

export const SESSION_COOKIE_NAME = "pinklove_session";
const SESSION_DURATION_DAYS = 7;

export type AccountStatus = "active" | "blocked" | "banned" | "deleted";

export type AuthUser = {
  id: string;
  email: string;
  accountName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerifiedAt: string | null;
};

export type UserProfile = {
  fullName: string;
  displayName: string;
  phone: string;
  providerPortalSlug?: string;
  bio: string;
  avatarUrl: string;
};

export type UserShippingProfile = {
  businessName: string;
  storeName: string;
  contactEmail: string;
  pickupContactName: string;
  pickupPhone: string;
  pickupAddressLine1: string;
  pickupWard: string;
  pickupDistrict: string;
  pickupProvince: string;
  returnSameAsPickup: boolean;
  returnContactName: string;
  returnPhone: string;
  returnAddressLine1: string;
  returnWard: string;
  returnDistrict: string;
  returnProvince: string;
};

export type AccountUser = {
  id: string;
  email: string;
  accountName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  accountStatusReason: string;
  createdAt: string;
  fullName: string;
  displayName: string;
  phone: string;
  providerPortalSlug: string;
  bio: string;
  adminRoleId: string;
  adminRoleLabel: string;
};

type UserRow = {
  id: string;
  email: string;
  account_name: string;
  password_hash: string | null;
  role: UserRole;
  account_status: AccountStatus;
  email_verified_at: string | null;
};

type OAuthAccountRow = {
  user_id: string;
};

const globalForAuth = globalThis as unknown as {
  userShippingProfilesStorageReady?: boolean;
};

async function ensureUserShippingProfilesStorageReady() {
  if (globalForAuth.userShippingProfilesStorageReady) {
    return;
  }

  globalForAuth.userShippingProfilesStorageReady = true;
}

function hashPassword(password: string): string {
 const salt = randomBytes(16).toString("hex");
 const hash = scryptSync(password, salt, 64).toString("hex");
 return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
 const [salt, hash] = stored.split(":");
 if (!salt || !hash) return false;
 const attempt = scryptSync(password, salt, 64);
 const original = Buffer.from(hash,"hex");
 if (attempt.byteLength !== original.byteLength) return false;
 return timingSafeEqual(attempt, original);
}

export function normalizeEmail(email: string): string {
 return email.trim().toLowerCase();
}

function hashSessionToken(token: string): string {
 return createHash("sha256").update(token).digest("hex");
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
 const map = new Map<string, string>();
 if (!cookieHeader) return map;

 cookieHeader.split(";").forEach((entry) => {
 const [rawKey, ...rawValue] = entry.trim().split("=");
 if (!rawKey || rawValue.length === 0) return;
 map.set(rawKey, decodeURIComponent(rawValue.join("=")));
 });

 return map;
}

function buildSessionExpiryDate(): Date {
 const expires = new Date();
 expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);
 return expires;
}

export function getSessionCookieOptions() {
 return {
 httpOnly: true,
 sameSite:"lax" as const,
 secure: process.env.NODE_ENV ==="production",
 path:"/",
 maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
 };
}

function normalizeProviderPortalSlug(value: string): string {
 const normalized = value
 .trim()
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-+|-+$/g, "")
 .slice(0, 48);

 return normalized || "provider";
}

async function createUniqueProviderPortalSlug(base: string, excludeUserId?: string): Promise<string> {
 const root = normalizeProviderPortalSlug(base);

 for (let i = 0; i < 1000; i += 1) {
 const candidate = i === 0 ? root : `${root}-${i + 1}`;
 const exists = await query<{ user_id: string }>(
 `
  SELECT user_id
  FROM user_profiles
  WHERE LOWER(provider_portal_slug) = LOWER($1)
  AND ($2::text IS NULL OR user_id::text <> $2::text)
  LIMIT 1
 `,
 [candidate, excludeUserId ?? null]
 );

 if (!exists.rows[0]) {
  return candidate;
 }
 }

 return `${root}-${Date.now().toString(36)}`;
}

export async function countUsers(): Promise<number> {
 const result = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
 return Number(result.rows[0]?.count ??"0");
}

export async function getPublicRegistrationRole(execute: DbExecutor): Promise<UserRole> {
 await execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE");
 const result = await execute<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role = 'ADMIN'");
 return Number(result.rows[0]?.count ?? "0") === 0 ? USER_ROLES.ADMIN : USER_ROLES.CUSTOMER;
}

async function getSuperAdminRoleId(execute: DbExecutor): Promise<string> {
 const result = await execute<{ id: string }>("SELECT id FROM admin_roles WHERE key = 'super_admin' LIMIT 1");
 const roleId = result.rows[0]?.id;
 if (!roleId) {
  throw new Error("SUPER_ADMIN_ROLE_NOT_FOUND");
 }
 return roleId;
}

export async function registerUser(input: {
 email: string;
 accountName: string;
 password?: string;
 role: UserRole;
 emailVerifiedAt?: string | null;
}, execute: DbExecutor = query): Promise<AuthUser> {
 const email = normalizeEmail(input.email);
 const accountName = input.accountName.trim();
 const passwordHash = input.password ? hashPassword(input.password) : null;
 const adminRoleId = isAdminRole(input.role) ? await getSuperAdminRoleId(execute) : null;
 const result = await execute<UserRow>(
 `
  INSERT INTO users (email, account_name, password_hash, role, email_verified_at, admin_role_id)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id, email, account_name, password_hash, role, account_status, email_verified_at
 `,
 [email, accountName, passwordHash, input.role, input.emailVerifiedAt ?? null, adminRoleId]
 );

 return {
 id: result.rows[0].id,
 email: result.rows[0].email,
 accountName: result.rows[0].account_name,
 role: result.rows[0].role,
 accountStatus: result.rows[0].account_status,
 emailVerifiedAt: result.rows[0].email_verified_at,
 };
}

export async function authenticateUserByEmail(
 email: string,
 password: string
): Promise<AuthUser | null> {
 const result = await query<UserRow>(
"SELECT id, email, account_name, password_hash, role, account_status, email_verified_at FROM users WHERE LOWER(BTRIM(email)) = $1 LIMIT 1",
 [normalizeEmail(email)]
 );
 const user = result.rows[0];
 if (!user) return null;
 if (user.account_status !== "active") return null;
 if (!user.password_hash) return null;

 if (!verifyPassword(password, user.password_hash)) {
 return null;
 }

 return {
 id: user.id,
 email: user.email,
 accountName: user.account_name,
 role: user.role,
 accountStatus: user.account_status,
 emailVerifiedAt: user.email_verified_at,
 };
}

export async function authenticateGoogleUser(input: {
 providerUserId: string;
 email: string;
 name?: string;
 emailVerified?: boolean;
}): Promise<AuthUser> {
 const email = normalizeEmail(input.email);

 return withTransaction(async (execute) => {
  const linked = await execute<OAuthAccountRow>(
   `
    SELECT user_id
    FROM user_oauth_accounts
    WHERE provider = 'google' AND provider_user_id = $1
    LIMIT 1
   `,
   [input.providerUserId]
  );

  let user: UserRow | undefined;
  if (linked.rows[0]) {
   const result = await execute<UserRow>(
    "SELECT id, email, account_name, password_hash, role, account_status, email_verified_at FROM users WHERE id = $1 LIMIT 1",
    [linked.rows[0].user_id]
   );
   user = result.rows[0];
  } else {
   const existing = await execute<UserRow>(
    "SELECT id, email, account_name, password_hash, role, account_status, email_verified_at FROM users WHERE LOWER(BTRIM(email)) = $1 LIMIT 1",
    [email]
   );
   user = existing.rows[0];

   if (!user) {
    const accountName = input.name?.trim() || email.split("@")[0] || "PinkLove User";
    const role = await getPublicRegistrationRole(execute);
    const adminRoleId = isAdminRole(role) ? await getSuperAdminRoleId(execute) : null;
    const created = await execute<UserRow>(
     `
      INSERT INTO users (email, account_name, password_hash, role, email_verified_at, admin_role_id)
      VALUES ($1, $2, NULL, $3, $4, $5)
      RETURNING id, email, account_name, password_hash, role, account_status, email_verified_at
     `,
     [email, accountName, role, input.emailVerified ? new Date().toISOString() : null, adminRoleId]
    );
    user = created.rows[0];
   }

   await execute(
    `
     INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, email)
     VALUES ($1, 'google', $2, $3)
     ON CONFLICT (provider, provider_user_id)
     DO UPDATE SET user_id = EXCLUDED.user_id, email = EXCLUDED.email
    `,
    [user.id, input.providerUserId, email]
   );
  }

  if (!user || user.account_status !== "active") {
   throw new Error("GOOGLE_ACCOUNT_UNAVAILABLE");
  }

  return {
   id: user.id,
   email: user.email,
   accountName: user.account_name,
   role: user.role,
   accountStatus: user.account_status,
   emailVerifiedAt: user.email_verified_at,
  };
 });
}

export async function createSession(userId: string): Promise<string> {
 const rawToken = randomBytes(32).toString("hex");
 const tokenHash = hashSessionToken(rawToken);
 const sessionId = randomBytes(16).toString("hex");
 const expiresAt = buildSessionExpiryDate().toISOString();

 await query(
 `
  INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
  VALUES ($1, $2, $3, $4)
 `,
 [sessionId, userId, tokenHash, expiresAt]
 );

 return rawToken;
}

export async function invalidateSession(token: string): Promise<void> {
 const tokenHash = hashSessionToken(token);
 await query("DELETE FROM user_sessions WHERE token_hash = $1", [tokenHash]);
}

async function getUserByToken(token: string): Promise<AuthUser | null> {
 const tokenHash = hashSessionToken(token);

 const result = await query<{
  id: string;
  email: string;
  account_name: string;
  role: UserRole;
  account_status: AccountStatus;
  email_verified_at: string | null;
 }>(
 `
  SELECT u.id, u.email, u.account_name, u.role, u.account_status, u.email_verified_at
  FROM user_sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = $1
  AND s.expires_at > NOW()
  AND u.account_status = 'active'
  LIMIT 1
 `,
 [tokenHash]
 );

 const row = result.rows[0];
 if (!row) return null;

 return {
 id: row.id,
 email: row.email,
 accountName: row.account_name,
 role: row.role,
 accountStatus: row.account_status,
 emailVerifiedAt: row.email_verified_at,
 };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
 const cookieStore = await cookies();
 const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
 if (!token) return null;
 return getUserByToken(token);
}

export async function getCurrentUserFromRequest(
 request: Request
): Promise<AuthUser | null> {
 const cookieHeader = request.headers.get("cookie");
 const cookiesMap = parseCookieHeader(cookieHeader);
 const token = cookiesMap.get(SESSION_COOKIE_NAME);
 if (!token) return null;
 const user = await getUserByToken(token);
 if (!user) return null;
 if (request.url.includes("/api/admin/")) {
  const permission = getAdminPathPermission(new URL(request.url).pathname);
  if (!(await hasAdminPermission(user.id, permission))) return null;
 }
 return user;
}

export async function requireUser(redirectTo: string = ROUTES.AUTH.LOGIN): Promise<AuthUser> {

  const user = await getCurrentUser();

  if (!user) {

    redirect(redirectTo);

  }

  return user;

}



export async function requireAdmin(redirectTo: string = ROUTES.ADMIN.LOGIN): Promise<AuthUser> {

  const user = await requireUser(redirectTo);

  if (!isAdminRole(user.role) || !(await getAdminAccessContext(user.id))) {

    redirect(ROUTES.CUSTOMER.DASHBOARD);

  }

  return user;

}

export async function requireAdminPermission(
  permissionKey: string,
  redirectTo: string = ROUTES.ADMIN.DASHBOARD
): Promise<AuthUser> {
  const user = await requireAdmin();
  if (!(await hasAdminPermission(user.id, permissionKey))) {
    redirect(redirectTo);
  }
  return user;
}



export async function requireAppUser(redirectTo: string = ROUTES.AUTH.LOGIN): Promise<AuthUser> {

  const user = await requireUser(redirectTo);

  return user;

}

export async function requireProvider(redirectTo: string = ROUTES.PROVIDER.LOGIN): Promise<AuthUser> {
  const user = await requireUser(redirectTo);

  if (!isProviderRole(user.role)) {
    redirect(ROUTES.CUSTOMER.DASHBOARD);
  }

  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
 const result = await query<{
 full_name: string | null;
 display_name: string | null;
 phone: string | null;
 provider_portal_slug: string | null;
 bio: string | null;
 avatar_url: string | null;
 }>(
 `
  SELECT
    full_name,
    display_name,
    phone,
    provider_portal_slug,
    bio,
    avatar_url
  FROM user_profiles
  WHERE user_id = $1
  LIMIT 1
 `,
 [userId]
 );

 const row = result.rows[0];
 return {
 fullName: row?.full_name ??"",
 displayName: row?.display_name ??"",
 phone: row?.phone ??"",
 providerPortalSlug: row?.provider_portal_slug ?? "",
 bio: row?.bio ??"",
 avatarUrl: row?.avatar_url ?? "",
 };
}

export async function setUserProfile(userId: string, profile: UserProfile): Promise<void> {
 const fullName = profile.fullName.trim();
 const displayName = profile.displayName.trim();
 const phone = profile.phone.trim();
 const providerPortalSlug = profile.providerPortalSlug?.trim() ?? "";
 const bio = profile.bio.trim();
 const avatarUrl = profile.avatarUrl.trim();

 await query(
 `
  INSERT INTO user_profiles (user_id, full_name, display_name, phone, provider_portal_slug, bio, avatar_url)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (user_id)
  DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  provider_portal_slug = EXCLUDED.provider_portal_slug,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW()
 `,
 [
  userId,
  fullName.length > 0 ? fullName : null,
  displayName.length > 0 ? displayName : null,
  phone.length > 0 ? phone : null,
  providerPortalSlug.length > 0 ? normalizeProviderPortalSlug(providerPortalSlug) : null,
  bio.length > 0 ? bio : null,
  avatarUrl.length > 0 ? avatarUrl : null,
 ]
 );
}

export async function getUserShippingProfile(
  userId: string,
  profileType = "primary"
): Promise<UserShippingProfile> {
  await ensureUserShippingProfilesStorageReady();
  const result = await query<{
    business_name: string | null;
    store_name: string | null;
    contact_email: string | null;
    pickup_contact_name: string | null;
    pickup_phone: string | null;
    pickup_address_line1: string | null;
    pickup_ward: string | null;
    pickup_district: string | null;
    pickup_province: string | null;
    return_same_as_pickup: boolean | null;
    return_contact_name: string | null;
    return_phone: string | null;
    return_address_line1: string | null;
    return_ward: string | null;
    return_district: string | null;
    return_province: string | null;
  }>(
    `
      SELECT
        business_name,
        store_name,
        contact_email,
        pickup_contact_name,
        pickup_phone,
        pickup_address_line1,
        pickup_ward,
        pickup_district,
        pickup_province,
        return_same_as_pickup,
        return_contact_name,
        return_phone,
        return_address_line1,
        return_ward,
        return_district,
        return_province
      FROM user_shipping_profiles
      WHERE user_id = $1 AND profile_type = $2
      LIMIT 1
    `,
    [userId, profileType]
  );

  const row = result.rows[0];
  return {
    businessName: row?.business_name ?? "",
    storeName: row?.store_name ?? "",
    contactEmail: row?.contact_email ?? "",
    pickupContactName: row?.pickup_contact_name ?? "",
    pickupPhone: row?.pickup_phone ?? "",
    pickupAddressLine1: row?.pickup_address_line1 ?? "",
    pickupWard: row?.pickup_ward ?? "",
    pickupDistrict: row?.pickup_district ?? "",
    pickupProvince: row?.pickup_province ?? "",
    returnSameAsPickup: row?.return_same_as_pickup ?? true,
    returnContactName: row?.return_contact_name ?? "",
    returnPhone: row?.return_phone ?? "",
    returnAddressLine1: row?.return_address_line1 ?? "",
    returnWard: row?.return_ward ?? "",
    returnDistrict: row?.return_district ?? "",
    returnProvince: row?.return_province ?? "",
  };
}

export async function setUserShippingProfile(
  userId: string,
  profile: UserShippingProfile,
  profileType = "primary"
): Promise<void> {
  await ensureUserShippingProfilesStorageReady();

  const businessName = profile.businessName.trim();
  const storeName = profile.storeName.trim();
  const contactEmail = profile.contactEmail.trim();
  const pickupContactName = profile.pickupContactName.trim();
  const pickupPhone = profile.pickupPhone.trim();
  const pickupAddressLine1 = profile.pickupAddressLine1.trim();
  const pickupWard = profile.pickupWard.trim();
  const pickupDistrict = profile.pickupDistrict.trim();
  const pickupProvince = profile.pickupProvince.trim();
  const returnSameAsPickup = profile.returnSameAsPickup;
  const returnContactName = profile.returnContactName.trim();
  const returnPhone = profile.returnPhone.trim();
  const returnAddressLine1 = profile.returnAddressLine1.trim();
  const returnWard = profile.returnWard.trim();
  const returnDistrict = profile.returnDistrict.trim();
  const returnProvince = profile.returnProvince.trim();

  await query(
    `
      INSERT INTO user_shipping_profiles (
        user_id,
        profile_type,
        business_name,
        store_name,
        contact_email,
        pickup_contact_name,
        pickup_phone,
        pickup_address_line1,
        pickup_ward,
        pickup_district,
        pickup_province,
        return_same_as_pickup,
        return_contact_name,
        return_phone,
        return_address_line1,
        return_ward,
        return_district,
        return_province
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (user_id, profile_type)
      DO UPDATE SET
        business_name = EXCLUDED.business_name,
        store_name = EXCLUDED.store_name,
        contact_email = EXCLUDED.contact_email,
        pickup_contact_name = EXCLUDED.pickup_contact_name,
        pickup_phone = EXCLUDED.pickup_phone,
        pickup_address_line1 = EXCLUDED.pickup_address_line1,
        pickup_ward = EXCLUDED.pickup_ward,
        pickup_district = EXCLUDED.pickup_district,
        pickup_province = EXCLUDED.pickup_province,
        return_same_as_pickup = EXCLUDED.return_same_as_pickup,
        return_contact_name = EXCLUDED.return_contact_name,
        return_phone = EXCLUDED.return_phone,
        return_address_line1 = EXCLUDED.return_address_line1,
        return_ward = EXCLUDED.return_ward,
        return_district = EXCLUDED.return_district,
        return_province = EXCLUDED.return_province,
        updated_at = NOW()
    `,
    [
      userId,
      profileType,
      businessName || null,
      storeName || null,
      contactEmail || null,
      pickupContactName || null,
      pickupPhone || null,
      pickupAddressLine1 || null,
      pickupWard || null,
      pickupDistrict || null,
      pickupProvince || null,
      returnSameAsPickup,
      returnContactName || null,
      returnPhone || null,
      returnAddressLine1 || null,
      returnWard || null,
      returnDistrict || null,
      returnProvince || null,
    ]
  );
}

export async function listAccounts(): Promise<AccountUser[]> {
 const result = await query<{
 id: string;
 email: string;
 account_name: string;
 role: UserRole;
 account_status: AccountStatus;
 account_status_reason: string | null;
 created_at: string;
 full_name: string | null;
 display_name: string | null;
 phone: string | null;
 provider_portal_slug: string | null;
 bio: string | null;
 admin_role_id: string | null;
 admin_role_label: string | null;
 }>(
 `
  SELECT
   u.id,
   u.email,
   u.account_name,
   u.role,
   u.account_status,
   u.account_status_reason,
   u.created_at,
   p.full_name,
   p.display_name,
   p.phone,
   p.provider_portal_slug,
   p.bio,
   u.admin_role_id,
   admin_role.label AS admin_role_label
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.id
  LEFT JOIN admin_roles admin_role ON admin_role.id = u.admin_role_id
  ORDER BY u.created_at ASC
 `
 );

 return result.rows.map((row) => ({
 id: row.id,
 email: row.email,
 accountName: row.account_name,
 role: row.role,
 accountStatus: row.account_status,
 accountStatusReason: row.account_status_reason ?? "",
 createdAt: row.created_at,
 fullName: row.full_name ?? "",
 displayName: row.display_name ?? "",
 phone: row.phone ?? "",
 providerPortalSlug: row.provider_portal_slug ?? "",
 bio: row.bio ?? "",
 adminRoleId: row.admin_role_id ?? "",
 adminRoleLabel: row.admin_role_label ?? "",
 }));
}

export async function listAccountsByRole(role: UserRole): Promise<AccountUser[]> {
 const accounts = await listAccounts();
 return accounts.filter((account) => account.role === role);
}

export async function getUserAccount(id: string): Promise<AccountUser | null> {
 const result = await query<{
 id: string;
 email: string;
 account_name: string;
 role: UserRole;
 account_status: AccountStatus;
 account_status_reason: string | null;
 created_at: string;
 full_name: string | null;
 display_name: string | null;
 phone: string | null;
 provider_portal_slug: string | null;
 bio: string | null;
 admin_role_id: string | null;
 admin_role_label: string | null;
 }>(
 `
  SELECT
   u.id,
   u.email,
   u.account_name,
   u.role,
   u.account_status,
   u.account_status_reason,
   u.created_at,
   p.full_name,
   p.display_name,
   p.phone,
   p.provider_portal_slug,
   p.bio,
   u.admin_role_id,
   admin_role.label AS admin_role_label
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.id
  LEFT JOIN admin_roles admin_role ON admin_role.id = u.admin_role_id
  WHERE u.id = $1
  LIMIT 1
 `,
 [id]
 );
 
 const row = result.rows[0];
 if (!row) return null;
 return {
 id: row.id,
 email: row.email,
 accountName: row.account_name,
 role: row.role,
 accountStatus: row.account_status,
 accountStatusReason: row.account_status_reason ?? "",
 createdAt: row.created_at,
 fullName: row.full_name ?? "",
 displayName: row.display_name ?? "",
 phone: row.phone ?? "",
 providerPortalSlug: row.provider_portal_slug ?? "",
 bio: row.bio ?? "",
 adminRoleId: row.admin_role_id ?? "",
 adminRoleLabel: row.admin_role_label ?? "",
 };
}

export async function ensureProviderPortalSlug(userId: string): Promise<string | null> {
 const result = await query<{
 account_name: string;
 role: UserRole;
 account_status: AccountStatus;
 provider_portal_slug: string | null;
 }>(
 `
  SELECT u.account_name, u.role, u.account_status, p.provider_portal_slug
  FROM users u
  LEFT JOIN user_profiles p ON p.user_id = u.id
  WHERE u.id = $1
  LIMIT 1
 `,
 [userId]
 );

 const row = result.rows[0];
 if (!row || !isProviderRole(row.role) || row.account_status !== "active") {
  return null;
 }

 if (row.provider_portal_slug) {
  return row.provider_portal_slug;
 }

 const slug = await createUniqueProviderPortalSlug(row.account_name, userId);
 await query(
 `
  INSERT INTO user_profiles (user_id, provider_portal_slug)
  VALUES ($1, $2)
  ON CONFLICT (user_id)
  DO UPDATE SET
  provider_portal_slug = EXCLUDED.provider_portal_slug,
  updated_at = NOW()
 `,
 [userId, slug]
 );

 return slug;
}

export async function getProviderPortalAccountBySlug(slug: string): Promise<AccountUser | null> {
 const normalizedSlug = normalizeProviderPortalSlug(slug);
 const result = await query<{
 id: string;
 email: string;
 account_name: string;
 role: UserRole;
 account_status: AccountStatus;
 account_status_reason: string | null;
 created_at: string;
 full_name: string | null;
 display_name: string | null;
 phone: string | null;
 provider_portal_slug: string | null;
 bio: string | null;
 }>(
 `
  SELECT
   u.id,
   u.email,
   u.account_name,
   u.role,
   u.account_status,
   u.account_status_reason,
   u.created_at,
   p.full_name,
   p.display_name,
   p.phone,
   p.provider_portal_slug,
   p.bio
  FROM users u
  JOIN user_profiles p ON p.user_id = u.id
  WHERE u.role = $1
  AND u.account_status = 'active'
  AND LOWER(p.provider_portal_slug) = LOWER($2)
  LIMIT 1
 `,
 [USER_ROLES.PROVIDER, normalizedSlug]
 );

 const row = result.rows[0];
 if (!row) return null;

 return {
 id: row.id,
 email: row.email,
 accountName: row.account_name,
 role: row.role,
 accountStatus: row.account_status,
 accountStatusReason: row.account_status_reason ?? "",
 createdAt: row.created_at,
 fullName: row.full_name ?? "",
 displayName: row.display_name ?? "",
 phone: row.phone ?? "",
 providerPortalSlug: row.provider_portal_slug ?? "",
 bio: row.bio ?? "",
 adminRoleId: "",
 adminRoleLabel: "",
 };
}

export async function countAdmins(): Promise<number> {
 const result = await query<{ count: string }>(
 `
  SELECT COUNT(*)::text AS count
  FROM users
  WHERE role = 'ADMIN'
 `
 );

 return Number(result.rows[0]?.count ??"0");
}

export async function adminCreateAccount(
 email: string,
 accountName: string,
 password: string,
 role: UserRole
): Promise<AuthUser> {
 return registerUser({ email, accountName, password, role });
}

export async function adminUpdateRole(
 actorId: string,
 targetUserId: string,
 nextRole: UserRole
): Promise<void> {
 const targetResult = await query<{ id: string; role: UserRole }>(
"SELECT id, role FROM users WHERE id = $1 LIMIT 1",
 [targetUserId]
 );
 const target = targetResult.rows[0];
 if (!target) {
 throw new Error("USER_NOT_FOUND");
 }

 if (actorId === targetUserId) {
 throw new Error("CANNOT_CHANGE_SELF_ROLE");
 }

 if (isAdminRole(target.role) && !isAdminRole(nextRole)) {
 const admins = await countAdmins();
 if (admins <= 1) {
  throw new Error("LAST_ADMIN_PROTECTED");
 }
 }

 if (isAdminRole(nextRole)) {
  await query(
   `
    UPDATE users
    SET role = $1,
        admin_role_id = COALESCE(admin_role_id, (SELECT id FROM admin_roles WHERE key = 'super_admin')),
        updated_at = NOW()
    WHERE id = $2
   `,
   [nextRole, targetUserId]
  );
  return;
 }

 await query("UPDATE users SET role = $1, admin_role_id = NULL, updated_at = NOW() WHERE id = $2", [nextRole, targetUserId]);
}

export async function adminUpdateAccount(
 actorId: string,
 targetUserId: string,
 data: { email?: string; accountName?: string; password?: string; role?: UserRole }
): Promise<void> {
 if (data.role) {
 await adminUpdateRole(actorId, targetUserId, data.role);
 }

 const updates: string[] = [];
 const params: unknown[] = [];
 let paramIdx = 1;

 if (data.email) {
 updates.push(`email = $${paramIdx++}`);
 params.push(normalizeEmail(data.email));
 }

 if (data.accountName) {
 updates.push(`account_name = $${paramIdx++}`);
 params.push(data.accountName);
 }
 
 if (data.password) {
 updates.push(`password_hash = $${paramIdx++}`);
 params.push(hashPassword(data.password));
 }

 if (updates.length > 0) {
 params.push(targetUserId);
 await query(`UPDATE users SET ${updates.join(",")}, updated_at = NOW() WHERE id = $${paramIdx}`, params);
 }
}

export async function adminSetProviderAccountStatus(
 actorId: string,
 targetUserId: string,
 nextStatus: AccountStatus,
 reason?: string
): Promise<void> {
 const targetResult = await query<{ id: string; role: UserRole }>(
"SELECT id, role FROM users WHERE id = $1 LIMIT 1",
 [targetUserId]
 );
 const target = targetResult.rows[0];
 if (!target) {
  throw new Error("USER_NOT_FOUND");
 }

 if (!isProviderRole(target.role)) {
  throw new Error("TARGET_NOT_PROVIDER");
 }

 const normalizedReason = reason?.trim() ?? "";

 await query(
`
 UPDATE users
 SET account_status = $1,
     account_status_reason = $2,
     account_status_updated_at = NOW(),
     account_status_updated_by = $3
 WHERE id = $4
`,
  [nextStatus, normalizedReason || null, actorId, targetUserId]
 );

 await query("DELETE FROM user_sessions WHERE user_id = $1", [targetUserId]);

 if (nextStatus !== "active") {
  await query(
`
 UPDATE offerings
 SET status = 'draft',
     updated_at = NOW()
 WHERE id IN (
   SELECT offering_id
   FROM physical_offerings
   INNER JOIN providers ON providers.id = physical_offerings.provider_id
   WHERE providers.owner_user_id = $1
 )
`,
   [targetUserId]
  );

  const archiveMessage = normalizedReason
    ? `Hồ sơ supplier bị chuyển sang ${nextStatus}. Lý do: ${normalizedReason}`
    : `Hồ sơ supplier bị chuyển sang ${nextStatus}.`;

  await query(
`
 UPDATE provider_offering_submissions
 SET review_status = 'archived',
     review_note = CASE
       WHEN BTRIM(COALESCE(review_note, '')) = '' THEN $2
       ELSE review_note || E'\\n\\n' || $2
     END,
     reviewed_at = NOW(),
     reviewed_by = $3,
     updated_at = NOW()
 WHERE provider_user_id = $1
   AND review_status <> 'archived'
`,
   [targetUserId, archiveMessage, actorId]
  );
 }
}

export async function adminDeleteAccount(actorId: string, targetUserId: string): Promise<void> {
 const targetResult = await query<{ id: string; role: UserRole }>(
"SELECT id, role FROM users WHERE id = $1 LIMIT 1",
 [targetUserId]
 );
 const target = targetResult.rows[0];
 if (!target) {
 throw new Error("USER_NOT_FOUND");
 }

 if (actorId === targetUserId) {
 throw new Error("CANNOT_DELETE_SELF");
 }

 if (isAdminRole(target.role)) {
 const admins = await countAdmins();
 if (admins <= 1) {
 throw new Error("LAST_ADMIN_PROTECTED");
 }
 }

 if (isProviderRole(target.role)) {
  await adminSetProviderAccountStatus(actorId, targetUserId, "deleted", "Nhà cung cấp đã bị xóa mềm khỏi hệ thống.");
  return;
 }

 await query("DELETE FROM users WHERE id = $1", [targetUserId]);
}

export { canAccessUserPortal, isAdminRole, isProviderRole, USER_ROLES };
export type { UserRole };
