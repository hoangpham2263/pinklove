import type { OfferingFulfillmentType } from "@/features/offerings/types";

export type ProviderOfferingSubmissionType = "create" | "update" | "discontinue";
export type ProviderOfferingReviewStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "archived";
export type ProviderOfferingSubmissionActorType = "admin" | "provider" | "system";
export type ProviderOfferingSubmissionEventType =
  | "created"
  | "submitted"
  | "review_started"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "updated"
  | "archived"
  | "note_added";

export type ProviderOfferingSubmission = {
  id: string;
  providerId: string;
  providerUsername: string;
  providerDisplayName: string;
  linkedOfferingId?: string;
  linkedOfferingSlug?: string;
  linkedOfferingName?: string;
  categoryId?: string;
  categoryName?: string;
  submissionType: ProviderOfferingSubmissionType;
  reviewStatus: ProviderOfferingReviewStatus;
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
  providerSku: string;
  providerNote: string;
  adminSellPrice?: number;
  reviewNote: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewedByUsername?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderOfferingSubmissionEvent = {
  id: string;
  submissionId: string;
  actorUserId?: string;
  actorUsername?: string;
  actorType: ProviderOfferingSubmissionActorType;
  eventType: ProviderOfferingSubmissionEventType;
  message: string;
  createdAt: string;
};

export type ProviderOfferingSubmissionDetail = ProviderOfferingSubmission & {
  events: ProviderOfferingSubmissionEvent[];
};

export type OfferingProviderSupplierStatus = "active" | "paused" | "suspended" | "revoked";
export type OfferingProviderSupplierSource = "admin" | "proposal" | "supplier_request";

export type OfferingProviderSupplier = {
  id: string;
  offeringId: string;
  offeringName: string;
  offeringSlug: string;
  offeringThumbnailUrl: string;
  providerId: string;
  providerUsername: string;
  providerDisplayName: string;
  status: OfferingProviderSupplierStatus;
  source: OfferingProviderSupplierSource;
  purchaseCost: number;
  providerSku: string;
  leadTimeDays: number;
  monthlyCapacity: number;
  serviceArea: string;
  qualityNote: string;
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderOfferingSupplierRequestStatus =
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "archived";

export type ProviderOfferingSupplierRequest = {
  id: string;
  offeringId: string;
  offeringName: string;
  offeringSlug: string;
  offeringThumbnailUrl: string;
  providerId: string;
  providerUsername: string;
  providerDisplayName: string;
  reviewStatus: ProviderOfferingSupplierRequestStatus;
  purchaseCost: number;
  providerSku: string;
  leadTimeDays: number;
  monthlyCapacity: number;
  serviceArea: string;
  sampleImageUrl: string;
  materialNote: string;
  qualityNote: string;
  providerNote: string;
  reviewNote: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AvailableProviderSupplyOffering = {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  excerpt: string;
  offeringType: string;
  price: number;
  supplierStatus?: OfferingProviderSupplierStatus;
  requestStatus?: ProviderOfferingSupplierRequestStatus;
};
