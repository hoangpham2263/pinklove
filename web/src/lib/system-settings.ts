import "server-only";

import type { ProductType } from "@/features/products/types";
import { query } from "@/lib/database";

export type PermalinkSettings = {
  legacyRedirects: boolean;
  enforceLeadingSlash: boolean;
  stripTrailingSlash: boolean;
  blogPostPattern: string;
  blogCategoryBase: string;
  templateBase: string;
  builderBase: string;
  productBase: string;
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
  bankName: string;
  bankQrBankId: string;
  bankAccountNumber: string;
  bankAccountName: string;
  cashPaymentInstructions: string;
  currency: string;
  currencySymbol: string;
  thousandSeparator: "," | ".";
  decimalSeparator: "," | ".";
  paymentMethods: EcommercePaymentMethodSettings[];
};

export type EcommercePaymentMethodSettings = {
  code: string;
  label: string;
  description: string;
  instructions: string;
  enabled: boolean;
  provider: string;
  type: "manual" | "offline" | "mock";
  requiresShipping: boolean | null;
};

export type InternalProductImportApiSettings = {
  enabled: boolean;
  token: string;
  defaultStatus: "draft" | "published";
  allowedProductTypes: ProductType[];
};

export type InternalApisSettings = {
  productsImport: InternalProductImportApiSettings;
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
  internalApis: InternalApisSettings;
};

type BrandingStorageSettings = BrandingSettings & FaviconSettings;

type SettingRow = {
  seo_permalink: Record<string, unknown> | null;
  seo_breadcrumb: Record<string, unknown> | null;
  seo_sitemap: Record<string, unknown> | null;
  seo_indexing?: Record<string, unknown> | null;
  seo_branding?: Record<string, unknown> | null;
  seo_opengraph?: Record<string, unknown> | null;
  commerce_config?: Record<string, unknown> | null;
  internal_api_config?: Record<string, unknown> | null;
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
    productBase: "products",
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
    bankTransferInstructions: "Quét mã QR hoặc chuyển khoản vào tài khoản của PinkLove, sau đó ghi đúng mã đơn hàng trong nội dung chuyển khoản để đội ngũ xác nhận nhanh hơn.",
    bankName: "MB Bank",
    bankQrBankId: "970422",
    bankAccountNumber: "0123456789",
    bankAccountName: "PINKLOVE STUDIO",
    cashPaymentInstructions: "Thanh toán tiền mặt trực tiếp tại studio hoặc khi đội ngũ PinkLove xác nhận lịch bàn giao.",
    currency: "VND",
    currencySymbol: "₫",
    thousandSeparator: ".",
    decimalSeparator: ",",
    paymentMethods: [
      {
        code: "bank_transfer",
        label: "Chuyển khoản QR",
        description: "Quét mã QR hoặc chuyển khoản thủ công rồi gửi đúng nội dung đơn hàng để hệ thống đối soát nhanh hơn.",
        instructions: "Quét mã QR hoặc chuyển khoản vào tài khoản của PinkLove, sau đó ghi đúng mã đơn hàng trong nội dung chuyển khoản để đội ngũ xác nhận nhanh hơn.",
        enabled: true,
        provider: "manual_bank_transfer",
        type: "manual",
        requiresShipping: null,
      },
      {
        code: "cod",
        label: "Thanh toán tiền mặt",
        description: "Thanh toán trực tiếp khi nhận hàng hoặc khi bàn giao.",
        instructions: "Thanh toán tiền mặt trực tiếp tại studio hoặc khi đội ngũ PinkLove xác nhận lịch bàn giao.",
        enabled: true,
        provider: "cash",
        type: "offline",
        requiresShipping: null,
      },
      {
        code: "mock_online",
        label: "Thanh toán online mô phỏng",
        description: "Phục vụ dev/test, có thể tự động chuyển đơn sang trạng thái đã thanh toán nếu cấu hình cho phép.",
        instructions: "Phương thức nội bộ dành cho môi trường dev/test.",
        enabled: false,
        provider: "mock",
        type: "mock",
        requiresShipping: null,
      },
    ],
  },
  internalApis: {
    productsImport: {
      enabled: false,
      token: "",
      defaultStatus: "draft",
      allowedProductTypes: ["general_product"],
    },
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
    productBase: String(merged.productBase ?? merged.paperBase ?? DEFAULT_SETTINGS.permalink.productBase),
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

function parseBrandingSettings(value: Record<string, unknown> | null | undefined): BrandingSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.branding as Record<string, unknown>, value);
  return {
    siteName: String(merged.siteName || DEFAULT_SETTINGS.branding.siteName),
    brandLogo: String(merged.brandLogo ?? DEFAULT_SETTINGS.branding.brandLogo),
  };
}

function parseBrandingStorageSettings(value: Record<string, unknown> | null | undefined): BrandingStorageSettings {
  return {
    ...parseBrandingSettings(value),
    ...parseFaviconSettings(value),
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
  const configuredPaymentMethods = Array.isArray(merged.paymentMethods)
    ? merged.paymentMethods
        .map((item) => (typeof item === "object" && item ? (item as Record<string, unknown>) : null))
        .filter(Boolean)
        .map((item): EcommercePaymentMethodSettings => ({
          code: String(item?.code ?? "").trim(),
          label: String(item?.label ?? "").trim(),
          description: String(item?.description ?? "").trim(),
          instructions: String(item?.instructions ?? "").trim(),
          enabled: Boolean(item?.enabled),
          provider: String(item?.provider ?? "").trim() || "manual",
          type: item?.type === "mock" ? "mock" : item?.type === "offline" ? "offline" : "manual",
          requiresShipping:
            item?.requiresShipping === true ? true : item?.requiresShipping === false ? false : null,
        }))
        .filter((item) => item.code && item.label)
    : [];
  const paymentMethods =
    configuredPaymentMethods.length > 0
      ? configuredPaymentMethods
      : DEFAULT_SETTINGS.ecommerce.paymentMethods.map((item) => ({
          ...item,
          enabled:
            item.code === "bank_transfer"
              ? Boolean(merged.allowBankTransfer)
              : item.code === "cod"
                ? Boolean(merged.allowCod)
                : item.enabled,
        }));

  return {
    enabled: Boolean(merged.enabled),
    allowBankTransfer: Boolean(merged.allowBankTransfer),
    allowCod: Boolean(merged.allowCod),
    autoApproveMockPayments: Boolean(merged.autoApproveMockPayments),
    supportShipping: Boolean(merged.supportShipping),
    flatShippingFee: Number(merged.flatShippingFee ?? DEFAULT_SETTINGS.ecommerce.flatShippingFee),
    freeShippingThreshold: Number(merged.freeShippingThreshold ?? DEFAULT_SETTINGS.ecommerce.freeShippingThreshold),
    bankTransferInstructions: String(merged.bankTransferInstructions ?? DEFAULT_SETTINGS.ecommerce.bankTransferInstructions),
    bankName: String(merged.bankName ?? DEFAULT_SETTINGS.ecommerce.bankName),
    bankQrBankId: String(merged.bankQrBankId ?? DEFAULT_SETTINGS.ecommerce.bankQrBankId),
    bankAccountNumber: String(merged.bankAccountNumber ?? DEFAULT_SETTINGS.ecommerce.bankAccountNumber),
    bankAccountName: String(merged.bankAccountName ?? DEFAULT_SETTINGS.ecommerce.bankAccountName),
    cashPaymentInstructions: String(merged.cashPaymentInstructions ?? DEFAULT_SETTINGS.ecommerce.cashPaymentInstructions),
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
    paymentMethods,
  };
}

function parseInternalApisSettings(value: Record<string, unknown> | null | undefined): InternalApisSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.internalApis as Record<string, unknown>, value);
  const productsImportInput =
    typeof merged.productsImport === "object" && merged.productsImport
      ? (merged.productsImport as Record<string, unknown>)
      : {};
  const productsImportMerged = mergeRecord(
    DEFAULT_SETTINGS.internalApis.productsImport as unknown as Record<string, unknown>,
    productsImportInput
  );
  const allowedProductTypes = Array.isArray(productsImportMerged.allowedProductTypes)
    ? productsImportMerged.allowedProductTypes
        .map((value) => String(value))
        .filter(
          (value): value is ProductType =>
            value === "coded_template" || value === "builder_template" || value === "general_product"
        )
    : DEFAULT_SETTINGS.internalApis.productsImport.allowedProductTypes;

  return {
    productsImport: {
      enabled: Boolean(productsImportMerged.enabled),
      token: String(productsImportMerged.token ?? ""),
      defaultStatus: productsImportMerged.defaultStatus === "published" ? "published" : "draft",
      allowedProductTypes:
        allowedProductTypes.length > 0
          ? allowedProductTypes
          : DEFAULT_SETTINGS.internalApis.productsImport.allowedProductTypes,
    },
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SETTINGS;
  }

  let row: SettingRow | undefined;

  try {
    const result = await query<SettingRow>(`
      SELECT seo_permalink, seo_breadcrumb, seo_sitemap, seo_indexing, seo_branding, seo_opengraph, commerce_config
      , internal_api_config
      FROM app_settings
      WHERE id = 1
      LIMIT 1
    `);
    row = result.rows[0];
  } catch {
    return DEFAULT_SETTINGS;
  }

  const brandingSettings = parseBrandingStorageSettings(row?.seo_branding);

  return {
    permalink: parsePermalinkSettings(row?.seo_permalink),
    breadcrumb: parseBreadcrumbSettings(row?.seo_breadcrumb),
    sitemap: parseSitemapSettings(row?.seo_sitemap),
    indexing: parseIndexingSettings(row?.seo_indexing),
    branding: {
      siteName: brandingSettings.siteName,
      brandLogo: brandingSettings.brandLogo,
    },
    opengraph: parseOpenGraphSettings(row?.seo_opengraph),
    favicon: {
      siteFavicon: brandingSettings.siteFavicon,
      appleTouchIcon: brandingSettings.appleTouchIcon,
    },
    ecommerce: parseEcommerceSettings(row?.commerce_config),
    internalApis: parseInternalApisSettings(row?.internal_api_config),
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

async function updateBrandingStorageSettings(input: Partial<BrandingStorageSettings>) {
  const result = await query<Pick<SettingRow, "seo_branding">>(
    `
    SELECT seo_branding
    FROM app_settings
    WHERE id = 1
    LIMIT 1
    `
  );
  const current = parseBrandingStorageSettings(result.rows[0]?.seo_branding);
  const next = { ...current, ...input };

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

export async function updateBrandingSettings(input: Partial<BrandingSettings & FaviconSettings>) {
  return updateBrandingStorageSettings(input);
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
  const next = await updateBrandingStorageSettings(input);
  return {
    siteFavicon: next.siteFavicon,
    appleTouchIcon: next.appleTouchIcon,
  };
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

export async function updateInternalProductImportApiSettings(input: Partial<InternalProductImportApiSettings>) {
  const current = await getSystemSettings();
  const next = {
    ...current.internalApis,
    productsImport: {
      ...current.internalApis.productsImport,
      ...input,
    },
  };

  await query(
    `
    UPDATE app_settings
    SET internal_api_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 1
    `,
    [JSON.stringify(next)]
  );

  return next.productsImport;
}
