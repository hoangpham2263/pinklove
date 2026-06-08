import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";
import type { ProviderAssignmentStatus } from "@/features/provider-orders/types";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  not_required: "Not required",
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PROVIDER_ASSIGNMENT_STATUS_LABELS: Record<ProviderAssignmentStatus, string> = {
  pending_confirmation: "Pending confirmation",
  accepted: "Accepted",
  in_progress: "In progress",
  ready_for_review: "Ready for review",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getOrderStatusLabel(status: OrderStatus) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function getFulfillmentStatusLabel(status: FulfillmentStatus) {
  return FULFILLMENT_STATUS_LABELS[status] ?? status;
}

export function getProviderAssignmentStatusLabel(status: ProviderAssignmentStatus) {
  return PROVIDER_ASSIGNMENT_STATUS_LABELS[status] ?? status;
}
