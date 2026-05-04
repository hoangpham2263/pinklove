import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings, updateEcommerceSettings, type ShippingAccountSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

function normalizeCode(value: string, fallback: string) {
  return (value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  const settings = await getSystemSettings();
  const accounts = [...settings.ecommerce.shippingAccounts];
  const intent = String(formData.get("intent") ?? "").trim();

  if (intent === "toggle-enabled") {
    const code = String(formData.get("code") ?? "").trim();
    const enabled = formData.get("enabled") === "on";
    const nextAccounts = accounts.map((account) => (account.code === code ? { ...account, enabled } : account));
    await updateEcommerceSettings({
      shippingAccount: nextAccounts[0],
      shippingAccounts: nextAccounts,
    });
    return respondSuccess(request, { location: ROUTES.ADMIN.CONFIG_SHIPPING });
  }

  const originalCode = String(formData.get("originalCode") ?? "").trim();
  const provider = String(formData.get("provider") ?? "").trim();
  const code = normalizeCode(String(formData.get("code") ?? ""), provider || "shipping");

  if (!code || !provider) {
    return respondError(request, {
      error: "invalid_shipping",
      message: "Vui lòng nhập mã nội bộ và đơn vị vận chuyển.",
      location: originalCode ? ROUTES.ADMIN.CONFIG_SHIPPING_CONNECTION(originalCode) : ROUTES.ADMIN.CONFIG_SHIPPING_NEW,
    });
  }

  const nextAccount: ShippingAccountSettings = {
    code,
    enabled: formData.get("enabled") === "on",
    provider,
    accountLabel: String(formData.get("accountLabel") ?? "").trim(),
    shopId: String(formData.get("shopId") ?? "").trim(),
    token: String(formData.get("token") ?? ""),
    pickupAddressId: String(formData.get("pickupAddressId") ?? "").trim(),
    flatShippingFee: Number(formData.get("flatShippingFee") ?? "30000"),
    freeShippingThreshold: Number(formData.get("freeShippingThreshold") ?? "1500000"),
  };

  const filteredAccounts = accounts.filter((account) => account.code !== originalCode && account.code !== code);
  const nextAccounts = [...filteredAccounts, nextAccount];
  await updateEcommerceSettings({
    shippingAccount: nextAccounts[0],
    shippingAccounts: nextAccounts,
  });

  return respondSuccess(request, { location: ROUTES.ADMIN.CONFIG_SHIPPING });
}
