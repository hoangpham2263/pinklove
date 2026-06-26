import "server-only";

import type { OfferingType } from "@/features/offerings/types";
import { query } from "@/lib/database";
import {
  DEFAULT_SECURITY_HEADERS,
  normalizeSecurityHeadersSettings,
  type SecurityHeadersSettings,
} from "@/lib/security-headers";

const SYSTEM_SETTINGS_CACHE_TTL_MS = 30_000;

const globalForSystemSettings = globalThis as unknown as {
  systemSettingsCache?: {
    value: SystemSettings;
    expiresAt: number;
  };
};

export type BreadcrumbSettings = {
  enabled: boolean;
  showOnPage: boolean;
  includeStructuredData: boolean;
  homeLabel: string;
  separator: string;
  adminEnabled: boolean;
  adminSeparator: string;
  customerEnabled: boolean;
  customerSeparator: string;
  providerEnabled: boolean;
  providerSeparator: string;
};

export type SitemapSettings = {
  enabled: boolean;
  autoDiscovery: boolean;
  includeDiscoveredRoutes: boolean;
  includeManagedPages: boolean;
  includeBlogCategories: boolean;
  includeBlogPosts: boolean;
  includeOfferings: boolean;
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
  siteSlogan: string;
  brandLogo: string;
  chatTeamDisplayName: string;
  supportInboxUsernames: string;
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
  enableVatInvoiceRequest: boolean;
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
  shippingAccount: ShippingAccountSettings;
  shippingAccounts: ShippingAccountSettings[];
};

export type ShippingAccountSettings = {
  code: string;
  enabled: boolean;
  provider: string;
  accountLabel: string;
  shopId: string;
  token: string;
  pickupAddressId: string;
  flatShippingFee: number;
  freeShippingThreshold: number;
};

export type EcommercePaymentMethodSettings = {
  code: string;
  label: string;
  description: string;
  instructions: string;
  enabled: boolean;
  category: "manual" | "offline" | "gateway";
  provider: string;
  type: "manual" | "offline" | "redirect" | "embedded";
  requiresShipping: boolean | null;
  bankName?: string;
  bankQrBankId?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  pay2sEndpoint?: string;
  pay2sPartnerCode?: string;
  pay2sAccessKey?: string;
  pay2sSecretKey?: string;
  pay2sBankAccounts?: string;
  vnpayPaymentUrl?: string;
  vnpayTmnCode?: string;
  vnpayHashSecret?: string;
};

export type InternalOfferingImportApiSettings = {
  enabled: boolean;
  token: string;
  defaultStatus: "draft" | "published";
  allowedOfferingTypes: OfferingType[];
};

export type InternalApisSettings = {
  offeringsImport: InternalOfferingImportApiSettings;
};

export type EmailSettings = {
  enabled: boolean;
  transport: "log" | "smtp";
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  demoRecipient: string;
};

export type ThirdPartySettings = {
  googleOAuth: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
};

export type AuthRateLimitRuleSettings = {
  limit: number;
  windowMinutes: number;
};

export type SecuritySettings = {
  authRateLimits: {
    publicLoginIp: AuthRateLimitRuleSettings;
    publicLoginEmail: AuthRateLimitRuleSettings;
    adminLoginIp: AuthRateLimitRuleSettings;
    adminLoginEmail: AuthRateLimitRuleSettings;
    providerLoginIp: AuthRateLimitRuleSettings;
    providerLoginEmail: AuthRateLimitRuleSettings;
  };
  authRateLimitCleanup: {
    enabled: boolean;
    retentionDays: number;
    lastRunAt: string;
    lastDeletedCount: number;
  };
  detection: {
    enabled: boolean;
    dryRun: boolean;
    autoBlock: boolean;
    requestWindowMinutes: number;
    requestWarnLimit: number;
    requestSuspiciousLimit: number;
    requestBlockLimit: number;
    statusWindowMinutes: number;
    statusWarnLimit: number;
    statusSuspiciousLimit: number;
    statusBlockLimit: number;
    loginFailWindowMinutes: number;
    loginFailWarnLimit: number;
    loginFailSuspiciousLimit: number;
    loginFailBlockLimit: number;
    registerFailWindowMinutes: number;
    registerFailWarnLimit: number;
    registerFailSuspiciousLimit: number;
    registerFailBlockLimit: number;
    scanPathWindowMinutes: number;
    scanPathWarnLimit: number;
    scanPathSuspiciousLimit: number;
    scanPathBlockLimit: number;
    blockDurationMinutes: number;
    whitelistIps: string;
  };
  uploadSecurity: {
    enabled: boolean;
    allowedMimeTypes: string;
    maxFileSizeMb: number;
    maxFilesPerUpload: number;
    maxTotalUploadSizeMb: number;
    blockSvg: boolean;
    blockHtml: boolean;
    requireMagicBytes: boolean;
  };
  endpointProtection: {
    enabled: boolean;
    dryRun: boolean;
    rateLimitEnabled: boolean;
    windowMinutes: number;
    warnLimit: number;
    blockLimit: number;
    blockDurationMinutes: number;
    maxPageSize: number;
    maxSearchResultsPerGroup: number;
    slowThresholdMs: number;
    searchCacheTtlSeconds: number;
    publicDataCacheTtlSeconds: number;
    whitelistIps: string;
    bypassUserIds: string;
  };
  headers: SecurityHeadersSettings;
};

export type SystemSettings = {
  breadcrumb: BreadcrumbSettings;
  sitemap: SitemapSettings;
  indexing: IndexingSettings;
  branding: BrandingSettings;
  opengraph: OpenGraphSettings;
  favicon: FaviconSettings;
  ecommerce: EcommerceSettings;
  internalApis: InternalApisSettings;
  email: EmailSettings;
  thirdParty: ThirdPartySettings;
  security: SecuritySettings;
};

type BrandingStorageSettings = BrandingSettings & FaviconSettings;

type SettingRow = {
  seo_breadcrumb: Record<string, unknown> | null;
  seo_sitemap: Record<string, unknown> | null;
  seo_indexing?: Record<string, unknown> | null;
  seo_branding?: Record<string, unknown> | null;
  seo_opengraph?: Record<string, unknown> | null;
  commerce_config?: Record<string, unknown> | null;
  internal_api_config?: Record<string, unknown> | null;
  email_config?: Record<string, unknown> | null;
  third_party_config?: Record<string, unknown> | null;
  security_config?: Record<string, unknown> | null;
};

const DEFAULT_SETTINGS: SystemSettings = {
  breadcrumb: {
    enabled: true,
    showOnPage: true,
    includeStructuredData: true,
    homeLabel: "Trang chủ",
    separator: "/",
    adminEnabled: true,
    adminSeparator: "/",
    customerEnabled: true,
    customerSeparator: "/",
    providerEnabled: true,
    providerSeparator: "/",
  },
  sitemap: {
    enabled: true,
    autoDiscovery: true,
    includeDiscoveredRoutes: true,
    includeManagedPages: true,
    includeBlogCategories: true,
    includeBlogPosts: true,
    includeOfferings: true,
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
    siteSlogan: "Thiệp cưới online, blog cưới và công cụ cưới hiện đại.",
    brandLogo: "",
    chatTeamDisplayName: "PinkLove",
    supportInboxUsernames: "",
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
    enableVatInvoiceRequest: false,
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
        category: "manual",
        provider: "manual_bank_transfer",
        type: "manual",
        requiresShipping: null,
        bankName: "MB Bank",
        bankQrBankId: "970422",
        bankAccountNumber: "0123456789",
        bankAccountName: "PINKLOVE STUDIO",
      },
      {
        code: "cod",
        label: "Thanh toán tiền mặt",
        description: "Thanh toán trực tiếp khi nhận hàng hoặc khi bàn giao.",
        instructions: "Thanh toán tiền mặt trực tiếp tại studio hoặc khi đội ngũ PinkLove xác nhận lịch bàn giao.",
        enabled: true,
        category: "offline",
        provider: "cash",
        type: "offline",
        requiresShipping: null,
      },
      {
        code: "pay2s",
        label: "Pay2S VietQR",
        description: "Thanh toán qua Pay2S sandbox bằng VietQR/Napas 247.",
        instructions: "Sau khi đặt hàng, hệ thống sẽ chuyển bạn sang Pay2S để hoàn tất thanh toán.",
        enabled: false,
        category: "gateway",
        provider: "pay2s",
        type: "redirect",
        requiresShipping: null,
        pay2sEndpoint: "https://sandbox-payment.pay2s.vn/v1/gateway/api/create",
        pay2sBankAccounts: "",
      },
      {
        code: "vnpay",
        label: "VNPAY",
        description: "Thanh toán qua thẻ ATM nội địa, tài khoản ngân hàng, QR hoặc ví hỗ trợ bởi VNPAY.",
        instructions: "Sau khi đặt hàng, hệ thống sẽ chuyển bạn sang VNPAY để hoàn tất thanh toán.",
        enabled: false,
        category: "gateway",
        provider: "vnpay",
        type: "redirect",
        requiresShipping: null,
        vnpayPaymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      },
    ],
    shippingAccount: {
      code: "default",
      enabled: false,
      provider: "",
      accountLabel: "",
      shopId: "",
      token: "",
      pickupAddressId: "",
      flatShippingFee: 30000,
      freeShippingThreshold: 1500000,
    },
    shippingAccounts: [],
  },
  internalApis: {
    offeringsImport: {
      enabled: false,
      token: "",
      defaultStatus: "draft",
      allowedOfferingTypes: ["physical_product"],
    },
  },
  email: {
    enabled: false,
    transport: "log",
    fromName: "PinkLove",
    fromEmail: "",
    replyTo: "",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: "",
    smtpPassword: "",
    demoRecipient: "",
  },
  thirdParty: {
    googleOAuth: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      redirectUri: "http://localhost:3000/api/auth/google/callback",
    },
  },
  security: {
    authRateLimits: {
      publicLoginIp: {
        limit: 120,
        windowMinutes: 15,
      },
      publicLoginEmail: {
        limit: 10,
        windowMinutes: 15,
      },
      adminLoginIp: {
        limit: 30,
        windowMinutes: 15,
      },
      adminLoginEmail: {
        limit: 5,
        windowMinutes: 15,
      },
      providerLoginIp: {
        limit: 60,
        windowMinutes: 15,
      },
      providerLoginEmail: {
        limit: 6,
        windowMinutes: 15,
      },
    },
    authRateLimitCleanup: {
      enabled: true,
      retentionDays: 7,
      lastRunAt: "",
      lastDeletedCount: 0,
    },
    detection: {
      enabled: true,
      dryRun: true,
      autoBlock: false,
      requestWindowMinutes: 1,
      requestWarnLimit: 120,
      requestSuspiciousLimit: 240,
      requestBlockLimit: 600,
      statusWindowMinutes: 1,
      statusWarnLimit: 30,
      statusSuspiciousLimit: 80,
      statusBlockLimit: 200,
      loginFailWindowMinutes: 15,
      loginFailWarnLimit: 10,
      loginFailSuspiciousLimit: 25,
      loginFailBlockLimit: 60,
      registerFailWindowMinutes: 60,
      registerFailWarnLimit: 8,
      registerFailSuspiciousLimit: 20,
      registerFailBlockLimit: 50,
      scanPathWindowMinutes: 5,
      scanPathWarnLimit: 12,
      scanPathSuspiciousLimit: 30,
      scanPathBlockLimit: 80,
      blockDurationMinutes: 15,
      whitelistIps: "",
    },
    uploadSecurity: {
      enabled: true,
      allowedMimeTypes: "image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,audio/mpeg,audio/mp4",
      maxFileSizeMb: 20,
      maxFilesPerUpload: 10,
      maxTotalUploadSizeMb: 50,
      blockSvg: true,
      blockHtml: true,
      requireMagicBytes: true,
    },
    endpointProtection: {
      enabled: true,
      dryRun: true,
      rateLimitEnabled: true,
      windowMinutes: 1,
      warnLimit: 90,
      blockLimit: 240,
      blockDurationMinutes: 10,
      maxPageSize: 100,
      maxSearchResultsPerGroup: 40,
      slowThresholdMs: 1500,
      searchCacheTtlSeconds: 60,
      publicDataCacheTtlSeconds: 300,
      whitelistIps: "",
      bypassUserIds: "",
    },
    headers: DEFAULT_SECURITY_HEADERS,
  },
};

function mergeRecord<T extends Record<string, unknown>>(base: T, input: Record<string, unknown> | null | undefined): T {
  return {
    ...base,
    ...(input ?? {}),
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
    adminEnabled: merged.adminEnabled === undefined ? DEFAULT_SETTINGS.breadcrumb.adminEnabled : Boolean(merged.adminEnabled),
    adminSeparator: String(merged.adminSeparator || merged.separator || DEFAULT_SETTINGS.breadcrumb.adminSeparator),
    customerEnabled: merged.customerEnabled === undefined ? DEFAULT_SETTINGS.breadcrumb.customerEnabled : Boolean(merged.customerEnabled),
    customerSeparator: String(merged.customerSeparator || merged.separator || DEFAULT_SETTINGS.breadcrumb.customerSeparator),
    providerEnabled:
      merged.providerEnabled === undefined
        ? DEFAULT_SETTINGS.breadcrumb.providerEnabled
        : Boolean(merged.providerEnabled),
    providerSeparator: String(
      merged.providerSeparator || merged.separator || DEFAULT_SETTINGS.breadcrumb.providerSeparator
    ),
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
    includeOfferings: Boolean(merged.includeOfferings),
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
    siteSlogan: String(merged.siteSlogan ?? DEFAULT_SETTINGS.branding.siteSlogan),
    brandLogo: String(merged.brandLogo ?? DEFAULT_SETTINGS.branding.brandLogo),
    chatTeamDisplayName: String(merged.chatTeamDisplayName || merged.siteName || DEFAULT_SETTINGS.branding.chatTeamDisplayName),
    supportInboxUsernames: String(merged.supportInboxUsernames ?? DEFAULT_SETTINGS.branding.supportInboxUsernames),
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
  const parseMethodType = (type: unknown): EcommercePaymentMethodSettings["type"] => {
    if (type === "offline" || type === "redirect" || type === "embedded") {
      return type;
    }
    return "manual";
  };
  const inferMethodCategory = (
    category: unknown,
    type: EcommercePaymentMethodSettings["type"]
  ): EcommercePaymentMethodSettings["category"] => {
    if (category === "manual" || category === "offline" || category === "gateway") {
      return category;
    }
    if (type === "offline") return "offline";
    if (type === "manual") return "manual";
    return "gateway";
  };
  const configuredPaymentMethods = Array.isArray(merged.paymentMethods)
    ? merged.paymentMethods
        .map((item) => (typeof item === "object" && item ? (item as Record<string, unknown>) : null))
        .filter(Boolean)
        .map((item): EcommercePaymentMethodSettings => {
          const type = parseMethodType(item?.type);
          return {
            code: String(item?.code ?? "").trim(),
            label: String(item?.label ?? "").trim(),
            description: String(item?.description ?? "").trim(),
            instructions: String(item?.instructions ?? "").trim(),
            enabled: Boolean(item?.enabled),
            category: inferMethodCategory(item?.category, type),
            provider: String(item?.provider ?? "").trim() || "manual",
            type,
            requiresShipping:
              item?.requiresShipping === true ? true : item?.requiresShipping === false ? false : null,
            bankName: String(item?.bankName ?? "").trim(),
            bankQrBankId: String(item?.bankQrBankId ?? "").trim(),
            bankAccountNumber: String(item?.bankAccountNumber ?? "").trim(),
            bankAccountName: String(item?.bankAccountName ?? "").trim(),
            pay2sEndpoint: String(item?.pay2sEndpoint ?? "").trim(),
            pay2sPartnerCode: String(item?.pay2sPartnerCode ?? "").trim(),
            pay2sAccessKey: String(item?.pay2sAccessKey ?? "").trim(),
            pay2sSecretKey: String(item?.pay2sSecretKey ?? ""),
            pay2sBankAccounts: String(item?.pay2sBankAccounts ?? "").trim(),
            vnpayPaymentUrl: String(item?.vnpayPaymentUrl ?? "").trim(),
            vnpayTmnCode: String(item?.vnpayTmnCode ?? "").trim(),
            vnpayHashSecret: String(item?.vnpayHashSecret ?? ""),
          };
        })
        .filter((item) => item.code && item.label && item.code !== "mock_online")
    : [];
  const paymentMethods =
    configuredPaymentMethods.length > 0
      ? configuredPaymentMethods.map((item) =>
            item.code === "bank_transfer"
              ? {
                  ...item,
                  bankName: item.bankName || String(merged.bankName ?? DEFAULT_SETTINGS.ecommerce.bankName),
                  bankQrBankId: item.bankQrBankId || String(merged.bankQrBankId ?? DEFAULT_SETTINGS.ecommerce.bankQrBankId),
                  bankAccountNumber: item.bankAccountNumber || String(merged.bankAccountNumber ?? DEFAULT_SETTINGS.ecommerce.bankAccountNumber),
                  bankAccountName: item.bankAccountName || String(merged.bankAccountName ?? DEFAULT_SETTINGS.ecommerce.bankAccountName),
                  instructions: item.instructions || String(merged.bankTransferInstructions ?? DEFAULT_SETTINGS.ecommerce.bankTransferInstructions),
                }
              : item.code === "cod"
                ? {
                    ...item,
                    instructions: item.instructions || String(merged.cashPaymentInstructions ?? DEFAULT_SETTINGS.ecommerce.cashPaymentInstructions),
                  }
                : item
          )
      : DEFAULT_SETTINGS.ecommerce.paymentMethods.map((item) => ({
          ...item,
          enabled:
            item.code === "bank_transfer"
              ? Boolean(merged.allowBankTransfer)
              : item.code === "cod"
                ? Boolean(merged.allowCod)
                : item.enabled,
        }));
  const shippingAccountInput =
    typeof merged.shippingAccount === "object" && merged.shippingAccount
      ? (merged.shippingAccount as Record<string, unknown>)
      : {};
  const shippingAccountMerged = mergeRecord(
    DEFAULT_SETTINGS.ecommerce.shippingAccount as unknown as Record<string, unknown>,
    shippingAccountInput
  );
  const legacyShippingAccount = {
    code: String(shippingAccountMerged.code ?? "default").trim() || "default",
    enabled: Boolean(shippingAccountMerged.enabled),
    provider: String(shippingAccountMerged.provider ?? DEFAULT_SETTINGS.ecommerce.shippingAccount.provider).trim(),
    accountLabel: String(
      shippingAccountMerged.accountLabel ?? DEFAULT_SETTINGS.ecommerce.shippingAccount.accountLabel
    ).trim(),
    shopId: String(shippingAccountMerged.shopId ?? DEFAULT_SETTINGS.ecommerce.shippingAccount.shopId).trim(),
    token: String(shippingAccountMerged.token ?? DEFAULT_SETTINGS.ecommerce.shippingAccount.token),
    pickupAddressId: String(
      shippingAccountMerged.pickupAddressId ?? DEFAULT_SETTINGS.ecommerce.shippingAccount.pickupAddressId
    ).trim(),
    flatShippingFee: Number(
      shippingAccountMerged.flatShippingFee ?? merged.flatShippingFee ?? DEFAULT_SETTINGS.ecommerce.flatShippingFee
    ),
    freeShippingThreshold: Number(
      shippingAccountMerged.freeShippingThreshold ??
        merged.freeShippingThreshold ??
        DEFAULT_SETTINGS.ecommerce.freeShippingThreshold
    ),
  };
  const configuredShippingAccounts = Array.isArray(merged.shippingAccounts)
    ? merged.shippingAccounts
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item, index) => ({
          code: String(item.code ?? item.provider ?? `carrier_${index + 1}`).trim() || `carrier_${index + 1}`,
          enabled: Boolean(item.enabled),
          provider: String(item.provider ?? "").trim(),
          accountLabel: String(item.accountLabel ?? "").trim(),
          shopId: String(item.shopId ?? "").trim(),
          token: String(item.token ?? ""),
          pickupAddressId: String(item.pickupAddressId ?? "").trim(),
          flatShippingFee: Number(item.flatShippingFee ?? merged.flatShippingFee ?? DEFAULT_SETTINGS.ecommerce.flatShippingFee),
          freeShippingThreshold: Number(
            item.freeShippingThreshold ?? merged.freeShippingThreshold ?? DEFAULT_SETTINGS.ecommerce.freeShippingThreshold
          ),
        }))
        .filter((item) => item.code || item.provider || item.accountLabel || item.shopId || item.token || item.pickupAddressId)
    : [];
  const shippingAccounts =
    configuredShippingAccounts.length > 0
      ? configuredShippingAccounts
      : legacyShippingAccount.provider ||
          legacyShippingAccount.accountLabel ||
          legacyShippingAccount.shopId ||
          legacyShippingAccount.token ||
          legacyShippingAccount.pickupAddressId
        ? [legacyShippingAccount]
        : [];

  return {
    enabled: Boolean(merged.enabled),
    allowBankTransfer: Boolean(merged.allowBankTransfer),
    allowCod: Boolean(merged.allowCod),
    enableVatInvoiceRequest: Boolean(merged.enableVatInvoiceRequest),
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
    shippingAccount: shippingAccounts[0] ?? legacyShippingAccount,
    shippingAccounts,
  };
}

function parseInternalApisSettings(value: Record<string, unknown> | null | undefined): InternalApisSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.internalApis as Record<string, unknown>, value);
  const offeringsImportInput =
    typeof merged.offeringsImport === "object" && merged.offeringsImport
      ? (merged.offeringsImport as Record<string, unknown>)
      : {};
  const offeringsImportMerged = mergeRecord(
    DEFAULT_SETTINGS.internalApis.offeringsImport as unknown as Record<string, unknown>,
    offeringsImportInput
  );
  return {
    offeringsImport: {
      enabled: Boolean(offeringsImportMerged.enabled),
      token: String(offeringsImportMerged.token ?? ""),
      defaultStatus: offeringsImportMerged.defaultStatus === "published" ? "published" : "draft",
      allowedOfferingTypes: ["physical_product"],
    },
  };
}

function parseEmailSettings(value: Record<string, unknown> | null | undefined): EmailSettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.email as unknown as Record<string, unknown>, value);
  const smtpPort = Number(merged.smtpPort ?? DEFAULT_SETTINGS.email.smtpPort);

  return {
    enabled: Boolean(merged.enabled),
    transport: merged.transport === "smtp" ? "smtp" : "log",
    fromName: String(merged.fromName ?? DEFAULT_SETTINGS.email.fromName).trim(),
    fromEmail: String(merged.fromEmail ?? DEFAULT_SETTINGS.email.fromEmail).trim(),
    replyTo: String(merged.replyTo ?? DEFAULT_SETTINGS.email.replyTo).trim(),
    smtpHost: String(merged.smtpHost ?? DEFAULT_SETTINGS.email.smtpHost).trim(),
    smtpPort: Number.isFinite(smtpPort) && smtpPort > 0 ? smtpPort : DEFAULT_SETTINGS.email.smtpPort,
    smtpSecure: Boolean(merged.smtpSecure),
    smtpUsername: String(merged.smtpUsername ?? DEFAULT_SETTINGS.email.smtpUsername).trim(),
    smtpPassword: String(merged.smtpPassword ?? DEFAULT_SETTINGS.email.smtpPassword),
    demoRecipient: String(merged.demoRecipient ?? DEFAULT_SETTINGS.email.demoRecipient).trim(),
  };
}

function parseThirdPartySettings(value: Record<string, unknown> | null | undefined): ThirdPartySettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.thirdParty as unknown as Record<string, unknown>, value);
  const googleInput =
    typeof merged.googleOAuth === "object" && merged.googleOAuth
      ? (merged.googleOAuth as Record<string, unknown>)
      : {};
  const googleMerged = mergeRecord(
    DEFAULT_SETTINGS.thirdParty.googleOAuth as unknown as Record<string, unknown>,
    googleInput
  );

  return {
    googleOAuth: {
      enabled: Boolean(googleMerged.enabled),
      clientId: String(googleMerged.clientId ?? "").trim(),
      clientSecret: String(googleMerged.clientSecret ?? ""),
      redirectUri: String(googleMerged.redirectUri ?? DEFAULT_SETTINGS.thirdParty.googleOAuth.redirectUri).trim(),
    },
  };
}

function parsePositiveInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function parseAuthRateLimitRuleSettings(
  value: unknown,
  fallback: AuthRateLimitRuleSettings
): AuthRateLimitRuleSettings {
  const input = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  return {
    limit: parsePositiveInteger(input.limit, fallback.limit, 1, 10_000),
    windowMinutes: parsePositiveInteger(input.windowMinutes, fallback.windowMinutes, 1, 24 * 60),
  };
}

function parseSecurityDetectionSettings(value: unknown): SecuritySettings["detection"] {
  const fallback = DEFAULT_SETTINGS.security.detection;
  const input = typeof value === "object" && value ? (value as Record<string, unknown>) : {};

  return {
    enabled: input.enabled === undefined ? fallback.enabled : Boolean(input.enabled),
    dryRun: input.dryRun === undefined ? fallback.dryRun : Boolean(input.dryRun),
    autoBlock: input.autoBlock === undefined ? fallback.autoBlock : Boolean(input.autoBlock),
    requestWindowMinutes: parsePositiveInteger(input.requestWindowMinutes, fallback.requestWindowMinutes, 1, 60),
    requestWarnLimit: parsePositiveInteger(input.requestWarnLimit, fallback.requestWarnLimit, 1, 100_000),
    requestSuspiciousLimit: parsePositiveInteger(input.requestSuspiciousLimit, fallback.requestSuspiciousLimit, 1, 100_000),
    requestBlockLimit: parsePositiveInteger(input.requestBlockLimit, fallback.requestBlockLimit, 1, 100_000),
    statusWindowMinutes: parsePositiveInteger(input.statusWindowMinutes, fallback.statusWindowMinutes, 1, 60),
    statusWarnLimit: parsePositiveInteger(input.statusWarnLimit, fallback.statusWarnLimit, 1, 100_000),
    statusSuspiciousLimit: parsePositiveInteger(input.statusSuspiciousLimit, fallback.statusSuspiciousLimit, 1, 100_000),
    statusBlockLimit: parsePositiveInteger(input.statusBlockLimit, fallback.statusBlockLimit, 1, 100_000),
    loginFailWindowMinutes: parsePositiveInteger(input.loginFailWindowMinutes, fallback.loginFailWindowMinutes, 1, 24 * 60),
    loginFailWarnLimit: parsePositiveInteger(input.loginFailWarnLimit, fallback.loginFailWarnLimit, 1, 100_000),
    loginFailSuspiciousLimit: parsePositiveInteger(input.loginFailSuspiciousLimit, fallback.loginFailSuspiciousLimit, 1, 100_000),
    loginFailBlockLimit: parsePositiveInteger(input.loginFailBlockLimit, fallback.loginFailBlockLimit, 1, 100_000),
    registerFailWindowMinutes: parsePositiveInteger(input.registerFailWindowMinutes, fallback.registerFailWindowMinutes, 1, 24 * 60),
    registerFailWarnLimit: parsePositiveInteger(input.registerFailWarnLimit, fallback.registerFailWarnLimit, 1, 100_000),
    registerFailSuspiciousLimit: parsePositiveInteger(input.registerFailSuspiciousLimit, fallback.registerFailSuspiciousLimit, 1, 100_000),
    registerFailBlockLimit: parsePositiveInteger(input.registerFailBlockLimit, fallback.registerFailBlockLimit, 1, 100_000),
    scanPathWindowMinutes: parsePositiveInteger(input.scanPathWindowMinutes, fallback.scanPathWindowMinutes, 1, 24 * 60),
    scanPathWarnLimit: parsePositiveInteger(input.scanPathWarnLimit, fallback.scanPathWarnLimit, 1, 100_000),
    scanPathSuspiciousLimit: parsePositiveInteger(input.scanPathSuspiciousLimit, fallback.scanPathSuspiciousLimit, 1, 100_000),
    scanPathBlockLimit: parsePositiveInteger(input.scanPathBlockLimit, fallback.scanPathBlockLimit, 1, 100_000),
    blockDurationMinutes: parsePositiveInteger(input.blockDurationMinutes, fallback.blockDurationMinutes, 5, 24 * 60),
    whitelistIps: String(input.whitelistIps ?? fallback.whitelistIps),
  };
}

function parseUploadSecuritySettings(value: unknown): SecuritySettings["uploadSecurity"] {
  const fallback = DEFAULT_SETTINGS.security.uploadSecurity;
  const input = typeof value === "object" && value ? (value as Record<string, unknown>) : {};

  return {
    enabled: input.enabled === undefined ? fallback.enabled : Boolean(input.enabled),
    allowedMimeTypes: String(input.allowedMimeTypes ?? fallback.allowedMimeTypes),
    maxFileSizeMb: parsePositiveInteger(input.maxFileSizeMb, fallback.maxFileSizeMb, 1, 200),
    maxFilesPerUpload: parsePositiveInteger(input.maxFilesPerUpload, fallback.maxFilesPerUpload, 1, 100),
    maxTotalUploadSizeMb: parsePositiveInteger(input.maxTotalUploadSizeMb, fallback.maxTotalUploadSizeMb, 1, 1000),
    blockSvg: input.blockSvg === undefined ? fallback.blockSvg : Boolean(input.blockSvg),
    blockHtml: input.blockHtml === undefined ? fallback.blockHtml : Boolean(input.blockHtml),
    requireMagicBytes: input.requireMagicBytes === undefined ? fallback.requireMagicBytes : Boolean(input.requireMagicBytes),
  };
}

function parseEndpointProtectionSettings(value: unknown): SecuritySettings["endpointProtection"] {
  const fallback = DEFAULT_SETTINGS.security.endpointProtection;
  const input = typeof value === "object" && value ? (value as Record<string, unknown>) : {};

  return {
    enabled: input.enabled === undefined ? fallback.enabled : Boolean(input.enabled),
    dryRun: input.dryRun === undefined ? fallback.dryRun : Boolean(input.dryRun),
    rateLimitEnabled: input.rateLimitEnabled === undefined ? fallback.rateLimitEnabled : Boolean(input.rateLimitEnabled),
    windowMinutes: parsePositiveInteger(input.windowMinutes, fallback.windowMinutes, 1, 60),
    warnLimit: parsePositiveInteger(input.warnLimit, fallback.warnLimit, 1, 100_000),
    blockLimit: parsePositiveInteger(input.blockLimit, fallback.blockLimit, 1, 100_000),
    blockDurationMinutes: parsePositiveInteger(input.blockDurationMinutes, fallback.blockDurationMinutes, 1, 24 * 60),
    maxPageSize: parsePositiveInteger(input.maxPageSize, fallback.maxPageSize, 1, 500),
    maxSearchResultsPerGroup: parsePositiveInteger(input.maxSearchResultsPerGroup, fallback.maxSearchResultsPerGroup, 1, 200),
    slowThresholdMs: parsePositiveInteger(input.slowThresholdMs, fallback.slowThresholdMs, 100, 60_000),
    searchCacheTtlSeconds: parsePositiveInteger(input.searchCacheTtlSeconds, fallback.searchCacheTtlSeconds, 0, 24 * 60 * 60),
    publicDataCacheTtlSeconds: parsePositiveInteger(input.publicDataCacheTtlSeconds, fallback.publicDataCacheTtlSeconds, 0, 24 * 60 * 60),
    whitelistIps: String(input.whitelistIps ?? fallback.whitelistIps),
    bypassUserIds: String(input.bypassUserIds ?? fallback.bypassUserIds),
  };
}

function parseSecuritySettings(value: Record<string, unknown> | null | undefined): SecuritySettings {
  const merged = mergeRecord(DEFAULT_SETTINGS.security as unknown as Record<string, unknown>, value);
  const authRateLimitsInput =
    typeof merged.authRateLimits === "object" && merged.authRateLimits
      ? (merged.authRateLimits as Record<string, unknown>)
      : {};
  const headersInput =
    typeof merged.headers === "object" && merged.headers
      ? (merged.headers as Partial<SecurityHeadersSettings>)
      : {};
  const cleanupInput =
    typeof merged.authRateLimitCleanup === "object" && merged.authRateLimitCleanup
      ? (merged.authRateLimitCleanup as Record<string, unknown>)
      : {};
  const detectionInput =
    typeof merged.detection === "object" && merged.detection
      ? (merged.detection as Record<string, unknown>)
      : {};
  const uploadSecurityInput =
    typeof merged.uploadSecurity === "object" && merged.uploadSecurity
      ? (merged.uploadSecurity as Record<string, unknown>)
      : {};
  const endpointProtectionInput =
    typeof merged.endpointProtection === "object" && merged.endpointProtection
      ? (merged.endpointProtection as Record<string, unknown>)
      : {};

  return {
    authRateLimits: {
      publicLoginIp: parseAuthRateLimitRuleSettings(
        authRateLimitsInput.publicLoginIp,
        DEFAULT_SETTINGS.security.authRateLimits.publicLoginIp
      ),
      publicLoginEmail: parseAuthRateLimitRuleSettings(
        authRateLimitsInput.publicLoginEmail,
        DEFAULT_SETTINGS.security.authRateLimits.publicLoginEmail
      ),
      adminLoginIp: parseAuthRateLimitRuleSettings(
        authRateLimitsInput.adminLoginIp,
        DEFAULT_SETTINGS.security.authRateLimits.adminLoginIp
      ),
      adminLoginEmail: parseAuthRateLimitRuleSettings(
        authRateLimitsInput.adminLoginEmail,
        DEFAULT_SETTINGS.security.authRateLimits.adminLoginEmail
      ),
      providerLoginIp: parseAuthRateLimitRuleSettings(
        authRateLimitsInput.providerLoginIp,
        DEFAULT_SETTINGS.security.authRateLimits.providerLoginIp
      ),
      providerLoginEmail: parseAuthRateLimitRuleSettings(
        authRateLimitsInput.providerLoginEmail,
        DEFAULT_SETTINGS.security.authRateLimits.providerLoginEmail
      ),
    },
    authRateLimitCleanup: {
      enabled:
        cleanupInput.enabled === undefined
          ? DEFAULT_SETTINGS.security.authRateLimitCleanup.enabled
          : Boolean(cleanupInput.enabled),
      retentionDays: parsePositiveInteger(
        cleanupInput.retentionDays,
        DEFAULT_SETTINGS.security.authRateLimitCleanup.retentionDays,
        1,
        365
      ),
      lastRunAt: String(cleanupInput.lastRunAt ?? ""),
      lastDeletedCount: parsePositiveInteger(cleanupInput.lastDeletedCount, 0, 0, 1_000_000),
    },
    detection: parseSecurityDetectionSettings(detectionInput),
    uploadSecurity: parseUploadSecuritySettings(uploadSecurityInput),
    endpointProtection: parseEndpointProtectionSettings(endpointProtectionInput),
    headers: normalizeSecurityHeadersSettings(headersInput),
  };
}

export function getDefaultSecuritySettings(): SecuritySettings {
  return parseSecuritySettings(DEFAULT_SETTINGS.security as unknown as Record<string, unknown>);
}

export async function getSystemSettings(): Promise<SystemSettings> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SETTINGS;
  }

  const cached = globalForSystemSettings.systemSettingsCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  let row: SettingRow | undefined;

  try {
    const result = await query<SettingRow>(`
      SELECT seo_breadcrumb, seo_sitemap, seo_indexing, seo_branding, seo_opengraph, commerce_config
      , internal_api_config, email_config, third_party_config, security_config
      FROM app_settings
      WHERE id = 'system'
      LIMIT 1
    `);
    row = result.rows[0];
  } catch {
    return DEFAULT_SETTINGS;
  }

  const brandingSettings = parseBrandingStorageSettings(row?.seo_branding);

  const settings = {
    breadcrumb: parseBreadcrumbSettings(row?.seo_breadcrumb),
    sitemap: parseSitemapSettings(row?.seo_sitemap),
    indexing: parseIndexingSettings(row?.seo_indexing),
    branding: {
      siteName: brandingSettings.siteName,
      siteSlogan: brandingSettings.siteSlogan,
      brandLogo: brandingSettings.brandLogo,
      chatTeamDisplayName: brandingSettings.chatTeamDisplayName,
      supportInboxUsernames: brandingSettings.supportInboxUsernames,
    },
    opengraph: parseOpenGraphSettings(row?.seo_opengraph),
    favicon: {
      siteFavicon: brandingSettings.siteFavicon,
      appleTouchIcon: brandingSettings.appleTouchIcon,
    },
    ecommerce: parseEcommerceSettings(row?.commerce_config),
    internalApis: parseInternalApisSettings(row?.internal_api_config),
    email: parseEmailSettings(row?.email_config),
    thirdParty: parseThirdPartySettings(row?.third_party_config),
    security: parseSecuritySettings(row?.security_config),
  };

  globalForSystemSettings.systemSettingsCache = {
    value: settings,
    expiresAt: Date.now() + SYSTEM_SETTINGS_CACHE_TTL_MS,
  };

  return settings;
}

function invalidateSystemSettingsCache() {
  globalForSystemSettings.systemSettingsCache = undefined;
}

export async function updateBreadcrumbSettings(input: Partial<BreadcrumbSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.breadcrumb, ...input };

  await query(
    `
    UPDATE app_settings
    SET seo_breadcrumb = $1::jsonb,
        updated_at = NOW()
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
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
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
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
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
  return next;
}

async function updateBrandingStorageSettings(input: Partial<BrandingStorageSettings>) {
  const result = await query<Pick<SettingRow, "seo_branding">>(
    `
    SELECT seo_branding
    FROM app_settings
    WHERE id = 'system'
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
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
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
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
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
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
  return next;
}

export async function updateInternalOfferingImportApiSettings(input: Partial<InternalOfferingImportApiSettings>) {
  const current = await getSystemSettings();
  const next = {
    ...current.internalApis,
    offeringsImport: {
      ...current.internalApis.offeringsImport,
      ...input,
    },
  };

  await query(
    `
    UPDATE app_settings
    SET internal_api_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
  return next.offeringsImport;
}

export async function updateEmailSettings(input: Partial<EmailSettings>) {
  const current = await getSystemSettings();
  const next = { ...current.email, ...input };

  await query(
    `
    UPDATE app_settings
    SET email_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
  return next;
}

export async function updateThirdPartySettings(input: Partial<ThirdPartySettings>) {
  const current = await getSystemSettings();
  const next: ThirdPartySettings = {
    ...current.thirdParty,
    ...input,
    googleOAuth: {
      ...current.thirdParty.googleOAuth,
      ...input.googleOAuth,
    },
  };

  await query(
    `
    UPDATE app_settings
    SET third_party_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 'system'
    `,
    [JSON.stringify(next)]
  );

  invalidateSystemSettingsCache();
  return next;
}

export async function updateSecuritySettings(input: Partial<SecuritySettings>) {
  const current = await getSystemSettings();
  const next: SecuritySettings = {
    ...current.security,
    ...input,
    authRateLimits: {
      ...current.security.authRateLimits,
      ...input.authRateLimits,
    },
    authRateLimitCleanup: {
      ...current.security.authRateLimitCleanup,
      ...input.authRateLimitCleanup,
    },
    detection: {
      ...current.security.detection,
      ...input.detection,
    },
    uploadSecurity: {
      ...current.security.uploadSecurity,
      ...input.uploadSecurity,
    },
    endpointProtection: {
      ...current.security.endpointProtection,
      ...input.endpointProtection,
    },
    headers: normalizeSecurityHeadersSettings({
      ...current.security.headers,
      ...input.headers,
      contentSecurityPolicy: {
        ...current.security.headers.contentSecurityPolicy,
        ...input.headers?.contentSecurityPolicy,
      },
      strictTransportSecurity: {
        ...current.security.headers.strictTransportSecurity,
        ...input.headers?.strictTransportSecurity,
      },
      xFrameOptions: {
        ...current.security.headers.xFrameOptions,
        ...input.headers?.xFrameOptions,
      },
      referrerPolicy: {
        ...current.security.headers.referrerPolicy,
        ...input.headers?.referrerPolicy,
      },
      permissionsPolicy: {
        ...current.security.headers.permissionsPolicy,
        ...input.headers?.permissionsPolicy,
      },
    }),
  };
  const parsed = parseSecuritySettings(next as unknown as Record<string, unknown>);

  await query(
    `
    UPDATE app_settings
    SET security_config = $1::jsonb,
        updated_at = NOW()
    WHERE id = 'system'
    `,
    [JSON.stringify(parsed)]
  );

  invalidateSystemSettingsCache();
  return parsed;
}
