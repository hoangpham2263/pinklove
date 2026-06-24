import { NextResponse } from "next/server";

import { createAuthCsrfToken, type AuthCsrfScope } from "@/lib/auth-csrf";

export const runtime = "nodejs";

const CSRF_SCOPES: AuthCsrfScope[] = ["login", "register", "admin_login", "provider_login"];

function isAuthCsrfScope(value: string): value is AuthCsrfScope {
  return CSRF_SCOPES.includes(value as AuthCsrfScope);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "";

  if (!isAuthCsrfScope(scope)) {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  const token = await createAuthCsrfToken(scope);
  return NextResponse.json({ token });
}
