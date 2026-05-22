import type { OfferingFulfillmentType } from "@/features/offerings/types";

export type VendorOfferingSubmissionType = "create" | "update" | "discontinue";
export type VendorOfferingReviewStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "archived";
export type VendorOfferingSubmissionActorType = "admin" | "vendor" | "system";
export type VendorOfferingSubmissionEventType =
  | "created"
  | "submitted"
  | "review_started"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "updated"
  | "archived"
  | "note_added";

export type VendorOfferingSubmission = {
  id: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  linkedOfferingId?: string;
  linkedOfferingSlug?: string;
  linkedOfferingName?: string;
  categoryId?: string;
  categoryName?: string;
  submissionType: VendorOfferingSubmissionType;
  reviewStatus: VendorOfferingReviewStatus;
  name: string;
  slugCandidate: string;
  excerpt: string;
  description: string;
  thumbnailUrl: string;
  fulfillmentType: OfferingFulfillmentType;
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

export type VendorOfferingSubmissionEvent = {
  id: string;
  submissionId: string;
  actorUserId?: string;
  actorUsername?: string;
  actorType: VendorOfferingSubmissionActorType;
  eventType: VendorOfferingSubmissionEventType;
  message: string;
  createdAt: string;
};

export type VendorOfferingSubmissionDetail = VendorOfferingSubmission & {
  events: VendorOfferingSubmissionEvent[];
};

export type OfferingVendorSupplierStatus = "active" | "paused" | "suspended" | "revoked";
export type OfferingVendorSupplierSource = "admin" | "proposal" | "supplier_request";

export type OfferingVendorSupplier = {
  id: string;
  offeringId: string;
  offeringName: string;
  offeringSlug: string;
  offeringThumbnailUrl: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  status: OfferingVendorSupplierStatus;
  source: OfferingVendorSupplierSource;
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

export type VendorOfferingSupplierRequestStatus =
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "archived";

export type VendorOfferingSupplierRequest = {
  id: string;
  offeringId: string;
  offeringName: string;
  offeringSlug: string;
  offeringThumbnailUrl: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  reviewStatus: VendorOfferingSupplierRequestStatus;
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

export type AvailableVendorSupplyOffering = {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  excerpt: string;
  offeringType: string;
  price: number;
  supplierStatus?: OfferingVendorSupplierStatus;
  requestStatus?: VendorOfferingSupplierRequestStatus;
};
