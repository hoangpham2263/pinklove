import type { ProductFulfillmentType, ProductType } from "@/features/products/types";

export type CartItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  productType: ProductType;
  fulfillmentType: ProductFulfillmentType;
  price: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "not_required" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = string;
export type ShipmentStatus = "pending" | "packing" | "shipped" | "delivered" | "returned" | "cancelled";

export type EcommerceOrderItem = {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productSlug: string;
  productType: ProductType;
  fulfillmentType: ProductFulfillmentType;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
};

export type EcommercePayment = {
  id: string;
  orderId: string;
  method: PaymentMethod;
  provider: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  externalRef?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EcommerceShipment = {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  notes: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EcommerceEntitlement = {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  orderItemId?: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
};

export type EcommerceOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingWard: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  notes: string;
  affiliateUserId?: string;
  affiliateCode?: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  items: EcommerceOrderItem[];
  payments: EcommercePayment[];
  shipment?: EcommerceShipment | null;
};
