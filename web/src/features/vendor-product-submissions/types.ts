import type { ProductFulfillmentType } from "@/features/products/types";

export type VendorProductSubmissionType = "create" | "update" | "discontinue";
export type VendorProductReviewStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "archived";
export type VendorProductSubmissionActorType = "admin" | "vendor" | "system";
export type VendorProductSubmissionEventType =
  | "created"
  | "submitted"
  | "review_started"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "updated"
  | "archived"
  | "note_added";

export type VendorProductSubmission = {
  id: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  linkedProductId?: string;
  linkedProductSlug?: string;
  linkedProductName?: string;
  categoryId?: string;
  categoryName?: string;
  submissionType: VendorProductSubmissionType;
  reviewStatus: VendorProductReviewStatus;
  name: string;
  slugCandidate: string;
  excerpt: string;
  description: string;
  thumbnailUrl: string;
  fulfillmentType: ProductFulfillmentType;
  purchaseCost: number;
  proposedStockQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  vendorSku: string;
  vendorNote: string;
  adminSellPrice?: number;
  reviewNote: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewedByUsername?: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorProductSubmissionEvent = {
  id: string;
  submissionId: string;
  actorUserId?: string;
  actorUsername?: string;
  actorType: VendorProductSubmissionActorType;
  eventType: VendorProductSubmissionEventType;
  message: string;
  createdAt: string;
};

export type VendorProductSubmissionDetail = VendorProductSubmission & {
  events: VendorProductSubmissionEvent[];
};

export type ProductVendorSupplierStatus = "active" | "paused" | "suspended" | "revoked";
export type ProductVendorSupplierSource = "admin" | "proposal" | "supplier_request";

export type ProductVendorSupplier = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productThumbnailUrl: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  status: ProductVendorSupplierStatus;
  source: ProductVendorSupplierSource;
  purchaseCost: number;
  vendorSku: string;
  leadTimeDays: number;
  monthlyCapacity: number;
  serviceArea: string;
  qualityNote: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorProductSupplierRequestStatus =
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "archived";

export type VendorProductSupplierRequest = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productThumbnailUrl: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  reviewStatus: VendorProductSupplierRequestStatus;
  purchaseCost: number;
  vendorSku: string;
  leadTimeDays: number;
  monthlyCapacity: number;
  serviceArea: string;
  sampleImageUrl: string;
  materialNote: string;
  qualityNote: string;
  vendorNote: string;
  reviewNote: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AvailableVendorSupplyProduct = {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  excerpt: string;
  productType: string;
  price: number;
  supplierStatus?: ProductVendorSupplierStatus;
  requestStatus?: VendorProductSupplierRequestStatus;
};
