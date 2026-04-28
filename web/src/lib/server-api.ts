import "server-only";

import { INTERNAL_API_KEY_HEADER, apiFetch, type ApiFetchOptions } from "./api";

export function getInternalApiSecret() {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) {
    throw new Error("INTERNAL_API_SECRET is required for internal API calls.");
  }

  return secret;
}

export async function internalApiFetch(input: RequestInfo | URL, options: ApiFetchOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set(INTERNAL_API_KEY_HEADER, getInternalApiSecret());

  return apiFetch(input, {
    ...options,
    headers,
  });
}

