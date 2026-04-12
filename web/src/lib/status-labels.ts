import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";
import type { VendorAssignmentStatus } from "@/features/vendor-orders/types";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Cho thanh toan",
  paid: "Da thanh toan",
  processing: "Dang xu ly",
  ready_to_ship: "San sang giao",
  shipped: "Da giao van",
  completed: "Hoan tat",
  cancelled: "Da huy",
  refunded: "Da hoan tien",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Chua thanh toan",
  pending: "Dang cho",
  paid: "Da thanh toan",
  failed: "Thanh toan loi",
  refunded: "Da hoan tien",
};

const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  not_required: "Khong can giao",
  pending: "Cho xu ly",
  processing: "Dang chuan bi",
  shipped: "Dang giao",
  delivered: "Da giao",
  cancelled: "Da huy",
};

const VENDOR_ASSIGNMENT_STATUS_LABELS: Record<VendorAssignmentStatus, string> = {
  pending_confirmation: "Cho xac nhan",
  accepted: "Da nhan",
  in_progress: "Dang thuc hien",
  ready_for_review: "Cho duyet",
  completed: "Hoan tat",
  cancelled: "Da huy",
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

export function getVendorAssignmentStatusLabel(status: VendorAssignmentStatus) {
  return VENDOR_ASSIGNMENT_STATUS_LABELS[status] ?? status;
}
