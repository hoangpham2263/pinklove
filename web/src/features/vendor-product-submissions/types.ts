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
