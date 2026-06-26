import { NextResponse, type NextRequest } from "next/server";

import { INTERNAL_API_KEY_HEADER, INTERNAL_API_SECRET_COOKIE_NAME } from "./lib/api";
import {
  buildSecurityHeaders,
  DEFAULT_SECURITY_HEADERS,
  normalizeSecurityHeadersSettings,
  type SecurityHeadersSettings,
} from "./lib/security-headers";

const API_PREFIX = "/api/";
const SECURITY_HEADERS_CONFIG_PATH = "/api/internal/security-headers";
const SECURITY_IP_DECISION_PATH = "/api/internal/security-ip-decision";
const SECURITY_HEADERS_CACHE_TTL_MS = 30_000;
const SECURITY_IP_DECISION_CACHE_TTL_MS = 15_000;
const globalForSecurityHeaders = globalThis as unknown as {
  securityHeadersCache?: {
    value: SecurityHeadersSettings;
    expiresAt: number;
  };
  securityIpDecisionCache?: Map<string, { blocked: boolean; expiresAt: number }>;
};

function getInternalApiSecret() {
  return process.env.INTERNAL_API_SECRET?.trim() ?? "";
}

function hasInternalSecret(request: NextRequest) {
  const expectedSecret = getInternalApiSecret();
  if (!expectedSecret) {
    return false;
  }

  return (
    request.headers.get(INTERNAL_API_KEY_HEADER) === expectedSecret ||
    request.cookies.get(INTERNAL_API_SECRET_COOKIE_NAME)?.value === expectedSecret
  );
}

function isSecureRequest(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto === "https" || request.nextUrl.protocol === "https:";
}

function getProxyTrustedIp(request: NextRequest) {
  const mode = process.env.AUTH_TRUSTED_PROXY_MODE?.trim().toLowerCase();
  if (mode === "cloudflare") {
    return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
  }

  if (mode === "reverse_proxy") {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "unknown"
    );
  }

  return "unknown";
}

function getIpDecisionCache() {
  if (!globalForSecurityHeaders.securityIpDecisionCache) {
    globalForSecurityHeaders.securityIpDecisionCache = new Map();
  }
  return globalForSecurityHeaders.securityIpDecisionCache;
}

async function isTemporarilyBlockedBySecurityDetection(request: NextRequest) {
  const secret = getInternalApiSecret();
  const ip = getProxyTrustedIp(request);

  if (!secret || !ip || ip === "unknown" || request.nextUrl.pathname === SECURITY_IP_DECISION_PATH) {
    return false;
  }

  const cache = getIpDecisionCache();
  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.blocked;
  }

  try {
    const decisionUrl = new URL(SECURITY_IP_DECISION_PATH, request.url);
    decisionUrl.searchParams.set("ip", ip);
    const response = await fetch(decisionUrl, {
      headers: {
        [INTERNAL_API_KEY_HEADER]: secret,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { blocked?: boolean };
    const blocked = Boolean(payload.blocked);
    if (blocked) {
      cache.set(ip, { blocked, expiresAt: Date.now() + SECURITY_IP_DECISION_CACHE_TTL_MS });
    } else {
      cache.delete(ip);
    }
    return blocked;
  } catch {
    return false;
  }
}

async function unauthorized(request: NextRequest) {
  return applyRuntimeSecurityHeaders(request, NextResponse.json(
    { error: "forbidden", message: "API request is not allowed." },
    { status: 403 }
  ));
}

function shouldApplyRuntimeSecurityHeaders() {
  return process.env.NODE_ENV === "production" || process.env.SECURITY_HEADERS_FORCE === "true";
}

async function getRuntimeSecurityHeadersSettings(request: NextRequest) {
  const cached = globalForSecurityHeaders.securityHeadersCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const secret = getInternalApiSecret();
  if (!secret || request.nextUrl.pathname === SECURITY_HEADERS_CONFIG_PATH) {
    return DEFAULT_SECURITY_HEADERS;
  }

  try {
    const configUrl = new URL(SECURITY_HEADERS_CONFIG_PATH, request.url);
    const response = await fetch(configUrl, {
      headers: {
        [INTERNAL_API_KEY_HEADER]: secret,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_SECURITY_HEADERS;
    }

    const payload = (await response.json()) as Partial<SecurityHeadersSettings>;
    const value = normalizeSecurityHeadersSettings(payload);
    globalForSecurityHeaders.securityHeadersCache = {
      value,
      expiresAt: Date.now() + SECURITY_HEADERS_CACHE_TTL_MS,
    };
    return value;
  } catch {
    return DEFAULT_SECURITY_HEADERS;
  }
}

async function applyRuntimeSecurityHeaders(request: NextRequest, response: NextResponse) {
  if (!shouldApplyRuntimeSecurityHeaders()) {
    return response;
  }

  const settings = await getRuntimeSecurityHeadersSettings(request);
  const headers = buildSecurityHeaders(settings, {
    includeHsts: true,
  });

  for (const [key, value] of headers) {
    response.headers.set(key, value);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  if (await isTemporarilyBlockedBySecurityDetection(request)) {
    return applyRuntimeSecurityHeaders(request, NextResponse.json(
      { error: "rate_limited", message: "Request temporarily blocked." },
      { status: 429 }
    ));
  }

  if (!request.nextUrl.pathname.startsWith(API_PREFIX)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-pathname", request.nextUrl.pathname);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    const secret = getInternalApiSecret();

    if (secret) {
      response.cookies.set(INTERNAL_API_SECRET_COOKIE_NAME, secret, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecureRequest(request),
        path: "/",
      });
    }

    return applyRuntimeSecurityHeaders(request, response);
  }

  if (request.method === "OPTIONS") {
    return unauthorized(request);
  }

  if (hasInternalSecret(request)) {
    return applyRuntimeSecurityHeaders(request, NextResponse.next());
  }

  return unauthorized(request);
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)"],
};
