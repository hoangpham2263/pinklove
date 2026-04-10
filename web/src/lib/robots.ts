import "server-only";

import type { SystemSettings } from "@/lib/system-settings";

export function buildRobotsContent(siteUrl: string, settings: SystemSettings) {
  const lines = ["User-agent: *"];

  if (!settings.indexing.siteIndexingEnabled) {
    lines.push("Disallow: /");
  } else {
    lines.push("Allow: /");
    if (settings.indexing.disallowAdmin) lines.push("Disallow: /admin/");
    if (settings.indexing.disallowUser) lines.push("Disallow: /user/");
    if (settings.indexing.disallowApi) lines.push("Disallow: /api/");
  }

  const customRules = settings.indexing.customRobotsRules
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (customRules.length) {
    lines.push("");
    lines.push(...customRules);
  }

  if (settings.indexing.includeSitemapInRobots && settings.sitemap.enabled) {
    lines.push("");
    lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
  }

  lines.push("");

  return lines.join("\n");
}
