import { ROUTES } from "./routes";

export const API_ENDPOINTS = ROUTES.API;

export const INTERNAL_API_KEY_HEADER = "x-internal-api-key";
export const INTERNAL_API_SECRET_COOKIE_NAME = "pinklove_api_secret";

export type ApiFetchOptions = RequestInit & {
  acceptJson?: boolean;
};

export async function apiFetch(input: RequestInfo | URL, options: ApiFetchOptions = {}) {
  const { acceptJson = true, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (acceptJson && !requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  return fetch(input, {
    credentials: "same-origin",
    ...init,
    headers: requestHeaders,
  });
}

export async function apiJson<T>(input: RequestInfo | URL, options: ApiFetchOptions = {}) {
  const response = await apiFetch(input, options);
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
    throw new Error(data?.message ?? data?.error ?? "API request failed");
  }

  return (await response.json()) as T;
}
