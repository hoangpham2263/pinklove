export type AffiliateStatus = "pending" | "active" | "rejected" | "blocked";
export type AffiliateCommissionType = "percent" | "fixed";
export type AffiliateConversionStatus = "pending" | "approved" | "rejected" | "paid";

export type AffiliateAccount = {
  userId: string;
  username: string;
  code: string;
  status: AffiliateStatus;
  commissionType: AffiliateCommissionType;
  commissionValue: number;
  notes?: string;
  approvedByUsername?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  clickCount: number;
  conversionCount: number;
  earnedCommission: number;
};

export type AffiliateClick = {
  id: string;
  affiliateUserId: string;
  affiliateCode: string;
  landingPath: string;
  referrer?: string;
  visitorToken?: string;
  userAgent?: string;
  createdAt: string;
};

export type AffiliateConversion = {
  id: string;
  affiliateUserId: string;
  affiliateCode: string;
  externalOrderRef?: string;
  orderValue: number;
  commissionAmount: number;
  status: AffiliateConversionStatus;
  createdAt: string;
  updatedAt: string;
};
