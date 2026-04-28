import "server-only";

import { createHmac } from "node:crypto";
import type { EcommerceOrder } from "@/features/ecommerce/types";
import { ROUTES } from "@/lib/routes";

type VnpayParams = Record<string, string>;

export type VnpayConfig = {
  paymentUrl: string;
  tmnCode: string;
  hashSecret: string;
};

export function getVnpayConfig(): VnpayConfig | null {
  const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
  const hashSecret = process.env.VNPAY_HASH_SECRET?.trim();

  if (!tmnCode || !hashSecret) {
    return null;
  }

  return {
    paymentUrl: process.env.VNPAY_PAYMENT_URL?.trim() || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    tmnCode,
    hashSecret,
  };
}

function formatVnpayDate(input: Date) {
  const vietnamDate = new Date(input.getTime() + 7 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    vietnamDate.getUTCFullYear(),
    pad(vietnamDate.getUTCMonth() + 1),
    pad(vietnamDate.getUTCDate()),
    pad(vietnamDate.getUTCHours()),
    pad(vietnamDate.getUTCMinutes()),
    pad(vietnamDate.getUTCSeconds()),
  ].join("");
}

function sortParams(params: VnpayParams) {
  return Object.keys(params)
    .filter((key) => params[key] !== "")
    .sort()
    .reduce<VnpayParams>((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
}

function stringifyParams(params: VnpayParams) {
  return Object.entries(sortParams(params))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export function signVnpayParams(params: VnpayParams, hashSecret: string) {
  return createHmac("sha512", hashSecret).update(stringifyParams(params), "utf8").digest("hex");
}

export function verifyVnpayParams(params: VnpayParams, hashSecret: string) {
  const secureHash = params.vnp_SecureHash;
  if (!secureHash) return false;

  const signedParams = { ...params };
  delete signedParams.vnp_SecureHash;
  delete signedParams.vnp_SecureHashType;

  return signVnpayParams(signedParams, hashSecret).toLowerCase() === secureHash.toLowerCase();
}

export function getVnpayReturnPath() {
  return ROUTES.API.PAYMENTS.VNPAY.RETURN;
}

export function getVnpayIpnPath() {
  return ROUTES.API.PAYMENTS.VNPAY.IPN;
}

export function createVnpayPaymentUrl(input: {
  order: EcommerceOrder;
  paymentId: string;
  requestIp: string;
  returnUrl: string;
  config: VnpayConfig;
}) {
  const now = new Date();
  const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
  const params: VnpayParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: input.config.tmnCode,
    vnp_Amount: String(Math.round(input.order.totalAmount * 100)),
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.paymentId,
    vnp_OrderInfo: `Thanh toan don hang ${input.order.orderNumber}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: input.returnUrl,
    vnp_IpAddr: input.requestIp,
    vnp_CreateDate: formatVnpayDate(now),
    vnp_ExpireDate: formatVnpayDate(expireDate),
  };
  const secureHash = signVnpayParams(params, input.config.hashSecret);

  return `${input.config.paymentUrl}?${stringifyParams(params)}&vnp_SecureHash=${secureHash}`;
}

export function getVnpayRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

export function getVnpayQueryParams(url: URL): VnpayParams {
  const params: VnpayParams = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
