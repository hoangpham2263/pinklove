import type { EcommerceOrder } from "@/features/ecommerce/types";

export type VendorAssignmentStatus =
  | "pending_confirmation"
  | "accepted"
  | "in_progress"
  | "ready_for_review"
  | "completed"
  | "cancelled";

export type VendorEventActorType = "admin" | "vendor" | "system";
export type VendorEventType = "assignment_created" | "assignment_reassigned" | "status_changed" | "note_added";

export type VendorOrderEvent = {
  id: string;
  assignmentId: string;
  actorUserId?: string;
  actorUsername?: string;
  actorType: VendorEventActorType;
  eventType: VendorEventType;
  message: string;
  createdAt: string;
};

export type VendorOrderAssignment = {
  id: string;
  orderId: string;
  vendorUserId: string;
  vendorUsername: string;
  vendorDisplayName: string;
  status: VendorAssignmentStatus;
  internalNote: string;
  vendorNote: string;
  vendorReference: string;
  assignedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type VendorOrderSummary = {
  assignment: VendorOrderAssignment;
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
  lastEvent?: VendorOrderEvent;
};

export type VendorOrderDetail = VendorOrderSummary & {
  order: EcommerceOrder;
  events: VendorOrderEvent[];
};
