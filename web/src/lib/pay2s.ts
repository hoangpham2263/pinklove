import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";

export type Pay2sBankAccount = {
  account_number: string;
  bank_id: string;
};

export type Pay2sConfig = {
  createEndpoint: string;
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  requestType: string;
  bankAccounts: Pay2sBankAccount[];
  returnUrl?: string;
  notifyUrl?: string;
};

export type Pay2sCreatePayload = {
  accessKey: string;
  partnerCode: string;
  requestId: string;
  amount: number;
  orderId: string;
  orderInfo: string;
  bankAccounts: Pay2sBankAccount[];
  redirectUrl: string;
  ipnUrl: string;
  requestType: string;
  signature: string;
};

export type Pay2sCreateResponse = {
  partnerCode?: string;
  requestId?: string;
  orderId?: string;
  amount?: string | number;
  message?: string;
  resultCode?: string | number;
  paymentUrl?: string;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  qrList?: unknown[];
  [key: string]: unknown;
};

export type Pay2sParams = Record<string, string | number | boolean | null | undefined>;

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

export function parsePay2sBankAccounts(input?: string): Pay2sBankAccount[] {
  const value = input?.trim();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const account = item as Record<string, unknown>;
          const accountNumber = String(account.account_number ?? account.accountNumber ?? "").trim();
          const bankId = String(account.bank_id ?? account.bankId ?? "").trim();
          return accountNumber && bankId ? { account_number: accountNumber, bank_id: bankId } : null;
        })
        .filter(Boolean) as Pay2sBankAccount[];
    }
  } catch {
    // Fall through to the admin textarea format: account_number|bank_id per line.
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [accountNumber, bankId] = line.split("|").map((part) => part.trim());
      return accountNumber && bankId ? { account_number: accountNumber, bank_id: bankId } : null;
    })
    .filter(Boolean) as Pay2sBankAccount[];
}

export function getPay2sConfig(method: EcommercePaymentMethodSettings): Pay2sConfig | null {
  const partnerCode = method.pay2sPartnerCode?.trim() || envValue("PAY2S_PARTNER_CODE");
  const accessKey = method.pay2sAccessKey?.trim() || envValue("PAY2S_ACCESS_KEY");
  const secretKey = method.pay2sSecretKey?.trim() || envValue("PAY2S_SECRET_KEY");

  if (!partnerCode || !accessKey || !secretKey) {
    return null;
  }

  return {
    createEndpoint: normalizeEndpoint(method.pay2sEndpoint || envValue("PAY2S_CREATE_ENDPOINT") || SANDBOX_CREATE_ENDPOINT),
    partnerCode,
    accessKey,
    secretKey,
    requestType: "pay2s",
    bankAccounts: parsePay2sBankAccounts(method.pay2sBankAccounts || envValue("PAY2S_BANK_ACCOUNTS")),
    returnUrl: envValue("PAY2S_RETURN_URL") || undefined,
    notifyUrl: envValue("PAY2S_NOTIFY_URL") || undefined,
  };
}

export function signPay2sRaw(rawHash: string, secretKey: string) {
  return createHmac("sha256", secretKey).update(rawHash, "utf8").digest("hex");
}

function safeEqualHex(left: string, right: string) {
  const normalizedLeft = left.trim().toLowerCase();
  const normalizedRight = right.trim().toLowerCase();
  if (!normalizedLeft || !normalizedRight || normalizedLeft.length !== normalizedRight.length) return false;

  try {
    return timingSafeEqual(Buffer.from(normalizedLeft, "hex"), Buffer.from(normalizedRight, "hex"));
  } catch {
    return false;
  }
}

export function generatePay2sCreateSignature(input: {
  accessKey: string;
  amount: number | string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string;
  secretKey: string;
}) {
  const rawHash = [
    `accessKey=${input.accessKey}`,
    `amount=${input.amount}`,
    "bankAccounts=Array",
    `ipnUrl=${input.ipnUrl}`,
    `orderId=${input.orderId}`,
    `orderInfo=${input.orderInfo}`,
    `partnerCode=${input.partnerCode}`,
    `redirectUrl=${input.redirectUrl}`,
    `requestId=${input.requestId}`,
    `requestType=${input.requestType}`,
  ].join("&");

  return signPay2sRaw(rawHash, input.secretKey);
}

export function generatePay2sIpnSignature(params: Pay2sParams, accessKey: string, secretKey: string) {
  const rawHash = [
    `accessKey=${accessKey}`,
    `amount=${params.amount ?? ""}`,
    `extraData=${params.extraData ?? ""}`,
    `message=${params.message ?? ""}`,
    `orderId=${params.orderId ?? ""}`,
    `orderInfo=${params.orderInfo ?? ""}`,
    `orderType=${params.orderType ?? ""}`,
    `partnerCode=${params.partnerCode ?? ""}`,
    `payType=${params.payType ?? ""}`,
    `requestId=${params.requestId ?? ""}`,
    `responseTime=${params.responseTime ?? ""}`,
    `resultCode=${params.resultCode ?? ""}`,
    `transId=${params.transId ?? ""}`,
  ].join("&");

  return signPay2sRaw(rawHash, secretKey);
}

export function verifyPay2sIpnSignature(params: Pay2sParams, accessKey: string, secretKey: string) {
  const signature = String(params.signature ?? "");
  return safeEqualHex(generatePay2sIpnSignature(params, accessKey, secretKey), signature);
}

export function generatePay2sRedirectSignature(params: Pay2sParams, accessKey: string, secretKey: string) {
  const rawHash = [
    `accessKey=${accessKey}`,
    `amount=${params.amount ?? ""}`,
    `message=${params.message ?? ""}`,
    `orderId=${params.orderId ?? ""}`,
    `orderInfo=${params.orderInfo ?? ""}`,
    `orderType=${params.orderType ?? ""}`,
    `partnerCode=${params.partnerCode ?? ""}`,
    `payType=${params.payType ?? ""}`,
    `requestId=${params.requestId ?? ""}`,
    `responseTime=${params.responseTime ?? ""}`,
    `resultCode=${params.resultCode ?? ""}`,
  ].join("&");

  return signPay2sRaw(rawHash, secretKey);
}

export function verifyPay2sRedirectSignature(params: Pay2sParams, accessKey: string, secretKey: string) {
  const signature = String(params.m2signature ?? params.signature ?? "");
  return safeEqualHex(generatePay2sRedirectSignature(params, accessKey, secretKey), signature);
}

export function extractPay2sPaymentUrl(response: Pay2sCreateResponse) {
  return String(response.paymentUrl || response.payUrl || response.deeplink || response.qrCodeUrl || "").trim();
}

export function getPay2sResultStatus(resultCode: unknown) {
  const code = String(resultCode ?? "");
  return code === "0" || code === "9000" ? "paid" : "failed";
}
