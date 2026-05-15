import "server-only";

import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";
import type { Pay2sBankAccount, Pay2sConfig } from "@/types/pay2s";

function normalizeEndpoint(endpoint: string) {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.endsWith("/v1/gateway/api/create")) return trimmed;
  return `${trimmed}/v1/gateway/api/create`;
}

function parseBankAccounts(value: string): Pay2sBankAccount[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [accountNumber, bankId] = line.split("|").map((part) => part.trim());
      if (!accountNumber || !bankId) return null;
      return {
        account_number: accountNumber,
        bank_id: bankId.toUpperCase(),
      };
    })
    .filter((item): item is Pay2sBankAccount => Boolean(item));
}

export function getPay2sConfig(method?: EcommercePaymentMethodSettings | null): Pay2sConfig | null {
  const partnerCode = method?.pay2sPartnerCode?.trim() || "";
  const accessKey = method?.pay2sAccessKey?.trim() || "";
  const secretKey = method?.pay2sSecretKey?.trim() || "";
  const createEndpoint = normalizeEndpoint(method?.pay2sEndpoint || "");
  const bankAccounts = parseBankAccounts(method?.pay2sBankAccounts || "");

  if (!partnerCode || !accessKey || !secretKey || !createEndpoint || bankAccounts.length === 0) {
    return null;
  }

  return {
    createEndpoint,
    partnerCode,
    accessKey,
    secretKey,
    requestType: "pay2s",
    bankAccounts,
  };
}
