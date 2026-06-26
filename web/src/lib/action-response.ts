import { NextResponse } from "next/server";

import { recordSecurityEvent } from "@/lib/security-events";

type SuccessOptions = {
  location?: string;
  message?: string;
  data?: Record<string, unknown>;
};

type ErrorOptions = {
  location?: string;
  status?: number;
  error: string;
  message: string;
};

export function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

export function respondSuccess(request: Request, options: SuccessOptions = {}) {
  const { location, message, data } = options;

  if (wantsJson(request)) {
    return NextResponse.json({
      ok: true,
      location,
      message,
      ...(data ?? {}),
    });
  }

  if (location) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: location },
    });
  }

  return new NextResponse(null, { status: 204 });
}

export function respondError(request: Request, options: ErrorOptions) {
  const { location, status = 400, error, message } = options;

  if (status === 403 || status === 404) {
    void recordSecurityEvent({
      request,
      eventType: status === 403 ? "forbidden_api" : "suspicious_path",
      severity: "warn",
      status,
      metadata: { error },
    }).catch(() => undefined);
  }

  if (wantsJson(request)) {
    return NextResponse.json(
      {
        error,
        message,
        location,
      },
      { status }
    );
  }

  if (location) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: location },
    });
  }

  return NextResponse.json({ error, message }, { status });
}
