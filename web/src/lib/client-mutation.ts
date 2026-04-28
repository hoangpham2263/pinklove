"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { apiFetch } from "./api";

export type MutationResult = {
  ok: boolean;
  message?: string;
  error?: string;
  location?: string;
  [key: string]: unknown;
};

export async function postForm(action: string, formData: FormData): Promise<MutationResult> {
  const response = await apiFetch(action, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as MutationResult | null;
  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data ?? { ok: true };
}

export function finishMutation(
  router: AppRouterInstance,
  result: MutationResult,
  options: {
    refresh?: boolean;
    redirect?: "push" | "replace" | false;
  } = {}
) {
  const { refresh = true, redirect = "push" } = options;

  if (result.location && redirect === "push") {
    router.push(String(result.location));
    return;
  }

  if (result.location && redirect === "replace") {
    router.replace(String(result.location));
    return;
  }

  if (refresh) {
    router.refresh();
  }
}
