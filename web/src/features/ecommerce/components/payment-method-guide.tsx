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
  if (method === "mock_online") {
    return null;
  }

  if (method === "bank_transfer") {
    const qrUrl = getBankTransferQrUrl({
      settings,
      amount,
      addInfo: orderNumber ? `Thanh toan ${orderNumber}` : undefined,
    });

    return (
      <div className={`rounded-xl border bg-muted/20 p-4 ${className}`.trim()}>
        <p className="text-sm font-semibold">{getPaymentMethodLabel(method, settings)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{getPaymentMethodDescription(method, requiresShipping, settings)}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-foreground">Ngân hàng:</span> {settings.bankName || "Chưa cấu hình"}</p>
            <p><span className="font-medium text-foreground">Số tài khoản:</span> {settings.bankAccountNumber || "Chưa cấu hình"}</p>
            <p><span className="font-medium text-foreground">Chủ tài khoản:</span> {settings.bankAccountName || "Chưa cấu hình"}</p>
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

  return (
      <div className={`rounded-xl border bg-muted/20 p-4 ${className}`.trim()}>
      <p className="text-sm font-semibold">{getPaymentMethodLabel(method, settings)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{getPaymentMethodDescription(method, requiresShipping, settings)}</p>
      <p className="mt-3 text-sm text-muted-foreground">{configuredMethod?.instructions || settings.cashPaymentInstructions}</p>
    </div>
  );
}
