import { NextResponse } from "next/server";

import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import { resetPasswordWithToken } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function buildResetLocation(token: string, error: string) {
  const params = new URLSearchParams({ error });
  if (token) params.set("token", token);
  return `${ROUTES.AUTH.RESET_PASSWORD}?${params.toString()}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: buildResetLocation("", "invalid_token") },
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: buildResetLocation(token, "weak_password") },
    });
  }

  const ok = await resetPasswordWithToken(token, password);
  if (!ok) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: buildResetLocation("", "invalid_token") },
    });
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: `${ROUTES.AUTH.LOGIN}?${new URLSearchParams({ status: "password_reset" }).toString()}` },
  });
}
