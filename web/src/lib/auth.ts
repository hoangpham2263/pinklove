import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { query } from "@/lib/db";
import { ROUTES } from "@/lib/routes";

export const SESSION_COOKIE_NAME = "pinklove_session";
const SESSION_DURATION_DAYS = 7;

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type UserProfile = {
  fullName: string;
  displayName: string;
  phone: string;
  bio: string;
};

export type AccountUser = {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
};

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
};

type OAuthAccountRow = {
  user_id: string;
};

type UserSettings = {
  uiDensity: "small" | "medium" | "large";
};

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

export async function countUsers(): Promise<number> {
 const result = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
 return Number(result.rows[0]?.count ??"0");
}

export async function registerUser(
 username: string,
 password: string,
 role: UserRole
): Promise<AuthUser> {
 const passwordHash = hashPassword(password);
 const result = await query<UserRow>(
 `
  INSERT INTO users (username, password_hash, role)
  VALUES ($1, $2, $3)
  RETURNING id, username, password_hash, role
 `,
 [username, passwordHash, role]
 );

 return {
 id: Number(result.rows[0].id),
 username: result.rows[0].username,
 role: result.rows[0].role,
 };
}

export async function authenticateUser(
 username: string,
 password: string
): Promise<AuthUser | null> {
 const result = await query<UserRow>(
"SELECT id, username, password_hash, role FROM users WHERE username = $1 LIMIT 1",
 [username]
 );
 const user = result.rows[0];
 if (!user) return null;

 if (!verifyPassword(password, user.password_hash)) {
 return null;
 }

 return {
 id: Number(user.id),
 username: user.username,
 role: user.role,
 };
}

async function generateUniqueUsername(base: string): Promise<string> {
 const normalized = base
 .toLowerCase()
 .replace(/[^a-z0-9_]/g,"_")
 .replace(/_+/g,"_")
 .replace(/^_+|_+$/g,"");
 const root = normalized.length >= 3 ? normalized :"user";

 for (let i = 0; i < 1000; i += 1) {
 const candidate = i === 0 ? root : `${root}_${i}`;
 const exists = await query<{ id: string }>(
"SELECT id FROM users WHERE username = $1 LIMIT 1",
  [candidate]
 );
 if (!exists.rows[0]) {
  return candidate;
 }
 }

 return `user_${Date.now()}`;
}

export async function authenticateGoogleUser(input: {
 providerUserId: string;
 email: string;
 name?: string;
}): Promise<AuthUser> {
 const linked = await query<OAuthAccountRow>(
 `
  SELECT user_id
  FROM user_oauth_accounts
  WHERE provider = 'google' AND provider_user_id = $1
  LIMIT 1
 `,
 [input.providerUserId]
 );

 if (linked.rows[0]) {
 const user = await query<{ id: string; username: string; role: UserRole }>(
"SELECT id, username, role FROM users WHERE id = $1 LIMIT 1",
  [linked.rows[0].user_id]
 );
 const row = user.rows[0];
 if (row) {
  return { id: Number(row.id), username: row.username, role: row.role };
 }
 }

 const emailBase = input.email.split("@")[0] ??"";
 const nameBase = input.name?.trim().split(/\s+/).join("_") ??"";
 const username = await generateUniqueUsername(nameBase || emailBase ||"google_user");
 const totalUsers = await countUsers();
 const role: UserRole = totalUsers === 0 ?"admin" :"user";
 const created = await registerUser(username, randomBytes(24).toString("hex"), role);

 await query(
 `
  INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, email)
  VALUES ($1, 'google', $2, $3)
  ON CONFLICT (provider, provider_user_id)
  DO NOTHING
 `,
 [created.id, input.providerUserId, input.email]
 );

 return created;
}

export async function createSession(userId: number): Promise<string> {
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

 const result = await query<{ id: string; username: string; role: UserRole }>(
 `
  SELECT u.id, u.username, u.role
  FROM user_sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = $1
  AND s.expires_at > NOW()
  LIMIT 1
 `,
 [tokenHash]
 );

 const row = result.rows[0];
 if (!row) return null;

 return {
 id: Number(row.id),
 username: row.username,
 role: row.role,
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
 return getUserByToken(token);
}

export async function requireUser(redirectTo = ROUTES.AUTH.LOGIN): Promise<AuthUser> {

  const user = await getCurrentUser();

  if (!user) {

    redirect(redirectTo);

  }

  return user;

}



export async function requireAdmin(redirectTo = ROUTES.ADMIN.LOGIN): Promise<AuthUser> {

  const user = await requireUser(redirectTo);

  if (user.role !== "admin") {

    redirect(ROUTES.USER.DASHBOARD);

  }

  return user;

}



export async function requireAppUser(redirectTo = ROUTES.AUTH.LOGIN): Promise<AuthUser> {

  const user = await requireUser(redirectTo);

  if (user.role === "admin") {

    redirect(ROUTES.ADMIN.DASHBOARD);

  }

  return user;

}

export async function getUserSettings(userId: number): Promise<UserSettings> {
 const result = await query<{ ui_density:"small" |"medium" |"large" }>(
"SELECT ui_density FROM user_settings WHERE user_id = $1 LIMIT 1",
 [userId]
 );

 const row = result.rows[0];
 return {
 uiDensity: row?.ui_density ??"medium",
 };
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
 const result = await query<{
 full_name: string | null;
 display_name: string | null;
 phone: string | null;
 bio: string | null;
 }>(
 `
  SELECT full_name, display_name, phone, bio
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
 bio: row?.bio ??"",
 };
}

export async function setUserProfile(userId: number, profile: UserProfile): Promise<void> {
 const fullName = profile.fullName.trim();
 const displayName = profile.displayName.trim();
 const phone = profile.phone.trim();
 const bio = profile.bio.trim();

 await query(
 `
  INSERT INTO user_profiles (user_id, full_name, display_name, phone, bio)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (user_id)
  DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  bio = EXCLUDED.bio,
  updated_at = NOW()
 `,
 [
  userId,
  fullName.length > 0 ? fullName : null,
  displayName.length > 0 ? displayName : null,
  phone.length > 0 ? phone : null,
  bio.length > 0 ? bio : null,
 ]
 );
}

export async function setUserDensity(
 userId: number,
 uiDensity:"small" |"medium" |"large"
): Promise<void> {
 await query(
 `
  INSERT INTO user_settings (user_id, ui_density)
  VALUES ($1, $2)
  ON CONFLICT (user_id)
  DO UPDATE SET ui_density = EXCLUDED.ui_density, updated_at = NOW()
 `,
 [userId, uiDensity]
 );
}

export async function listAccounts(): Promise<AccountUser[]> {
 const result = await query<{
 id: string;
 username: string;
 role: UserRole;
 created_at: string;
 }>(
 `
  SELECT id, username, role, created_at
  FROM users
  ORDER BY created_at ASC
 `
 );

 return result.rows.map((row) => ({
 id: Number(row.id),
 username: row.username,
 role: row.role,
 createdAt: row.created_at,
 }));
}

export async function getUserAccount(id: number): Promise<AccountUser | null> {
 const result = await query<{
 id: string;
 username: string;
 role: UserRole;
 created_at: string;
 }>(
 `
  SELECT id, username, role, created_at
  FROM users
  WHERE id = $1
  LIMIT 1
 `,
 [id]
 );
 
 const row = result.rows[0];
 if (!row) return null;
 return {
 id: Number(row.id),
 username: row.username,
 role: row.role,
 createdAt: row.created_at,
 };
}

export async function countAdmins(): Promise<number> {
 const result = await query<{ count: string }>(
 `
  SELECT COUNT(*)::text AS count
  FROM users
  WHERE role = 'admin'
 `
 );

 return Number(result.rows[0]?.count ??"0");
}

export async function adminCreateAccount(
 username: string,
 password: string,
 role: UserRole
): Promise<AuthUser> {
 return registerUser(username, password, role);
}

export async function adminUpdateRole(
 actorId: number,
 targetUserId: number,
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

 if (target.role ==="admin" && nextRole ==="user") {
 const admins = await countAdmins();
 if (admins <= 1) {
  throw new Error("LAST_ADMIN_PROTECTED");
 }
 }

 await query("UPDATE users SET role = $1 WHERE id = $2", [nextRole, targetUserId]);
}

export async function adminUpdateAccount(
 actorId: number,
 targetUserId: number,
 data: { username?: string; password?: string; role?: UserRole }
): Promise<void> {
 if (data.role) {
 await adminUpdateRole(actorId, targetUserId, data.role);
 }

 const updates: string[] = [];
 const params: unknown[] = [];
 let paramIdx = 1;

 if (data.username) {
 updates.push(`username = $${paramIdx++}`);
 params.push(data.username);
 }
 
 if (data.password) {
 updates.push(`password_hash = $${paramIdx++}`);
 params.push(hashPassword(data.password));
 }

 if (updates.length > 0) {
 params.push(targetUserId);
 await query(`UPDATE users SET ${updates.join(",")} WHERE id = $${paramIdx}`, params);
 }
}

export async function adminDeleteAccount(actorId: number, targetUserId: number): Promise<void> {
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

 if (target.role ==="admin") {
 const admins = await countAdmins();
 if (admins <= 1) {
  throw new Error("LAST_ADMIN_PROTECTED");
 }
 }

 await query("DELETE FROM users WHERE id = $1", [targetUserId]);
}
