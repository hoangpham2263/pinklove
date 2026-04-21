import type { PaymentMethod } from "@/features/ecommerce/types";
import type { EcommercePaymentMethodSettings, EcommerceSettings } from "@/lib/system-settings";

export function getPaymentMethodConfig(
  settings: EcommerceSettings,
  method: PaymentMethod
): EcommercePaymentMethodSettings | null {
  return settings.paymentMethods.find((item) => item.code === method) ?? null;
}

export function getEnabledPaymentMethods(settings: EcommerceSettings, requiresShipping: boolean = false) {
  return settings.paymentMethods.filter((item) => {
    if (!item.enabled) return false;
    if (item.requiresShipping === true && !requiresShipping) return false;
    if (item.requiresShipping === false && requiresShipping) return false;
    return true;
  });
}

export function getPaymentMethodLabel(method: PaymentMethod, settings?: EcommerceSettings) {
  const configured = settings ? getPaymentMethodConfig(settings, method) : null;
  if (configured?.label) {
    return configured.label;
  }
  switch (method) {
    case "bank_transfer":
      return "Chuyển khoản QR";
    case "cod":
      return "Thanh toán tiền mặt";
    case "mock_online":
    default:
      return "Thanh toán online mô phỏng";
  }
}

export function getPaymentMethodDescription(
  method: PaymentMethod,
  requiresShipping: boolean = false,
  settings?: EcommerceSettings
) {
  const configured = settings ? getPaymentMethodConfig(settings, method) : null;
  if (configured?.description) {
    return configured.description;
  }
  switch (method) {
    case "bank_transfer":
      return "Quét mã QR hoặc chuyển khoản thủ công rồi gửi đúng nội dung đơn hàng để hệ thống đối soát nhanh hơn.";
    case "cod":
      return requiresShipping
        ? "Thanh toán tiền mặt khi nhận hàng hoặc khi nhân sự PinkLove bàn giao trực tiếp."
        : "Thanh toán tiền mặt trực tiếp tại studio hoặc khi đội ngũ PinkLove xác nhận đơn.";
    case "mock_online":
    default:
      return "Phục vụ dev/test, tự động chuyển đơn sang trạng thái đã thanh toán nếu cấu hình cho phép.";
  }
}

export function getBankTransferQrUrl(input: {
  settings: EcommerceSettings;
  method?: EcommercePaymentMethodSettings | null;
  amount?: number;
  addInfo?: string;
}) {
  const bankId = (input.method?.bankQrBankId || input.settings.bankQrBankId).trim();
  const accountNumber = (input.method?.bankAccountNumber || input.settings.bankAccountNumber).trim();

  if (!bankId || !accountNumber) {
    return null;
  }

  const params = new URLSearchParams();
  if (input.amount && input.amount > 0) {
    params.set("amount", String(Math.round(input.amount)));
  }
  if (input.addInfo?.trim()) {
    params.set("addInfo", input.addInfo.trim());
  }
  const accountName = (input.method?.bankAccountName || input.settings.bankAccountName).trim();
  if (accountName) {
    params.set("accountName", accountName);
  }

  const query = params.toString();
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png${query ? `?${query}` : ""}`;
}
