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
} from "@/lib/system-settings";

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
      await updateBreadcrumbSettings({
        enabled: isChecked(formData, "enabled"),
        showOnPage: isChecked(formData, "showOnPage"),
        includeStructuredData: isChecked(formData, "includeStructuredData"),
        homeLabel: String(formData.get("homeLabel") ?? "").trim() || "Trang chủ",
        separator: String(formData.get("separator") ?? "").trim() || "/",
      });

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

    if (section === "branding") {
      await updateBrandingSettings({
        siteName: String(formData.get("siteName") ?? "").trim() || "PinkLove",
        brandLogo: String(formData.get("brandLogo") ?? "").trim(),
        chatTeamDisplayName: String(formData.get("chatTeamDisplayName") ?? "").trim() || "PinkLove",
        supportInboxUsernames: String(formData.get("supportInboxUsernames") ?? "").trim(),
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

    if (section === "internal_api_products") {
      const allowedProductTypes = formData
        .getAll("allowedProductTypes")
        .map((value) => String(value))
        .filter(
          (value): value is "coded_template" | "builder_template" | "general_product" =>
            value === "coded_template" || value === "builder_template" || value === "general_product"
        );

      await updateInternalProductImportApiSettings({
        enabled: isChecked(formData, "enabled"),
        token: String(formData.get("token") ?? "").trim(),
        defaultStatus: formData.get("defaultStatus") === "published" ? "published" : "draft",
        allowedProductTypes: allowedProductTypes.length > 0 ? allowedProductTypes : ["general_product"],
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
