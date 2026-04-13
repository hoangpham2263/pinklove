import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";
import type { VendorAssignmentStatus } from "@/features/vendor-orders/types";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  processing: "Đang xử lý",
  ready_to_ship: "Sẵn sàng giao",
  shipped: "Đã giao vận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thanh toán lỗi",
  refunded: "Đã hoàn tiền",
};

const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  not_required: "Không cần giao",
  pending: "Chờ xử lý",
  processing: "Đang chuẩn bị",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const VENDOR_ASSIGNMENT_STATUS_LABELS: Record<VendorAssignmentStatus, string> = {
  pending_confirmation: "Chờ xác nhận",
  accepted: "Đã nhận",
  in_progress: "Đang thực hiện",
  ready_for_review: "Chờ duyệt",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
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
