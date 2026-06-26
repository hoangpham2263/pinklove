import "server-only";

import type { SecuritySettings } from "@/lib/system-settings";

export function getSecurityConfigurationWarnings(settings: SecuritySettings) {
  const isProduction = process.env.NODE_ENV === "production";
  const warnings: string[] = [];

  if (!isProduction) return warnings;

  if (!settings.headers.enabled) warnings.push("Production đang tắt toàn bộ security headers.");
  if (!settings.headers.contentSecurityPolicy.enabled) warnings.push("Production đang tắt Content-Security-Policy.");
  if (!settings.headers.xContentTypeOptions) warnings.push("Production đang tắt X-Content-Type-Options: nosniff.");
  if (!settings.uploadSecurity.enabled) warnings.push("Production đang tắt upload security.");
  if (!settings.uploadSecurity.requireMagicBytes) warnings.push("Production upload security đang tắt magic bytes validation.");
  if (!settings.uploadSecurity.blockSvg || !settings.uploadSecurity.blockHtml) {
    warnings.push("Production upload security đang cho phép SVG/HTML nguy hiểm.");
  }
  if (!settings.endpointProtection.enabled) warnings.push("Production đang tắt endpoint protection.");
  if (!settings.detection.enabled) warnings.push("Production đang tắt IP/security event detection.");

  return warnings;
}
