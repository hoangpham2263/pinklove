import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import {
  updateBrandingSettings,
  updateIndexingSettings,
  updateBreadcrumbSettings,
  updateEcommerceSettings,
  updateFaviconSettings,
  updateEmailSettings,
  updateInternalProductImportApiSettings,
  updateOpenGraphSettings,
  updateSitemapSettings,
  updateThirdPartySettings,
} from "@/lib/system-settings";
import type { BreadcrumbSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  const section = String(formData.get("section") ?? "").trim();

  try {
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
      if (formData.has("partnerEnabled")) breadcrumbInput.partnerEnabled = isChecked(formData, "partnerEnabled");
      if (formData.has("partnerSeparator")) {
        breadcrumbInput.partnerSeparator = String(formData.get("partnerSeparator") ?? "").trim() || "/";
      }

      await updateBreadcrumbSettings(breadcrumbInput);

      return respondSuccess(request, { message: "Đã lưu cài đặt breadcrumb." });
    }

    if (section === "sitemap") {
      await updateSitemapSettings({
        enabled: isChecked(formData, "enabled"),
        autoDiscovery: isChecked(formData, "autoDiscovery"),
        includeDiscoveredRoutes: isChecked(formData, "includeDiscoveredRoutes"),
        includeManagedPages:
          isChecked(formData, "includeManagedPages") || isChecked(formData, "includeCmsPages"),
        includeBlogCategories: isChecked(formData, "includeBlogCategories"),
        includeBlogPosts: isChecked(formData, "includeBlogPosts"),
        includeProducts: isChecked(formData, "includeProducts"),
        includePublicSites:
          isChecked(formData, "includePublicSites") || isChecked(formData, "includeInvitationSites"),
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt sitemap." });
    }

    if (section === "indexing") {
      await updateIndexingSettings({
        siteIndexingEnabled: isChecked(formData, "siteIndexingEnabled"),
        includeSitemapInRobots: isChecked(formData, "includeSitemapInRobots"),
        disallowAdmin: isChecked(formData, "disallowAdmin"),
        disallowUser: isChecked(formData, "disallowUser"),
        disallowApi: isChecked(formData, "disallowApi"),
        customRobotsRules: String(formData.get("customRobotsRules") ?? ""),
      });

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
        autoApproveMockPayments: isChecked(formData, "autoApproveMockPayments"),
        supportShipping: isChecked(formData, "supportShipping"),
        flatShippingFee: Number(formData.get("flatShippingFee") ?? "30000"),
        freeShippingThreshold: Number(formData.get("freeShippingThreshold") ?? "1500000"),
        currency: String(formData.get("currency") ?? "VND").trim() || "VND",
        currencySymbol: String(formData.get("currencySymbol") ?? "₫").trim() || "₫",
        thousandSeparator: formData.get("thousandSeparator") === "," ? "," : ".",
        decimalSeparator: formData.get("decimalSeparator") === "." ? "." : ",",
        shippingAccount: {
          enabled: isChecked(formData, "shippingAccountEnabled"),
          provider: String(formData.get("shippingAccountProvider") ?? "").trim(),
          accountLabel: String(formData.get("shippingAccountLabel") ?? "").trim(),
          shopId: String(formData.get("shippingAccountShopId") ?? "").trim(),
          token: String(formData.get("shippingAccountToken") ?? ""),
          pickupAddressId: String(formData.get("shippingAccountPickupAddressId") ?? "").trim(),
        },
      });

      return respondSuccess(request, { message: "Đã lưu cài đặt ecommerce." });
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

    if (section === "internal_api_products") {
      await updateInternalProductImportApiSettings({
        enabled: isChecked(formData, "enabled"),
        token: String(formData.get("token") ?? "").trim(),
        defaultStatus: formData.get("defaultStatus") === "published" ? "published" : "draft",
        allowedProductTypes: ["general_product"],
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
