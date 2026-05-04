import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings, updateEcommerceSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return respondError(request, {
      error: "invalid_shipping",
      message: "Thiếu mã kết nối vận chuyển.",
      location: ROUTES.ADMIN.CONFIG_SHIPPING,
    });
  }

  const settings = await getSystemSettings();
  const nextAccounts = settings.ecommerce.shippingAccounts.filter((account) => account.code !== code);

  await updateEcommerceSettings({
    shippingAccount: nextAccounts[0],
    shippingAccounts: nextAccounts,
  });

  return respondSuccess(request, { location: ROUTES.ADMIN.CONFIG_SHIPPING });
}
