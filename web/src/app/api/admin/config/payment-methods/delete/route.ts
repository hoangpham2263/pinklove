import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { query } from "@/lib/database";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings, updateEcommerceSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, {
      status: 401,
      error: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập admin.",
      location: ROUTES.ADMIN.LOGIN,
    });
  }

  const formData = await request.formData();
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return respondError(request, {
      error: "missing_payment_method",
      message: "Thiếu phương thức thanh toán cần xóa.",
      location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
    });
  }

  const settings = await getSystemSettings();
  const currentMethods = settings.ecommerce.paymentMethods;
  const method = currentMethods.find((item) => item.code === code);

  if (!method) {
    return respondError(request, {
      status: 404,
      error: "payment_method_not_found",
      message: "Không tìm thấy phương thức thanh toán để xóa.",
      location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
    });
  }

  const usage = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM commerce_payments WHERE method = $1", [code]);
  const usageCount = Number(usage.rows[0]?.count ?? 0);

  if (usageCount > 0) {
    return respondError(request, {
      error: "payment_method_in_use",
      message: `Phương thức "${method.label}" đã có ${usageCount} payment sử dụng. Hãy tắt phương thức này thay vì xóa để giữ lịch sử đơn hàng.`,
      location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
    });
  }

  const paymentMethods = currentMethods.filter((item) => item.code !== code);

  await updateEcommerceSettings({
    paymentMethods,
    allowBankTransfer: paymentMethods.some((item) => item.code === "bank_transfer" && item.enabled),
    allowCod: paymentMethods.some((item) => item.code === "cod" && item.enabled),
  });

  return respondSuccess(request, {
    message: "Đã xóa phương thức thanh toán.",
    location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
  });
}
