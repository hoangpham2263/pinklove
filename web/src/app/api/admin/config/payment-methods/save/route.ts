import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import {
  getSystemSettings,
  updateEcommerceSettings,
  type EcommercePaymentMethodSettings,
} from "@/lib/system-settings";

export const runtime = "nodejs";

function parsePaymentMethodType(value: FormDataEntryValue | null): EcommercePaymentMethodSettings["type"] {
  const normalized = String(value ?? "").trim();
  if (normalized === "mock" || normalized === "offline" || normalized === "redirect" || normalized === "embedded") {
    return normalized;
  }
  return "manual";
}

function parseRequiresShipping(value: FormDataEntryValue | null) {
  if (value === "shipping") return true;
  if (value === "no_shipping") return false;
  return null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  const originalCode = String(formData.get("originalCode") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();

  if (!code || !label) {
    return respondError(request, {
      error: "invalid_payment_method",
      message: "Code và tên hiển thị là bắt buộc.",
      location: originalCode ? ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(originalCode) : ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW,
    });
  }

  const settings = await getSystemSettings();
  const currentMethods = settings.ecommerce.paymentMethods;
  const duplicate = currentMethods.some((method) => method.code === code && method.code !== originalCode);

  if (duplicate) {
    return respondError(request, {
      error: "duplicate_payment_method",
      message: "Code phương thức thanh toán đã tồn tại.",
      location: originalCode ? ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(originalCode) : ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW,
    });
  }

  const nextMethod: EcommercePaymentMethodSettings = {
    code,
    label,
    description: String(formData.get("description") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    enabled: formData.get("enabled") === "on",
    provider: String(formData.get("provider") ?? "").trim() || code,
    type: parsePaymentMethodType(formData.get("type")),
    requiresShipping: parseRequiresShipping(formData.get("requiresShipping")),
    bankName: String(formData.get("bankName") ?? "").trim(),
    bankQrBankId: String(formData.get("bankQrBankId") ?? "").trim(),
    bankAccountNumber: String(formData.get("bankAccountNumber") ?? "").trim(),
    bankAccountName: String(formData.get("bankAccountName") ?? "").trim(),
  };

  const existingIndex = originalCode ? currentMethods.findIndex((method) => method.code === originalCode) : -1;
  const paymentMethods =
    existingIndex >= 0
      ? currentMethods.map((method, index) => (index === existingIndex ? nextMethod : method))
      : [...currentMethods, nextMethod];

  await updateEcommerceSettings({
    paymentMethods,
    allowBankTransfer: paymentMethods.some((method) => method.code === "bank_transfer" && method.enabled),
    allowCod: paymentMethods.some((method) => method.code === "cod" && method.enabled),
  });

  return respondSuccess(request, {
    message: "Đã lưu phương thức thanh toán.",
    location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
  });
}
