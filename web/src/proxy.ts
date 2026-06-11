import { NextResponse, type NextRequest } from "next/server";

import { INTERNAL_API_KEY_HEADER, INTERNAL_API_SECRET_COOKIE_NAME } from "./lib/api";

const API_PREFIX = "/api/";

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

function unauthorized() {
  return NextResponse.json(
    { error: "forbidden", message: "API request is not allowed." },
    { status: 403 }
  );
}

export function proxy(request: NextRequest) {
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

    return response;
  }

  if (request.method === "OPTIONS") {
    return unauthorized();
  }

  if (hasInternalSecret(request)) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)"],
};
