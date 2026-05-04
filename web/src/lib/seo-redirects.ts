import "server-only";

import { getSystemSettings, type SeoRedirectRule } from "@/lib/system-settings";

export function normalizeSeoRedirectSource(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const pathOnly = trimmed.split("#")[0]?.split("?")[0] ?? trimmed;
  const collapsed = pathOnly.replace(/\/{2,}/g, "/");
  const normalized = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : normalized;
}

export function normalizeSeoRedirectTarget(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const collapsed = trimmed.replace(/\/{2,}/g, "/");
  const normalized = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : normalized;
}

export function isValidSeoRedirectTarget(input: string) {
  return input.startsWith("/") || /^https?:\/\//i.test(input);
}

export async function getSeoRedirectForPath(pathname: string): Promise<SeoRedirectRule | null> {
  const normalizedPath = normalizeSeoRedirectSource(pathname);
  if (!normalizedPath) return null;

  const settings = await getSystemSettings();
  return (
    settings.redirects.rules.find(
      (rule) => rule.enabled && normalizeSeoRedirectSource(rule.sourcePath) === normalizedPath
    ) ?? null
  );
}
