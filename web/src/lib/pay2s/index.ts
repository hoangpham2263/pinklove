import "server-only";

export { getPay2sConfig } from "@/lib/pay2s/config";
export {
  generatePay2sCreateSignature,
  generatePay2sIpnSignature,
  generatePay2sRedirectSignature,
  verifyPay2sIpnSignature,
  verifyPay2sRedirectSignature,
} from "@/lib/pay2s/signature";
export type {
  Pay2sConfig,
  Pay2sCreatePayload,
  Pay2sCreateResponse,
  Pay2sParams,
} from "@/types/pay2s";
export function extractPay2sPaymentUrl(response: import("@/types/pay2s").Pay2sCreateResponse) {
  return String(response.paymentUrl || response.payUrl || response.deeplink || response.qrCodeUrl || "").trim();
}

export function getPay2sResultStatus(resultCode: unknown) {
  const code = String(resultCode ?? "");
  return code === "0" || code === "9000" ? "paid" : "failed";
}
