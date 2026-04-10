import "server-only";

import { query } from "@/lib/database";

export type PermalinkSettings = {
  legacyRedirects: boolean;
  enforceLeadingSlash: boolean;
  stripTrailingSlash: boolean;
  blogPostPattern: string;
  blogCategoryBase: string;
  templateBase: string;
  builderBase: string;
  invitationBase: string;
};

export type BreadcrumbSettings = {
  enabled: boolean;
  showOnPage: boolean;
  includeStructuredData: boolean;
  homeLabel: string;
  separator: string;
};

export type SitemapSettings = {
  enabled: boolean;
  autoDiscovery: boolean;
  includeDiscoveredRoutes: boolean;
  includeManagedPages: boolean;
  includeBlogCategories: boolean;
  includeBlogPosts: boolean;
  includeProducts: boolean;
  includePublicSites: boolean;
};

export type IndexingSettings = {
  siteIndexingEnabled: boolean;
  includeSitemapInRobots: boolean;
  disallowAdmin: boolean;
  disallowUser: boolean;
  disallowApi: boolean;
  customRobotsRules: string;
};

export type SystemSettings = {
  permalink: PermalinkSettings;
  breadcrumb: BreadcrumbSettings;
  sitemap: SitemapSettings;
  indexing: IndexingSettings;
};

type SettingRow = {
  seo_permalink: Record<string, unknown> | null;
  seo_breadcrumb: Record<string, unknown> | null;
  seo_sitemap: Record<string, unknown> | null;
  seo_indexing?: Record<string, unknown> | null;
};

const DEFAULT_SETTINGS: SystemSettings = {
  permalink: {
    legacyRedirects: true,
    enforceLeadingSlash: true,
    stripTrailingSlash: true,
    blogPostPattern: "/blog/post/%postname%",
    blogCategoryBase: "blog",
    templateBase: "templates",
    builderBase: "builder",
    invitationBase: "invitations",
  },
  breadcrumb: {
    enabled: true,
    showOnPage: true,
    includeStructuredData: true,
    homeLabel: "Trang chủ",
    separator: "/",
  },
  sitemap: {
    enabled: true,
    autoDiscovery: true,
    includeDiscoveredRoutes: true,
    includeManagedPages: true,
    includeBlogCategories: true,
    includeBlogPosts: true,
    includeProducts: true,
    includePublicSites: true,
  },
  indexing: {
    siteIndexingEnabled: true,
    includeSitemapInRobots: true,
    disallowAdmin: true,
    disallowUser: true,
    disallowApi: true,
    customRobotsRules: "",
  },
};

function mergeRecord<T extends Record<string, unknown>>(base: T, input: Record<string, unknown> | null | undefined): T {
  return {
    ...base,
    ...(input ?? {}),
  };
}

function parsePermalinkSettings(value: Record<string, unknown> | null | undefined): PermalinkSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.permalink as Record<string, unknown>, value);
  return {
    legacyRedirects: Boolean(merged.legacyRedirects),
    enforceLeadingSlash: Boolean(merged.enforceLeadingSlash),
    stripTrailingSlash: Boolean(merged.stripTrailingSlash),
    blogPostPattern: String(merged.blogPostPattern ?? DEFAULT_SETTINGS.permalink.blogPostPattern),
    blogCategoryBase: String(merged.blogCategoryBase ?? DEFAULT_SETTINGS.permalink.blogCategoryBase),
    templateBase: String(merged.templateBase ?? DEFAULT_SETTINGS.permalink.templateBase),
    builderBase: String(merged.builderBase ?? DEFAULT_SETTINGS.permalink.builderBase),
    invitationBase: String(merged.invitationBase ?? DEFAULT_SETTINGS.permalink.invitationBase),
  };
}

function parseBreadcrumbSettings(value: Record<string, unknown> | null | undefined): BreadcrumbSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.breadcrumb as Record<string, unknown>, value);
  return {
    enabled: Boolean(merged.enabled),
    showOnPage: Boolean(merged.showOnPage),
    includeStructuredData: Boolean(merged.includeStructuredData),
    homeLabel: String(merged.homeLabel || DEFAULT_SETTINGS.breadcrumb.homeLabel),
    separator: String(merged.separator || DEFAULT_SETTINGS.breadcrumb.separator),
  };
}

function parseSitemapSettings(value: Record<string, unknown> | null | undefined): SitemapSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.sitemap as Record<string, unknown>, value);
  const includeManagedPages = merged.includeManagedPages ?? merged.includeCmsPages;
  const includePublicSites = merged.includePublicSites ?? merged.includeInvitationSites;
  return {
    enabled: Boolean(merged.enabled),
    autoDiscovery: Boolean(merged.autoDiscovery),
    includeDiscoveredRoutes: Boolean(merged.includeDiscoveredRoutes),
    includeManagedPages: Boolean(includeManagedPages),
    includeBlogCategories: Boolean(merged.includeBlogCategories),
    includeBlogPosts: Boolean(merged.includeBlogPosts),
    includeProducts: Boolean(merged.includeProducts),
    includePublicSites: Boolean(includePublicSites),
  };
}

function parseIndexingSettings(value: Record<string, unknown> | null | undefined): IndexingSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.indexing as Record<string, unknown>, value);
  return {
    siteIndexingEnabled: Boolean(merged.siteIndexingEnabled),
    includeSitemapInRobots: Boolean(merged.includeSitemapInRobots),
    disallowAdmin: Boolean(merged.disallowAdmin),
    disallowUser: Boolean(merged.disallowUser),
    disallowApi: Boolean(merged.disallowApi),
    customRobotsRules: String(merged.customRobotsRules ?? DEFAULT_SETTINGS.indexing.customRobotsRules),
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SETTINGS;
  }

  let row: SettingRow | undefined;

  try {
    const result = await query<SettingRow>(`
      SELECT seo_permalink, seo_breadcrumb, seo_sitemap, seo_indexing
      FROM app_settings
      WHERE id = 1
      LIMIT 1
    `);
    row = result.rows[0];
  } catch {
    return DEFAULT_SETTINGS;
  }

  return {
    permalink: parsePermalinkSettings(row?.seo_permalink),
    breadcrumb: parseBreadcrumbSettings(row?.seo_breadcrumb),
    sitemap: parseSitemapSettings(row?.seo_sitemap),
    indexing: parseIndexingSettings(row?.seo_indexing),
  };
}

export async function updatePermalinkSettings(input: Partial<PermalinkSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.permalink, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_permalink = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}

export async function updateBreadcrumbSettings(input: Partial<BreadcrumbSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.breadcrumb, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_breadcrumb = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}

export async function updateSitemapSettings(input: Partial<SitemapSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.sitemap, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_sitemap = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}

export async function updateIndexingSettings(input: Partial<IndexingSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.indexing, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_indexing = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}
