export type Pay2sConfig = {
  createEndpoint: string;
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  requestType: string;
  bankAccounts: Pay2sBankAccount[];
};

export type Pay2sBankAccount = {
  account_number: string;
  bank_id: string;
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
  qrCode?: string;
  qrList?: unknown[];
  [key: string]: unknown;
};

export type Pay2sParams = Record<string, string | number | boolean | null | undefined>;
