import type { EcommerceOrder } from "@/features/ecommerce/types";

export type ProviderAssignmentStatus =
  | "pending_confirmation"
  | "accepted"
  | "in_progress"
  | "ready_for_review"
  | "completed"
  | "cancelled";

export type ProviderEventActorType = "admin" | "provider" | "system";
export type ProviderEventType = "assignment_created" | "assignment_reassigned" | "status_changed" | "note_added";

export type ProviderOrderEvent = {
  id: string;
  assignmentId: string;
  actorUserId?: string;
  actorUsername?: string;
  actorType: ProviderEventActorType;
  eventType: ProviderEventType;
  message: string;
  createdAt: string;
};

export type ProviderOrderAssignment = {
  id: string;
  orderId: string;
  providerId: string;
  providerUsername: string;
  providerDisplayName: string;
  status: ProviderAssignmentStatus;
  internalNote: string;
  providerNote: string;
  providerReference: string;
  assignedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProviderOrderSummary = {
  assignment: ProviderOrderAssignment;
  order: Pick<
    EcommerceOrder,
    | "id"
    | "orderNumber"
    | "customerName"
    | "customerEmail"
    | "customerPhone"
    | "status"
    | "paymentStatus"
    | "fulfillmentStatus"
    | "totalAmount"
    | "currency"
    | "notes"
    | "createdAt"
    | "updatedAt"
  >;
  items: Array<{
    id: string;
    offeringName: string;
    quantity: number;
    fulfillmentType: string;
  }>;
  lastEvent?: ProviderOrderEvent;
};

export type ProviderOrderDetail = ProviderOrderSummary & {
  order: EcommerceOrder;
  events: ProviderOrderEvent[];
};
