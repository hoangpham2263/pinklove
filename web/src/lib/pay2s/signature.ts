import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Pay2sParams } from "@/types/pay2s";

function signRaw(rawHash: string, secretKey: string) {
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
    `ipnUrl=${input.ipnUrl}`,
    `orderId=${input.orderId}`,
    `orderInfo=${input.orderInfo}`,
    `partnerCode=${input.partnerCode}`,
    `redirectUrl=${input.redirectUrl}`,
    `requestId=${input.requestId}`,
    `requestType=${input.requestType}`,
  ].join("&");

  return signRaw(rawHash, input.secretKey);
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

  return signRaw(rawHash, secretKey);
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

  return signRaw(rawHash, secretKey);
}

export function verifyPay2sRedirectSignature(params: Pay2sParams, accessKey: string, secretKey: string) {
  const signature = String(params.m2signature ?? params.signature ?? "");
  return safeEqualHex(generatePay2sRedirectSignature(params, accessKey, secretKey), signature);
}
