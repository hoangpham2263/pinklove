import { getBankTransferQrUrl, getPaymentMethodConfig, getPaymentMethodDescription, getPaymentMethodLabel } from "@/lib/payment-methods";
import type { PaymentMethod } from "@/features/ecommerce/types";
import type { EcommerceSettings } from "@/lib/system-settings";

type PaymentMethodGuideProps = {
  method: PaymentMethod;
  settings: EcommerceSettings;
  amount?: number;
  orderNumber?: string;
  requiresShipping?: boolean;
  className?: string;
};

export function PaymentMethodGuide({
  method,
  settings,
  amount,
  orderNumber,
  requiresShipping = false,
  className = "",
}: PaymentMethodGuideProps) {
  const configuredMethod = getPaymentMethodConfig(settings, method);

  if (method === "bank_transfer") {
    const qrUrl = getBankTransferQrUrl({
      settings,
      method: configuredMethod,
      amount,
      addInfo: orderNumber ? `Thanh toan ${orderNumber}` : undefined,
    });
    const bankName = configuredMethod?.bankName || settings.bankName;
    const bankAccountNumber = configuredMethod?.bankAccountNumber || settings.bankAccountNumber;
    const bankAccountName = configuredMethod?.bankAccountName || settings.bankAccountName;

    return (
      <div className={`rounded-xl border bg-muted/20 p-4 ${className}`.trim()}>
        <p className="text-sm font-semibold">{getPaymentMethodLabel(method, settings)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{getPaymentMethodDescription(method, requiresShipping, settings)}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-foreground">Ngân hàng:</span> {bankName || "Chưa cấu hình"}</p>
            <p><span className="font-medium text-foreground">Số tài khoản:</span> {bankAccountNumber || "Chưa cấu hình"}</p>
            <p><span className="font-medium text-foreground">Chủ tài khoản:</span> {bankAccountName || "Chưa cấu hình"}</p>
            {orderNumber ? (
              <p><span className="font-medium text-foreground">Nội dung chuyển khoản:</span> Thanh toan {orderNumber}</p>
            ) : null}
            <p className="text-muted-foreground">{configuredMethod?.instructions || settings.bankTransferInstructions}</p>
          </div>
          {qrUrl ? (
            <div className="overflow-hidden rounded-lg border bg-white p-3">
              <img
                src={qrUrl}
                alt="QR chuyển khoản"
                className="h-auto w-full rounded-md object-contain"
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const instructions =
    configuredMethod?.instructions ||
    (method === "cod" ? settings.cashPaymentInstructions : "Đơn hàng sẽ được giữ ở trạng thái chờ thanh toán để đội ngũ xác nhận hoặc chuyển sang cổng thanh toán tương ứng.");

  return (
    <div className={`rounded-xl border bg-muted/20 p-4 ${className}`.trim()}>
      <p className="text-sm font-semibold">{getPaymentMethodLabel(method, settings)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{getPaymentMethodDescription(method, requiresShipping, settings)}</p>
      <p className="mt-3 text-sm text-muted-foreground">{instructions}</p>
    </div>
  );
}
