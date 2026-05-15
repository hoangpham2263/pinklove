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

function parsePaymentMethodCategory(value: FormDataEntryValue | null): EcommercePaymentMethodSettings["category"] {
  const normalized = String(value ?? "").trim();
  if (normalized === "offline" || normalized === "gateway") {
    return normalized;
  }
  return "manual";
}

function parseRequiresShipping(value: FormDataEntryValue | null) {
  if (value === "shipping") return true;
  if (value === "no_shipping") return false;
  return null;
}

export async function savePaymentMethodEnabledState(request: Request, formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!code) {
    return respondError(request, {
      error: "missing_payment_method",
      message: "Thiếu phương thức thanh toán cần cập nhật.",
      location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
    });
  }

  const settings = await getSystemSettings();
  const currentMethods = settings.ecommerce.paymentMethods;
  const exists = currentMethods.some((method) => method.code === code);

  if (!exists) {
    return respondError(request, {
      status: 404,
      error: "payment_method_not_found",
      message: "Không tìm thấy phương thức thanh toán.",
      location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
    });
  }

  const paymentMethods = currentMethods.map((method) =>
    method.code === code ? { ...method, enabled } : method
  );

  await updateEcommerceSettings({
    paymentMethods,
    allowBankTransfer: paymentMethods.some((method) => method.code === "bank_transfer" && method.enabled),
    allowCod: paymentMethods.some((method) => method.code === "cod" && method.enabled),
  });

  return respondSuccess(request, {
    message: enabled ? "Đã bật phương thức thanh toán." : "Đã tắt phương thức thanh toán.",
    location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, { status: 401, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập admin.", location: ROUTES.ADMIN.LOGIN });
  }

  const formData = await request.formData();
  if (formData.get("intent") === "toggle-enabled") {
    return savePaymentMethodEnabledState(request, formData);
  }

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
  const existingMethod = originalCode ? currentMethods.find((method) => method.code === originalCode) ?? null : null;
  const duplicate = currentMethods.some((method) => method.code === code && method.code !== originalCode);

  if (duplicate) {
    return respondError(request, {
      error: "duplicate_payment_method",
      message: "Code phương thức thanh toán đã tồn tại.",
      location: originalCode ? ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(originalCode) : ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW,
    });
  }

  const nextCategory = parsePaymentMethodCategory(formData.get("category"));
  if (nextCategory === "gateway" && existingMethod?.category !== "gateway") {
    return respondError(request, {
      error: "gateway_methods_are_code_managed",
      message: "Cổng thanh toán trực tuyến cần tích hợp API trong code trước, không tạo mới từ admin.",
      location: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
    });
  }

  const nextMethod: EcommercePaymentMethodSettings = {
    code,
    label,
    description: String(formData.get("description") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
    enabled: formData.get("enabled") === "on",
    category: nextCategory,
    provider: String(formData.get("provider") ?? "").trim() || code,
    type: parsePaymentMethodType(formData.get("type")),
    requiresShipping: parseRequiresShipping(formData.get("requiresShipping")),
    bankName: String(formData.get("bankName") ?? "").trim(),
    bankQrBankId: String(formData.get("bankQrBankId") ?? "").trim(),
    bankAccountNumber: String(formData.get("bankAccountNumber") ?? "").trim(),
    bankAccountName: String(formData.get("bankAccountName") ?? "").trim(),
    pay2sEndpoint: String(formData.get("pay2sEndpoint") ?? "").trim(),
    pay2sPartnerCode: String(formData.get("pay2sPartnerCode") ?? "").trim(),
    pay2sAccessKey: String(formData.get("pay2sAccessKey") ?? "").trim(),
    pay2sSecretKey: String(formData.get("pay2sSecretKey") ?? ""),
    vnpayPaymentUrl: String(formData.get("vnpayPaymentUrl") ?? "").trim(),
    vnpayTmnCode: String(formData.get("vnpayTmnCode") ?? "").trim(),
    vnpayHashSecret: String(formData.get("vnpayHashSecret") ?? ""),
  };

  const existingIndex = existingMethod ? currentMethods.findIndex((method) => method.code === existingMethod.code) : -1;
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
