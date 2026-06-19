import "server-only";

import type { OfferingType } from "@/features/offerings/types";
import { query } from "@/lib/database";

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

export async function getSystemSettings(): Promise<SystemSettings> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SETTINGS;
  }

  let row: SettingRow | undefined;

  try {
    const result = await query<SettingRow>(`
      SELECT seo_breadcrumb, seo_sitemap, seo_indexing, seo_branding, seo_opengraph, commerce_config
      , internal_api_config, email_config, third_party_config
      FROM app_settings
      WHERE id = 'system'
      LIMIT 1
    `);
    row = result.rows[0];
  } catch {
    return DEFAULT_SETTINGS;
  }

  const brandingSettings = parseBrandingStorageSettings(row?.seo_branding);

  return {
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
  };
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

  return next;
}
