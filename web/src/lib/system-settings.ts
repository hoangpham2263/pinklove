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

export type BrandingSettings = {
  siteName: string;
  brandLogo: string;
};

export type OpenGraphSettings = {
  locale: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  twitterCard: "summary" | "summary_large_image";
};

export type FaviconSettings = {
  siteFavicon: string;
  appleTouchIcon: string;
};

export type EcommerceSettings = {
  enabled: boolean;
  allowBankTransfer: boolean;
  allowCod: boolean;
  autoApproveMockPayments: boolean;
  supportShipping: boolean;
  flatShippingFee: number;
  freeShippingThreshold: number;
  bankTransferInstructions: string;
  currency: string;
  currencySymbol: string;
  thousandSeparator: "," | ".";
  decimalSeparator: "," | ".";
};

export type SystemSettings = {
  permalink: PermalinkSettings;
  breadcrumb: BreadcrumbSettings;
  sitemap: SitemapSettings;
  indexing: IndexingSettings;
  branding: BrandingSettings;
  opengraph: OpenGraphSettings;
  favicon: FaviconSettings;
  ecommerce: EcommerceSettings;
};

type SettingRow = {
  seo_permalink: Record<string, unknown> | null;
  seo_breadcrumb: Record<string, unknown> | null;
  seo_sitemap: Record<string, unknown> | null;
  seo_indexing?: Record<string, unknown> | null;
  seo_branding?: Record<string, unknown> | null;
  seo_opengraph?: Record<string, unknown> | null;
  seo_favicon?: Record<string, unknown> | null;
  commerce_config?: Record<string, unknown> | null;
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
  branding: {
    siteName: "PinkLove",
    brandLogo: "",
  },
  opengraph: {
    locale: "vi_VN",
    defaultTitle: "PinkLove",
    defaultDescription: "Thiệp cưới online, blog cưới, công cụ cưới và builder tạo thiệp tối ưu cho trải nghiệm chia sẻ.",
    defaultImage: "",
    twitterCard: "summary_large_image",
  },
  favicon: {
    siteFavicon: "",
    appleTouchIcon: "",
  },
  ecommerce: {
    enabled: true,
    allowBankTransfer: true,
    allowCod: true,
    autoApproveMockPayments: true,
    supportShipping: true,
    flatShippingFee: 30000,
    freeShippingThreshold: 1500000,
    bankTransferInstructions: "Chuyển khoản vào tài khoản công ty và ghi rõ mã đơn hàng trong nội dung.",
    currency: "VND",
    currencySymbol: "₫",
    thousandSeparator: ".",
    decimalSeparator: ",",
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

function parseBrandingSettings(
  value: Record<string, unknown> | null | undefined,
  legacyOpenGraph: Record<string, unknown> | null | undefined
): BrandingSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.branding as Record<string, unknown>, value);
  return {
    siteName: String(
      merged.siteName ||
        legacyOpenGraph?.siteName ||
        DEFAULT_SETTINGS.branding.siteName
    ),
    brandLogo: String(
      merged.brandLogo ??
        legacyOpenGraph?.siteLogo ??
        DEFAULT_SETTINGS.branding.brandLogo
    ),
  };
}

function parseOpenGraphSettings(value: Record<string, unknown> | null | undefined): OpenGraphSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.opengraph as Record<string, unknown>, value);
  return {
    locale: String(merged.locale || DEFAULT_SETTINGS.opengraph.locale),
    defaultTitle: String(merged.defaultTitle || DEFAULT_SETTINGS.opengraph.defaultTitle),
    defaultDescription: String(merged.defaultDescription || DEFAULT_SETTINGS.opengraph.defaultDescription),
    defaultImage: String(merged.defaultImage ?? DEFAULT_SETTINGS.opengraph.defaultImage),
    twitterCard: merged.twitterCard === "summary" ? "summary" : "summary_large_image",
  };
}

function parseFaviconSettings(value: Record<string, unknown> | null | undefined): FaviconSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.favicon as Record<string, unknown>, value);
  return {
    siteFavicon: String(merged.siteFavicon ?? DEFAULT_SETTINGS.favicon.siteFavicon),
    appleTouchIcon: String(merged.appleTouchIcon ?? DEFAULT_SETTINGS.favicon.appleTouchIcon),
  };
}

function parseEcommerceSettings(value: Record<string, unknown> | null | undefined): EcommerceSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.ecommerce as Record<string, unknown>, value);
  return {
    enabled: Boolean(merged.enabled),
    allowBankTransfer: Boolean(merged.allowBankTransfer),
    allowCod: Boolean(merged.allowCod),
    autoApproveMockPayments: Boolean(merged.autoApproveMockPayments),
    supportShipping: Boolean(merged.supportShipping),
    flatShippingFee: Number(merged.flatShippingFee ?? DEFAULT_SETTINGS.ecommerce.flatShippingFee),
    freeShippingThreshold: Number(merged.freeShippingThreshold ?? DEFAULT_SETTINGS.ecommerce.freeShippingThreshold),
    bankTransferInstructions: String(merged.bankTransferInstructions ?? DEFAULT_SETTINGS.ecommerce.bankTransferInstructions),
    currency: String(merged.currency ?? DEFAULT_SETTINGS.ecommerce.currency),
    currencySymbol: String(merged.currencySymbol ?? DEFAULT_SETTINGS.ecommerce.currencySymbol),
    thousandSeparator:
      merged.thousandSeparator === ","
        ? ","
        : merged.thousandSeparator === "."
          ? "."
          : DEFAULT_SETTINGS.ecommerce.thousandSeparator,
    decimalSeparator:
      merged.decimalSeparator === ","
        ? ","
        : merged.decimalSeparator === "."
          ? "."
          : DEFAULT_SETTINGS.ecommerce.decimalSeparator,
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SETTINGS;
  }

  let row: SettingRow | undefined;

  try {
    const result = await query<SettingRow>(`
      SELECT seo_permalink, seo_breadcrumb, seo_sitemap, seo_indexing, seo_branding, seo_opengraph, seo_favicon, commerce_config
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
    branding: parseBrandingSettings(row?.seo_branding, row?.seo_opengraph),
    opengraph: parseOpenGraphSettings(row?.seo_opengraph),
    favicon: parseFaviconSettings(row?.seo_favicon),
    ecommerce: parseEcommerceSettings(row?.commerce_config),
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

export async function updateBrandingSettings(input: Partial<BrandingSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.branding, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_branding = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}

export async function updateOpenGraphSettings(input: Partial<OpenGraphSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.opengraph, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_opengraph = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}

export async function updateFaviconSettings(input: Partial<FaviconSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.favicon, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_favicon = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}

export async function updateEcommerceSettings(input: Partial<EcommerceSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.ecommerce, ...input };

  await query(
    `
    UPDATE app_settings
    SET commerce_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next;
}
