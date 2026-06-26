import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import {
  getDefaultSecuritySettings,
  getSystemSettings,
  updateBrandingSettings,
  updateIndexingSettings,
  updateBreadcrumbSettings,
  updateEcommerceSettings,
  updateFaviconSettings,
  updateEmailSettings,
  updateInternalOfferingImportApiSettings,
  updateOpenGraphSettings,
  updateSitemapSettings,
  updateThirdPartySettings,
  updateSecuritySettings,
} from "@/lib/system-settings";
import type { BreadcrumbSettings, IndexingSettings, SecuritySettings, ShippingAccountSettings, SitemapSettings } from "@/lib/system-settings";
import { hasAdminPermission } from "@/features/access/server/service";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";

export const runtime = "nodejs";

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getIndexedValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value ?? ""));
}

function parsePositiveInt(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key) ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

const SECURITY_SECTIONS = new Set([
  "security",
  "security_cleanup",
  "security_detection",
  "security_headers",
  "upload_security",
  "endpoint_protection",
]);

const SECURITY_RESET_SECTIONS = new Set(Array.from(SECURITY_SECTIONS).map((item) => `${item}_reset`));

function containsDangerousWildcard(value: string) {
  return /(^|\s)\*(\s|$)/.test(value) || value.includes("://*") || value.includes("://*.");
}

function validateSecurityHeaderInput(formData: FormData) {
  const cspFields = [
    "cspDefaultSrc",
    "cspScriptSrc",
    "cspStyleSrc",
    "cspImgSrc",
    "cspConnectSrc",
    "cspFontSrc",
    "cspFrameSrc",
    "cspFrameAncestors",
  ];
  const hasWildcard = cspFields.some((key) => containsDangerousWildcard(String(formData.get(key) ?? "")));
  if (hasWildcard && !isChecked(formData, "confirmDangerousWildcard")) {
    return "CSP có wildcard nguy hiểm. Hãy bật xác nhận wildcard nguy hiểm nếu thật sự cần.";
  }
  return null;
}

async function requireSecurityEditPermission(request: Request, adminId: string) {
  if (await hasAdminPermission(adminId, "security.settings.edit")) return null;
  return respondError(request, {
    status: 403,
    error: "FORBIDDEN",
    message: "Bạn cần quyền security.settings.edit để đổi cấu hình bảo mật.",
    location: ROUTES.ADMIN.SECURITY_SETTINGS,
  });
}

async function updateSecuritySettingsWithAudit(input: {
  request: Request;
  adminId: string;
  section: string;
  targetId: string;
  before: unknown;
  patch: Partial<SecuritySettings>;
  reason: string;
}) {
  const next = await updateSecuritySettings(input.patch);
  const after = (next as unknown as Record<string, unknown>)[input.targetId] ?? next;
  await recordSecurityAuditLog({
    request: input.request,
    adminUserId: input.adminId,
    action: `security_config.${input.section}`,
    targetType: "security_config",
    targetId: input.targetId,
    before: input.before,
    after,
    reason: input.reason,
  });
  return next;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  const section = String(formData.get("section") ?? "").trim();

  try {
    if (SECURITY_SECTIONS.has(section) || SECURITY_RESET_SECTIONS.has(section)) {
      const forbidden = await requireSecurityEditPermission(request, admin.id);
      if (forbidden) return forbidden;
    }

    if (SECURITY_RESET_SECTIONS.has(section)) {
      const current = (await getSystemSettings()).security;
      const defaults = getDefaultSecuritySettings();
      const resetSection = section.replace(/_reset$/, "");
      const resetMap: Record<string, { targetId: keyof SecuritySettings; patch: Partial<SecuritySettings>; message: string }> = {
        security: {
          targetId: "authRateLimits",
          patch: { authRateLimits: defaults.authRateLimits },
          message: "Đã reset cấu hình bảo mật đăng nhập về default an toàn.",
        },
        security_cleanup: {
          targetId: "authRateLimitCleanup",
          patch: { authRateLimitCleanup: defaults.authRateLimitCleanup },
          message: "Đã reset cleanup auth rate-limit về default an toàn.",
        },
        security_detection: {
          targetId: "detection",
          patch: { detection: defaults.detection },
          message: "Đã reset detection rules về default an toàn.",
        },
        security_headers: {
          targetId: "headers",
          patch: { headers: defaults.headers },
          message: "Đã reset security headers về default an toàn.",
        },
        upload_security: {
          targetId: "uploadSecurity",
          patch: { uploadSecurity: defaults.uploadSecurity },
          message: "Đã reset upload security về default an toàn.",
        },
        endpoint_protection: {
          targetId: "endpointProtection",
          patch: { endpointProtection: defaults.endpointProtection },
          message: "Đã reset endpoint protection về default an toàn.",
        },
      };
      const resetConfig = resetMap[resetSection];
      if (!resetConfig) {
        return respondError(request, {
          error: "invalid_section",
          message: "Section reset không hợp lệ.",
          location: ROUTES.ADMIN.CONFIG,
        });
      }

      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: resetConfig.targetId,
        before: current[resetConfig.targetId],
        patch: resetConfig.patch,
        reason: "Reset security config section to safe defaults",
      });

      return respondSuccess(request, { message: resetConfig.message });
    }

    if (section === "breadcrumb") {
      const breadcrumbInput: Partial<BreadcrumbSettings> = {};

      if (formData.has("enabled")) breadcrumbInput.enabled = isChecked(formData, "enabled");
      if (formData.has("showOnPage")) breadcrumbInput.showOnPage = isChecked(formData, "showOnPage");
      if (formData.has("includeStructuredData")) {
        breadcrumbInput.includeStructuredData = isChecked(formData, "includeStructuredData");
      }
      if (formData.has("homeLabel")) {
        breadcrumbInput.homeLabel = String(formData.get("homeLabel") ?? "").trim() || "Trang chủ";
      }
      if (formData.has("separator")) {
        breadcrumbInput.separator = String(formData.get("separator") ?? "").trim() || "/";
      }
      if (formData.has("adminEnabled")) breadcrumbInput.adminEnabled = isChecked(formData, "adminEnabled");
      if (formData.has("adminSeparator")) {
        breadcrumbInput.adminSeparator = String(formData.get("adminSeparator") ?? "").trim() || "/";
      }
      if (formData.has("customerEnabled")) breadcrumbInput.customerEnabled = isChecked(formData, "customerEnabled");
      if (formData.has("customerSeparator")) {
        breadcrumbInput.customerSeparator = String(formData.get("customerSeparator") ?? "").trim() || "/";
      }
      if (formData.has("providerEnabled")) breadcrumbInput.providerEnabled = isChecked(formData, "providerEnabled");
      if (formData.has("providerSeparator")) {
        breadcrumbInput.providerSeparator = String(formData.get("providerSeparator") ?? "").trim() || "/";
      }

      await updateBreadcrumbSettings(breadcrumbInput);

      return respondSuccess(request, { message: "Đã lưu cài đặt breadcrumb." });
    }

    if (section === "sitemap") {
      const sitemapInput: Partial<SitemapSettings> = {};

      if (formData.has("enabled")) sitemapInput.enabled = isChecked(formData, "enabled");
      if (formData.has("autoDiscovery")) sitemapInput.autoDiscovery = isChecked(formData, "autoDiscovery");
      if (formData.has("includeDiscoveredRoutes")) {
        sitemapInput.includeDiscoveredRoutes = isChecked(formData, "includeDiscoveredRoutes");
      }
      if (formData.has("includeManagedPages") || formData.has("includeCmsPages")) {
        sitemapInput.includeManagedPages =
          isChecked(formData, "includeManagedPages") || isChecked(formData, "includeCmsPages");
      }
      if (formData.has("includeBlogCategories")) {
        sitemapInput.includeBlogCategories = isChecked(formData, "includeBlogCategories");
      }
      if (formData.has("includeBlogPosts")) sitemapInput.includeBlogPosts = isChecked(formData, "includeBlogPosts");
      if (formData.has("includeOfferings")) sitemapInput.includeOfferings = isChecked(formData, "includeOfferings");
      if (formData.has("includePublicSites") || formData.has("includeInvitationSites")) {
        sitemapInput.includePublicSites =
          isChecked(formData, "includePublicSites") || isChecked(formData, "includeInvitationSites");
      }

      await updateSitemapSettings(sitemapInput);

      return respondSuccess(request, { message: "Đã lưu cài đặt sitemap." });
    }

    if (section === "indexing") {
      const indexingInput: Partial<IndexingSettings> = {};

      if (formData.has("siteIndexingEnabled")) {
        indexingInput.siteIndexingEnabled = isChecked(formData, "siteIndexingEnabled");
      }
      if (formData.has("includeSitemapInRobots")) {
        indexingInput.includeSitemapInRobots = isChecked(formData, "includeSitemapInRobots");
      }
      if (formData.has("disallowAdmin")) indexingInput.disallowAdmin = isChecked(formData, "disallowAdmin");
      if (formData.has("disallowUser")) indexingInput.disallowUser = isChecked(formData, "disallowUser");
      if (formData.has("disallowApi")) indexingInput.disallowApi = isChecked(formData, "disallowApi");
      if (formData.has("customRobotsRules")) {
        indexingInput.customRobotsRules = String(formData.get("customRobotsRules") ?? "");
      }

      await updateIndexingSettings(indexingInput);

      return respondSuccess(request, { message: "Đã lưu cài đặt indexing." });
    }

    if (section === "chat") {
      await updateBrandingSettings({
        chatTeamDisplayName: String(formData.get("chatTeamDisplayName") ?? "").trim() || "PinkLove",
        supportInboxUsernames: String(formData.get("supportInboxUsernames") ?? "").trim(),
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt chat." });
    }

    if (section === "branding") {
      await updateBrandingSettings({
        siteName: String(formData.get("siteName") ?? "").trim() || "PinkLove",
        siteSlogan: String(formData.get("siteSlogan") ?? "").trim(),
        brandLogo: String(formData.get("brandLogo") ?? "").trim(),
        siteFavicon: String(formData.get("siteFavicon") ?? "").trim(),
        appleTouchIcon: String(formData.get("appleTouchIcon") ?? "").trim(),
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt branding." });
    }

    if (section === "opengraph") {
      await updateOpenGraphSettings({
        locale: String(formData.get("locale") ?? "").trim() || "vi_VN",
        defaultTitle: String(formData.get("defaultTitle") ?? "").trim() || "PinkLove",
        defaultDescription:
          String(formData.get("defaultDescription") ?? "").trim() ||
          "Thiệp cưới online, blog cưới, công cụ cưới và builder tạo thiệp tối ưu cho trải nghiệm chia sẻ.",
        defaultImage: String(formData.get("defaultImage") ?? "").trim(),
        twitterCard: formData.get("twitterCard") === "summary" ? "summary" : "summary_large_image",
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt Open Graph." });
    }

    if (section === "favicon") {
      await updateFaviconSettings({
        siteFavicon: String(formData.get("siteFavicon") ?? "").trim(),
        appleTouchIcon: String(formData.get("appleTouchIcon") ?? "").trim(),
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt favicon." });
    }

    if (section === "ecommerce") {
      await updateEcommerceSettings({
        enabled: isChecked(formData, "enabled"),
        enableVatInvoiceRequest: isChecked(formData, "enableVatInvoiceRequest"),
        supportShipping: isChecked(formData, "supportShipping"),
        currency: String(formData.get("currency") ?? "VND").trim() || "VND",
        currencySymbol: String(formData.get("currencySymbol") ?? "₫").trim() || "₫",
        thousandSeparator: formData.get("thousandSeparator") === "," ? "," : ".",
        decimalSeparator: formData.get("decimalSeparator") === "." ? "." : ",",
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt ecommerce." });
    }

    if (section === "shipping_accounts") {
      const codes = getIndexedValues(formData, "shippingAccountCode");
      const providers = getIndexedValues(formData, "shippingAccountProvider");
      const labels = getIndexedValues(formData, "shippingAccountLabel");
      const shopIds = getIndexedValues(formData, "shippingAccountShopId");
      const tokens = getIndexedValues(formData, "shippingAccountToken");
      const pickupAddressIds = getIndexedValues(formData, "shippingAccountPickupAddressId");
      const flatShippingFees = getIndexedValues(formData, "shippingAccountFlatShippingFee");
      const freeShippingThresholds = getIndexedValues(formData, "shippingAccountFreeShippingThreshold");
      const maxLength = Math.max(
        codes.length,
        providers.length,
        labels.length,
        shopIds.length,
        tokens.length,
        pickupAddressIds.length,
        flatShippingFees.length,
        freeShippingThresholds.length
      );
      const shippingAccounts: ShippingAccountSettings[] = [];

      for (let index = 0; index < maxLength; index += 1) {
        if (isChecked(formData, `shippingAccountRemove_${index}`)) {
          continue;
        }

        const provider = (providers[index] ?? "").trim();
        const accountLabel = (labels[index] ?? "").trim();
        const shopId = (shopIds[index] ?? "").trim();
        const token = tokens[index] ?? "";
        const pickupAddressId = (pickupAddressIds[index] ?? "").trim();
        const flatShippingFee = Number(flatShippingFees[index] ?? "30000");
        const freeShippingThreshold = Number(freeShippingThresholds[index] ?? "1500000");
        const code = ((codes[index] ?? provider) || `carrier_${index + 1}`)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, "_")
          .replace(/^_+|_+$/g, "");

        if (!provider && !accountLabel && !shopId && !token && !pickupAddressId) {
          continue;
        }

        shippingAccounts.push({
          code: code || `carrier_${index + 1}`,
          enabled: isChecked(formData, `shippingAccountEnabled_${index}`),
          provider,
          accountLabel,
          shopId,
          token,
          pickupAddressId,
          flatShippingFee,
          freeShippingThreshold,
        });
      }

      await updateEcommerceSettings({
        shippingAccount: shippingAccounts[0],
        shippingAccounts,
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình shipping." });
    }

    if (section === "email") {
      await updateEmailSettings({
        enabled: isChecked(formData, "enabled"),
        transport: formData.get("transport") === "smtp" ? "smtp" : "log",
        fromName: String(formData.get("fromName") ?? "").trim() || "PinkLove",
        fromEmail: String(formData.get("fromEmail") ?? "").trim(),
        replyTo: String(formData.get("replyTo") ?? "").trim(),
        smtpHost: String(formData.get("smtpHost") ?? "").trim(),
        smtpPort: Number(formData.get("smtpPort") ?? "587"),
        smtpSecure: isChecked(formData, "smtpSecure"),
        smtpUsername: String(formData.get("smtpUsername") ?? "").trim(),
        smtpPassword: String(formData.get("smtpPassword") ?? ""),
        demoRecipient: String(formData.get("demoRecipient") ?? "").trim(),
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình email." });
    }

    if (section === "third_party") {
      await updateThirdPartySettings({
        googleOAuth: {
          enabled: isChecked(formData, "googleOAuthEnabled"),
          clientId: String(formData.get("googleClientId") ?? "").trim(),
          clientSecret: String(formData.get("googleClientSecret") ?? ""),
          redirectUri: String(formData.get("googleRedirectUri") ?? "").trim(),
        },
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình bên thứ 3." });
    }

    if (section === "security") {
      const current = (await getSystemSettings()).security;
      const securityInput: Partial<SecuritySettings> = {
        authRateLimits: {
          publicLoginIp: {
            limit: parsePositiveInt(formData, "publicLoginIpLimit", 120),
            windowMinutes: parsePositiveInt(formData, "publicLoginIpWindowMinutes", 15),
          },
          publicLoginEmail: {
            limit: parsePositiveInt(formData, "publicLoginEmailLimit", 10),
            windowMinutes: parsePositiveInt(formData, "publicLoginEmailWindowMinutes", 15),
          },
          adminLoginIp: {
            limit: parsePositiveInt(formData, "adminLoginIpLimit", 30),
            windowMinutes: parsePositiveInt(formData, "adminLoginIpWindowMinutes", 15),
          },
          adminLoginEmail: {
            limit: parsePositiveInt(formData, "adminLoginEmailLimit", 5),
            windowMinutes: parsePositiveInt(formData, "adminLoginEmailWindowMinutes", 15),
          },
          providerLoginIp: {
            limit: parsePositiveInt(formData, "providerLoginIpLimit", 60),
            windowMinutes: parsePositiveInt(formData, "providerLoginIpWindowMinutes", 15),
          },
          providerLoginEmail: {
            limit: parsePositiveInt(formData, "providerLoginEmailLimit", 6),
            windowMinutes: parsePositiveInt(formData, "providerLoginEmailWindowMinutes", 15),
          },
        },
      };

      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: "authRateLimits",
        before: current.authRateLimits,
        patch: securityInput,
        reason: "Update auth rate-limit settings",
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình bảo mật đăng nhập." });
    }

    if (section === "security_cleanup") {
      const current = (await getSystemSettings()).security;
      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: "authRateLimitCleanup",
        before: current.authRateLimitCleanup,
        patch: {
        authRateLimitCleanup: {
          enabled: isChecked(formData, "authRateLimitCleanupEnabled"),
          retentionDays: parsePositiveInt(formData, "authRateLimitCleanupRetentionDays", 7),
        } as SecuritySettings["authRateLimitCleanup"],
        },
        reason: "Update auth rate-limit cleanup settings",
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình cleanup auth rate-limit." });
    }

    if (section === "security_detection") {
      const current = (await getSystemSettings()).security;
      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: "detection",
        before: current.detection,
        patch: {
        detection: {
          enabled: isChecked(formData, "detectionEnabled"),
          dryRun: isChecked(formData, "detectionDryRun"),
          autoBlock: isChecked(formData, "detectionAutoBlock"),
          requestWindowMinutes: parsePositiveInt(formData, "requestWindowMinutes", 1),
          requestWarnLimit: parsePositiveInt(formData, "requestWarnLimit", 120),
          requestSuspiciousLimit: parsePositiveInt(formData, "requestSuspiciousLimit", 240),
          requestBlockLimit: parsePositiveInt(formData, "requestBlockLimit", 600),
          statusWindowMinutes: parsePositiveInt(formData, "statusWindowMinutes", 1),
          statusWarnLimit: parsePositiveInt(formData, "statusWarnLimit", 30),
          statusSuspiciousLimit: parsePositiveInt(formData, "statusSuspiciousLimit", 80),
          statusBlockLimit: parsePositiveInt(formData, "statusBlockLimit", 200),
          loginFailWindowMinutes: parsePositiveInt(formData, "loginFailWindowMinutes", 15),
          loginFailWarnLimit: parsePositiveInt(formData, "loginFailWarnLimit", 10),
          loginFailSuspiciousLimit: parsePositiveInt(formData, "loginFailSuspiciousLimit", 25),
          loginFailBlockLimit: parsePositiveInt(formData, "loginFailBlockLimit", 60),
          registerFailWindowMinutes: parsePositiveInt(formData, "registerFailWindowMinutes", 60),
          registerFailWarnLimit: parsePositiveInt(formData, "registerFailWarnLimit", 8),
          registerFailSuspiciousLimit: parsePositiveInt(formData, "registerFailSuspiciousLimit", 20),
          registerFailBlockLimit: parsePositiveInt(formData, "registerFailBlockLimit", 50),
          scanPathWindowMinutes: parsePositiveInt(formData, "scanPathWindowMinutes", 5),
          scanPathWarnLimit: parsePositiveInt(formData, "scanPathWarnLimit", 12),
          scanPathSuspiciousLimit: parsePositiveInt(formData, "scanPathSuspiciousLimit", 30),
          scanPathBlockLimit: parsePositiveInt(formData, "scanPathBlockLimit", 80),
          blockDurationMinutes: parsePositiveInt(formData, "blockDurationMinutes", 15),
          whitelistIps: String(formData.get("whitelistIps") ?? "").trim(),
        } as SecuritySettings["detection"],
        },
        reason: "Update IP detection settings",
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình phát hiện IP bất thường." });
    }

    if (section === "security_headers") {
      const validationError = validateSecurityHeaderInput(formData);
      if (validationError) {
        return respondError(request, {
          status: 400,
          error: "invalid_security_headers",
          message: validationError,
          location: ROUTES.ADMIN.SECURITY_SETTINGS,
        });
      }
      const current = (await getSystemSettings()).security;
      const securityInput: Partial<SecuritySettings> = {
        headers: {
          enabled: isChecked(formData, "headersEnabled"),
          contentSecurityPolicy: {
            enabled: isChecked(formData, "cspEnabled"),
            reportOnly: isChecked(formData, "cspReportOnly"),
            defaultSrc: String(formData.get("cspDefaultSrc") ?? "").trim(),
            scriptSrc: String(formData.get("cspScriptSrc") ?? "").trim(),
            styleSrc: String(formData.get("cspStyleSrc") ?? "").trim(),
            imgSrc: String(formData.get("cspImgSrc") ?? "").trim(),
            connectSrc: String(formData.get("cspConnectSrc") ?? "").trim(),
            fontSrc: String(formData.get("cspFontSrc") ?? "").trim(),
            frameSrc: String(formData.get("cspFrameSrc") ?? "").trim(),
            frameAncestors: String(formData.get("cspFrameAncestors") ?? "").trim(),
          },
          strictTransportSecurity: {
            enabled: isChecked(formData, "hstsEnabled"),
            maxAge: parsePositiveInt(formData, "hstsMaxAge", 31536000),
            includeSubDomains: isChecked(formData, "hstsIncludeSubDomains"),
            preload: isChecked(formData, "hstsPreload"),
          },
          xFrameOptions: {
            enabled: isChecked(formData, "xFrameOptionsEnabled"),
            value: formData.get("xFrameOptionsValue") === "SAMEORIGIN" ? "SAMEORIGIN" : "DENY",
          },
          xContentTypeOptions: isChecked(formData, "xContentTypeOptions"),
          referrerPolicy: {
            enabled: isChecked(formData, "referrerPolicyEnabled"),
            value: String(formData.get("referrerPolicyValue") ?? "").trim(),
          },
          permissionsPolicy: {
            enabled: isChecked(formData, "permissionsPolicyEnabled"),
            value: String(formData.get("permissionsPolicyValue") ?? "").trim(),
          },
        },
      };

      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: "headers",
        before: current.headers,
        patch: securityInput,
        reason: "Update security headers settings",
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình security headers." });
    }

    if (section === "upload_security") {
      const current = (await getSystemSettings()).security;
      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: "uploadSecurity",
        before: current.uploadSecurity,
        patch: {
        uploadSecurity: {
          enabled: isChecked(formData, "uploadSecurityEnabled"),
          allowedMimeTypes: String(formData.get("allowedMimeTypes") ?? "").trim(),
          maxFileSizeMb: parsePositiveInt(formData, "maxFileSizeMb", 20),
          maxFilesPerUpload: parsePositiveInt(formData, "maxFilesPerUpload", 10),
          maxTotalUploadSizeMb: parsePositiveInt(formData, "maxTotalUploadSizeMb", 50),
          blockSvg: isChecked(formData, "blockSvg"),
          blockHtml: isChecked(formData, "blockHtml"),
          requireMagicBytes: isChecked(formData, "requireMagicBytes"),
        } as SecuritySettings["uploadSecurity"],
        },
        reason: "Update upload security settings",
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình upload security." });
    }

    if (section === "endpoint_protection") {
      const current = (await getSystemSettings()).security;
      await updateSecuritySettingsWithAudit({
        request,
        adminId: admin.id,
        section,
        targetId: "endpointProtection",
        before: current.endpointProtection,
        patch: {
        endpointProtection: {
          enabled: isChecked(formData, "endpointProtectionEnabled"),
          dryRun: isChecked(formData, "endpointProtectionDryRun"),
          rateLimitEnabled: isChecked(formData, "endpointRateLimitEnabled"),
          windowMinutes: parsePositiveInt(formData, "endpointWindowMinutes", 1),
          warnLimit: parsePositiveInt(formData, "endpointWarnLimit", 90),
          blockLimit: parsePositiveInt(formData, "endpointBlockLimit", 240),
          blockDurationMinutes: parsePositiveInt(formData, "endpointBlockDurationMinutes", 10),
          maxPageSize: parsePositiveInt(formData, "endpointMaxPageSize", 100),
          maxSearchResultsPerGroup: parsePositiveInt(formData, "endpointMaxSearchResultsPerGroup", 40),
          slowThresholdMs: parsePositiveInt(formData, "endpointSlowThresholdMs", 1500),
          searchCacheTtlSeconds: parsePositiveInt(formData, "searchCacheTtlSeconds", 60),
          publicDataCacheTtlSeconds: parsePositiveInt(formData, "publicDataCacheTtlSeconds", 300),
          whitelistIps: String(formData.get("endpointWhitelistIps") ?? "").trim(),
          bypassUserIds: String(formData.get("endpointBypassUserIds") ?? "").trim(),
        } as SecuritySettings["endpointProtection"],
        },
        reason: "Update endpoint protection settings",
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình endpoint protection." });
    }

    if (section === "internal_api_offerings") {
      await updateInternalOfferingImportApiSettings({
        enabled: isChecked(formData, "enabled"),
        token: String(formData.get("token") ?? "").trim(),
        defaultStatus: formData.get("defaultStatus") === "published" ? "published" : "draft",
        allowedOfferingTypes: ["physical_product"],
      });

      return respondSuccess(request, { message: "Đã lưu cấu hình API import sản phẩm." });
    }

    return respondError(request, {
      error: "invalid_section",
      message: "Section settings không hợp lệ.",
      location: ROUTES.ADMIN.CONFIG,
    });
  } catch (error) {
    console.error("Failed to update admin settings:", error);
    return respondError(request, {
      error: "update_failed",
      message: "Không thể lưu cài đặt hệ thống.",
      location: ROUTES.ADMIN.CONFIG,
    });
  }
}
