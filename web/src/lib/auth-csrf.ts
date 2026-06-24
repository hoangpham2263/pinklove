import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type AuthCsrfScope = "login" | "register" | "admin_login" | "provider_login";

const CSRF_COOKIE_PREFIX = "pinklove_auth_csrf";
const CSRF_TOKEN_TTL_MS = 15 * 60 * 1000;

export class AuthCsrfError extends Error {
  constructor() {
    super("AUTH_CSRF_INVALID");
  }
}

export function getAuthCsrfConfig() {
  const disabledByEnv = process.env.AUTH_CSRF_DISABLED === "true";
  const production = process.env.NODE_ENV === "production";
  return {
    enabled: production ? true : !disabledByEnv,
    productionForced: production,
    tokenTtlMinutes: Math.floor(CSRF_TOKEN_TTL_MS / 60_000),
  };
}

function getCsrfSecret() {
  return process.env.AUTH_CSRF_SECRET?.trim() || process.env.INTERNAL_API_SECRET?.trim() || "pinklove-dev-csrf-secret";
}

function getCookieName(scope: AuthCsrfScope) {
  return `${CSRF_COOKIE_PREFIX}_${scope}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function signCookie(scope: AuthCsrfScope, expiresAt: number, tokenHash: string) {
  return createHmac("sha256", getCsrfSecret())
    .update(`${scope}:${expiresAt}:${tokenHash}`)
    .digest("hex");
}

function timingSafeStringEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.byteLength !== right.byteLength) return false;
  return timingSafeEqual(left, right);
}

function buildCookieValue(scope: AuthCsrfScope, expiresAt: number, tokenHash: string) {
  return `${expiresAt}.${tokenHash}.${signCookie(scope, expiresAt, tokenHash)}`;
}

function parseCookieValue(value: string) {
  const [expiresAtRaw, tokenHash, signature] = value.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || !tokenHash || !signature) return null;
  return { expiresAt, tokenHash, signature };
}

export async function createAuthCsrfToken(scope: AuthCsrfScope) {
  if (!getAuthCsrfConfig().enabled) {
    return "";
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + CSRF_TOKEN_TTL_MS;
  const cookieStore = await cookies();

  cookieStore.set(getCookieName(scope), buildCookieValue(scope, expiresAt, tokenHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(CSRF_TOKEN_TTL_MS / 1000),
  });

  return token;
}

export async function verifyAuthCsrfToken(scope: AuthCsrfScope, token: string) {
  if (!getAuthCsrfConfig().enabled) {
    return;
  }

  const cookieStore = await cookies();
  const cookieName = getCookieName(scope);
  const cookieValue = cookieStore.get(cookieName)?.value;
  const parsed = cookieValue ? parseCookieValue(cookieValue) : null;

  if (!parsed || parsed.expiresAt < Date.now()) {
    throw new AuthCsrfError();
  }

  const expectedSignature = signCookie(scope, parsed.expiresAt, parsed.tokenHash);
  if (!timingSafeStringEqual(parsed.signature, expectedSignature)) {
    throw new AuthCsrfError();
  }

  const submittedHash = hashToken(token.trim());
  if (!timingSafeStringEqual(submittedHash, parsed.tokenHash)) {
    throw new AuthCsrfError();
  }

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
