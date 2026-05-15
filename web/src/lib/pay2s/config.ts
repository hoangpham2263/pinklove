import "server-only";

import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";
import type { Pay2sConfig } from "@/types/pay2s";

const SANDBOX_CREATE_ENDPOINT = "https://sandbox-payment.pay2s.vn/v1/gateway/api/create";

function normalizeEndpoint(endpoint: string) {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  if (!trimmed) return SANDBOX_CREATE_ENDPOINT;
  if (trimmed.endsWith("/v1/gateway/api/create")) return trimmed;
  return `${trimmed}/v1/gateway/api/create`;
}

function envValue(name: string) {
  return process.env[name]?.trim() || "";
}

export function getPay2sConfig(method?: EcommercePaymentMethodSettings | null): Pay2sConfig | null {
  const partnerCode = method?.pay2sPartnerCode?.trim() || envValue("PAY2S_PARTNER_CODE");
  const accessKey = method?.pay2sAccessKey?.trim() || envValue("PAY2S_ACCESS_KEY");
  const secretKey = method?.pay2sSecretKey?.trim() || envValue("PAY2S_SECRET_KEY");

  if (!partnerCode || !accessKey || !secretKey) {
    return null;
  }

  return {
    createEndpoint: normalizeEndpoint(method?.pay2sEndpoint || envValue("PAY2S_CREATE_ENDPOINT") || SANDBOX_CREATE_ENDPOINT),
    partnerCode,
    accessKey,
    secretKey,
    requestType: "pay2s",
    returnUrl: envValue("PAY2S_RETURN_URL") || undefined,
    notifyUrl: envValue("PAY2S_NOTIFY_URL") || undefined,
  };
}
