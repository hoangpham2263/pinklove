const DEFAULT_PUBLIC_DOMAINS = "localhost:3000";
const DEFAULT_ADMIN_DOMAINS = "system.localhost:3000";

export function normalizeHost(value: string | null | undefined) {
  return (value ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

export function parseDomainList(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
}

export const PUBLIC_DOMAINS = parseDomainList(process.env.PUBLIC_DOMAINS || DEFAULT_PUBLIC_DOMAINS);
export const ADMIN_DOMAINS = parseDomainList(process.env.ADMIN_DOMAINS || DEFAULT_ADMIN_DOMAINS);

export function isAdminHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return normalizedHost.length > 0 && ADMIN_DOMAINS.includes(normalizedHost);
}

export function isPublicHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return normalizedHost.length > 0 && PUBLIC_DOMAINS.includes(normalizedHost);
}
