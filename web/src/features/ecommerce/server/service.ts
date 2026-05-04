import "server-only";

import { randomUUID } from "node:crypto";
import type {
  CartItem,
  EcommerceEntitlement,
  EcommerceOrder,
  EcommerceOrderItem,
  EcommercePayment,
  EcommerceShipment,
  FulfillmentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from "@/features/ecommerce/types";
import { getAffiliateAccountByCode } from "@/features/affiliate/server/service";
import { listPublishedProductsByIds } from "@/features/products/server/service";
import { getUserWishlistProductIds } from "@/features/products/server/wishlist-service";
import { isInvitationProductType, type ProductFulfillmentType, type ProductType } from "@/features/products/types";
import { query, withTransaction } from "@/lib/database";
import { getSystemSettings, type EcommercePaymentMethodSettings } from "@/lib/system-settings";

type CartItemRow = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: string;
  created_at: string;
  updated_at: string;
  product_name: string;
  product_slug: string;
  product_type: ProductType;
  fulfillment_type: ProductFulfillmentType;
  price: string;
  thumbnail_url: string | null;
};

type CartInventoryRow = {
  product_id: string;
  product_name: string;
  quantity: string;
  track_inventory: boolean;
  stock_quantity: string;
  allow_backorder: boolean;
};

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  currency: string;
  subtotal_amount: string;
  discount_amount: string;
  shipping_amount: string;
  total_amount: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_ward: string;
  shipping_district: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  notes: string;
  affiliate_user_id: string | null;
  affiliate_code: string | null;
  paid_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  product_type: ProductType;
  fulfillment_type: ProductFulfillmentType;
  quantity: string;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  method: PaymentMethod;
  provider: string;
  amount: string;
  status: EcommercePayment["status"];
  external_ref: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type ShipmentRow = {
  id: string;
  order_id: string;
  carrier: string;
  tracking_number: string;
  status: ShipmentStatus;
  notes: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type EntitlementRow = {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  order_item_id: string | null;
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
};

function toNumber(value: string | null | undefined) {
  return Number(value ?? "0");
}

function mapCartItemRow(row: CartItemRow): CartItem {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: Number(row.quantity ?? "1"),
    productName: row.product_name,
    productSlug: row.product_slug,
    productType: row.product_type,
    fulfillmentType: row.fulfillment_type,
    price: toNumber(row.price),
    thumbnailUrl: row.thumbnail_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderRow(row: OrderRow): Omit<EcommerceOrder, "items" | "payments" | "shipment"> {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    currency: row.currency,
    subtotalAmount: toNumber(row.subtotal_amount),
    discountAmount: toNumber(row.discount_amount),
    shippingAmount: toNumber(row.shipping_amount),
    totalAmount: toNumber(row.total_amount),
    shippingName: row.shipping_name,
    shippingPhone: row.shipping_phone,
    shippingLine1: row.shipping_line1,
    shippingLine2: row.shipping_line2,
    shippingWard: row.shipping_ward,
    shippingDistrict: row.shipping_district,
    shippingCity: row.shipping_city,
    shippingPostalCode: row.shipping_postal_code,
    shippingCountry: row.shipping_country,
    notes: row.notes,
    affiliateUserId: row.affiliate_user_id ?? undefined,
    affiliateCode: row.affiliate_code ?? undefined,
    paidAt: row.paid_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItemRow(row: OrderItemRow): EcommerceOrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id ?? undefined,
    productName: row.product_name,
    productSlug: row.product_slug,
    productType: row.product_type,
    fulfillmentType: row.fulfillment_type,
    quantity: Number(row.quantity ?? "1"),
    unitPrice: toNumber(row.unit_price),
    lineTotal: toNumber(row.line_total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentRow(row: PaymentRow): EcommercePayment {
  return {
    id: row.id,
    orderId: row.order_id,
    method: row.method,
    provider: row.provider,
    amount: toNumber(row.amount),
    status: row.status,
    externalRef: row.external_ref ?? undefined,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapShipmentRow(row: ShipmentRow): EcommerceShipment {
  return {
    id: row.id,
    orderId: row.order_id,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    status: row.status,
    notes: row.notes,
    shippedAt: row.shipped_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntitlementRow(row: EntitlementRow): EcommerceEntitlement {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    orderId: row.order_id,
    orderItemId: row.order_item_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function generateOrderNumber() {
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  for (let index = 0; index < 1000; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const candidate = `PL-${y}${m}${d}-${suffix}`;
    const exists = await query<{ id: string }>(
      "SELECT id FROM commerce_orders WHERE order_number = $1 LIMIT 1",
      [candidate]
    );
    if (!exists.rows[0]) {
      return candidate;
    }
  }

  return `PL-${y}${m}${d}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

async function loadOrderBundleById(orderId: string): Promise<EcommerceOrder | null> {
  const [orderResult, itemsResult, paymentsResult, shipmentResult] = await Promise.all([
    query<OrderRow>("SELECT * FROM commerce_orders WHERE id = $1 LIMIT 1", [orderId]),
    query<OrderItemRow>("SELECT * FROM commerce_order_items WHERE order_id = $1 ORDER BY created_at ASC", [orderId]),
    query<PaymentRow>("SELECT * FROM commerce_payments WHERE order_id = $1 ORDER BY created_at ASC", [orderId]),
    query<ShipmentRow>("SELECT * FROM commerce_shipments WHERE order_id = $1 LIMIT 1", [orderId]),
  ]);

  const orderRow = orderResult.rows[0];
  if (!orderRow) {
    return null;
  }

  return {
    ...mapOrderRow(orderRow),
    items: itemsResult.rows.map(mapOrderItemRow),
    payments: paymentsResult.rows.map(mapPaymentRow),
    shipment: shipmentResult.rows[0] ? mapShipmentRow(shipmentResult.rows[0]) : null,
  };
}

export async function listCartItems(userId: string): Promise<CartItem[]> {
  const result = await query<CartItemRow>(
    `
      SELECT
        cart.id,
        cart.user_id,
        cart.product_id,
        cart.quantity::text,
        cart.created_at,
        cart.updated_at,
        products.name AS product_name,
        products.slug AS product_slug,
        products.product_type,
        COALESCE(general.fulfillment_type, products.fulfillment_type) AS fulfillment_type,
        products.price::text,
        products.thumbnail_url
      FROM shopping_cart_items cart
      JOIN products ON products.id = cart.product_id
      LEFT JOIN general_products general ON general.product_id = products.id
      WHERE cart.user_id = $1
      ORDER BY cart.updated_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapCartItemRow);
}

export async function syncCartWithWishlist(userId: string, selectedProductIds?: string[]) {
  const wishlistProductIds = await getUserWishlistProductIds(userId);
  const selectedSet = selectedProductIds?.length ? new Set(selectedProductIds) : null;
  const productIds = selectedSet ? wishlistProductIds.filter((id) => selectedSet.has(id)) : wishlistProductIds;
  const products = await listPublishedProductsByIds(productIds);

  await withTransaction(async (execute) => {
    await execute("DELETE FROM shopping_cart_items WHERE user_id = $1", [userId]);

    for (const product of products) {
      await execute(
        `
          INSERT INTO shopping_cart_items (user_id, product_id, quantity)
          VALUES ($1, $2, 1)
        `,
        [userId, product.id]
      );
    }
  });

  return products;
}

export async function listEntitlementsForUser(userId: string): Promise<EcommerceEntitlement[]> {
  const result = await query<EntitlementRow>(
    `
      SELECT *
      FROM commerce_entitlements
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapEntitlementRow);
}

export async function userHasActiveEntitlement(userId: string, productId: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `
      SELECT id
      FROM commerce_entitlements
      WHERE user_id = $1
        AND product_id = $2
        AND status = 'active'
      LIMIT 1
    `,
    [userId, productId]
  );
  return Boolean(result.rows[0]);
}

function getOrderStatusFromState(paymentStatus: PaymentStatus, fulfillmentStatus: FulfillmentStatus): OrderStatus {
  if (paymentStatus === "refunded") return "refunded";
  if (paymentStatus === "paid" && fulfillmentStatus === "delivered") return "completed";
  if (paymentStatus === "paid" && fulfillmentStatus === "shipped") return "shipped";
  if (paymentStatus === "paid" && fulfillmentStatus === "processing") return "processing";
  if (paymentStatus === "paid" && fulfillmentStatus === "pending") return "ready_to_ship";
  if (paymentStatus === "paid" && fulfillmentStatus === "not_required") return "completed";
  if (paymentStatus === "paid") return "paid";
  return "pending_payment";
}

async function syncAffiliateConversionForOrder(order: EcommerceOrder) {
  if (!order.affiliateUserId || !order.affiliateCode) {
    return;
  }

  const existing = await query<{ id: string }>(
    "SELECT id FROM affiliate_conversions WHERE external_order_ref = $1 LIMIT 1",
    [order.orderNumber]
  );

  if (existing.rows[0]) {
    await query(
      `
        UPDATE affiliate_conversions
        SET
          order_value = $2,
          status = $3,
          updated_at = NOW()
        WHERE external_order_ref = $1
      `,
      [
        order.orderNumber,
        order.totalAmount,
        order.paymentStatus === "paid" ? "approved" : order.paymentStatus === "refunded" ? "rejected" : "pending",
      ]
    );
    return;
  }

  const account = await getAffiliateAccountByCode(order.affiliateCode);
  if (!account || account.status !== "active") {
    return;
  }

  const commissionBase =
    account.commissionType === "fixed"
      ? account.commissionValue
      : Number(((order.totalAmount * account.commissionValue) / 100).toFixed(2));

  await query(
    `
      INSERT INTO affiliate_conversions (
        affiliate_user_id,
        affiliate_code,
        external_order_ref,
        order_value,
        commission_amount,
        status,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      account.userId,
      account.code,
      order.orderNumber,
      order.totalAmount,
      commissionBase,
      order.paymentStatus === "paid" ? "approved" : "pending",
      JSON.stringify({ orderId: order.id }),
    ]
  );
}

async function ensureEntitlementsForOrder(orderId: string) {
  const order = await loadOrderBundleById(orderId);
  if (!order || order.paymentStatus !== "paid") {
    return;
  }

  for (const item of order.items) {
    if (!item.productId || item.fulfillmentType !== "digital" || !isInvitationProductType(item.productType)) {
      continue;
    }

    await query(
      `
        INSERT INTO commerce_entitlements (user_id, product_id, order_id, order_item_id, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (user_id, product_id, order_id) DO NOTHING
      `,
      [order.userId, item.productId, order.id, item.id]
    );
  }

  await syncAffiliateConversionForOrder(order);
}

export async function createOrderFromCart(input: {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  paymentProvider?: string;
  paymentType?: EcommercePaymentMethodSettings["type"];
  notes?: string;
  affiliateCode?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingWard?: string;
  shippingDistrict?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
}) {
  const settings = await getSystemSettings();
  const cartItems = await listCartItems(input.userId);
  if (cartItems.length === 0) {
    throw new Error("CART_EMPTY");
  }

  const subtotalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiresShipping = settings.ecommerce.supportShipping && cartItems.some((item) => item.fulfillmentType === "physical");
  const shippingAccount = settings.ecommerce.shippingAccounts.find((account) => account.enabled);
  const flatShippingFee = shippingAccount?.flatShippingFee ?? settings.ecommerce.flatShippingFee;
  const freeShippingThreshold = shippingAccount?.freeShippingThreshold ?? settings.ecommerce.freeShippingThreshold;
  const shippingAmount =
    requiresShipping && subtotalAmount < freeShippingThreshold
      ? flatShippingFee
      : 0;
  const shippingName = input.shippingName?.trim() ?? input.customerName.trim();
  const shippingPhone = input.shippingPhone?.trim() ?? input.customerPhone.trim();
  const shippingLine1 = input.shippingLine1?.trim() ?? "";
  const shippingLine2 = input.shippingLine2?.trim() ?? "";
  const shippingWard = input.shippingWard?.trim() ?? "";
  const shippingDistrict = input.shippingDistrict?.trim() ?? "";
  const shippingCity = input.shippingCity?.trim() ?? "";
  const shippingPostalCode = input.shippingPostalCode?.trim() ?? "";
  const shippingCountry = input.shippingCountry?.trim() || "VN";

  if (requiresShipping && (!shippingName || !shippingPhone || !shippingLine1 || !shippingDistrict || !shippingCity)) {
    throw new Error("SHIPPING_ADDRESS_REQUIRED");
  }

  const totalAmount = subtotalAmount + shippingAmount;
  const orderNumber = await generateOrderNumber();
  const affiliateAccount = input.affiliateCode ? await getAffiliateAccountByCode(input.affiliateCode) : null;
  const paymentMethodConfig = settings.ecommerce.paymentMethods.find((item) => item.code === input.paymentMethod);
  const paymentProvider = input.paymentProvider ?? paymentMethodConfig?.provider ?? input.paymentMethod;
  const paymentType = input.paymentType ?? paymentMethodConfig?.type ?? "manual";
  const autoApprove =
    totalAmount === 0 ||
    (paymentType === "mock" && settings.ecommerce.autoApproveMockPayments);
  const paymentStatus: PaymentStatus = autoApprove ? "paid" : paymentType === "offline" ? "pending" : "unpaid";
  const fulfillmentStatus: FulfillmentStatus = requiresShipping ? "pending" : "not_required";
  const status = getOrderStatusFromState(paymentStatus, fulfillmentStatus);

  const order = await withTransaction(async (execute) => {
    const inventoryRows = await execute<CartInventoryRow>(
      `
        SELECT
          cart.product_id,
          products.name AS product_name,
          cart.quantity::text,
          COALESCE(general.track_inventory, products.track_inventory) AS track_inventory,
          COALESCE(general.stock_quantity, products.stock_quantity)::text AS stock_quantity,
          COALESCE(general.allow_backorder, products.allow_backorder) AS allow_backorder
        FROM shopping_cart_items cart
        JOIN products ON products.id = cart.product_id
        LEFT JOIN general_products general ON general.product_id = cart.product_id
        WHERE cart.user_id = $1
        FOR UPDATE OF products, general
      `,
      [input.userId]
    );

    for (const row of inventoryRows.rows) {
      const requested = Number(row.quantity ?? "0");
      const stockQuantity = Number(row.stock_quantity ?? "0");
      if (row.track_inventory && !row.allow_backorder && stockQuantity < requested) {
        throw new Error(`OUT_OF_STOCK:${row.product_name}`);
      }
    }

    const orderResult = await execute<OrderRow>(
      `
        INSERT INTO commerce_orders (
          order_number,
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          status,
          payment_status,
          fulfillment_status,
          currency,
          subtotal_amount,
          discount_amount,
          shipping_amount,
          total_amount,
          shipping_name,
          shipping_phone,
          shipping_line1,
          shipping_line2,
          shipping_ward,
          shipping_district,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          notes,
          affiliate_user_id,
          affiliate_code,
          paid_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
          ${autoApprove ? "NOW()" : "NULL"}
        )
        RETURNING *
      `,
      [
        orderNumber,
        input.userId,
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        status,
        paymentStatus,
        fulfillmentStatus,
        settings.ecommerce.currency,
        subtotalAmount,
        shippingAmount,
        totalAmount,
        shippingName,
        shippingPhone,
        shippingLine1,
        shippingLine2,
        shippingWard,
        shippingDistrict,
        shippingCity,
        shippingPostalCode,
        shippingCountry,
        input.notes?.trim() ?? "",
        affiliateAccount?.userId ?? null,
        affiliateAccount?.code ?? null,
      ]
    );

    const createdOrder = orderResult.rows[0];

    for (const item of cartItems) {
      await execute(
        `
          INSERT INTO commerce_order_items (
            order_id,
            product_id,
            product_name,
            product_slug,
            product_type,
            fulfillment_type,
            quantity,
            unit_price,
            line_total
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          createdOrder.id,
          item.productId,
          item.productName,
          item.productSlug,
          item.productType,
          item.fulfillmentType,
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]
      );

      if (item.productId) {
        await execute(
          `
            UPDATE general_products
            SET
              stock_quantity = CASE
                WHEN track_inventory THEN stock_quantity - $2
                ELSE stock_quantity
              END,
              updated_at = NOW()
            WHERE product_id = $1
          `,
          [item.productId, item.quantity]
        );
      }
    }

    await execute(
      `
        INSERT INTO commerce_payments (order_id, method, provider, amount, status, external_ref, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, ${autoApprove ? "NOW()" : "NULL"})
      `,
      [
        createdOrder.id,
        input.paymentMethod,
        paymentProvider,
        totalAmount,
        autoApprove ? "paid" : "pending",
        `PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
      ]
    );

    if (requiresShipping) {
      await execute(
        `
          INSERT INTO commerce_shipments (order_id, status)
          VALUES ($1, 'pending')
          ON CONFLICT (order_id) DO NOTHING
        `,
        [createdOrder.id]
      );
    }

    await execute("DELETE FROM shopping_cart_items WHERE user_id = $1", [input.userId]);

    return createdOrder.id;
  });

  await ensureEntitlementsForOrder(order);
  return (await loadOrderBundleById(order))!;
}

export async function listOrdersForUser(userId: string): Promise<EcommerceOrder[]> {
  const ordersResult = await query<OrderRow>(
    "SELECT * FROM commerce_orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );

  const orders = await Promise.all(ordersResult.rows.map((row) => loadOrderBundleById(row.id)));
  return orders.filter(Boolean) as EcommerceOrder[];
}

export async function getOrderByIdForUser(userId: string, orderId: string): Promise<EcommerceOrder | null> {
  const result = await query<OrderRow>(
    "SELECT * FROM commerce_orders WHERE id = $1 AND user_id = $2 LIMIT 1",
    [orderId, userId]
  );
  if (!result.rows[0]) return null;
  return loadOrderBundleById(orderId);
}

export async function getOrderByNumberForUser(userId: string, orderNumber: string): Promise<EcommerceOrder | null> {
  const result = await query<OrderRow>(
    "SELECT * FROM commerce_orders WHERE order_number = $1 AND user_id = $2 LIMIT 1",
    [orderNumber, userId]
  );
  if (!result.rows[0]) return null;
  return loadOrderBundleById(result.rows[0].id);
}

export async function listAllOrders(): Promise<EcommerceOrder[]> {
  const result = await query<OrderRow>("SELECT * FROM commerce_orders ORDER BY created_at DESC");
  const orders = await Promise.all(result.rows.map((row) => loadOrderBundleById(row.id)));
  return orders.filter(Boolean) as EcommerceOrder[];
}

export async function listAllPayments(): Promise<EcommercePayment[]> {
  const result = await query<PaymentRow>("SELECT * FROM commerce_payments ORDER BY created_at DESC");
  return result.rows.map(mapPaymentRow);
}

export async function getPaymentById(paymentId: string): Promise<EcommercePayment | null> {
  const result = await query<PaymentRow>("SELECT * FROM commerce_payments WHERE id = $1 LIMIT 1", [paymentId]);
  return result.rows[0] ? mapPaymentRow(result.rows[0]) : null;
}

export async function listAllShipments(): Promise<EcommerceShipment[]> {
  const result = await query<ShipmentRow>("SELECT * FROM commerce_shipments ORDER BY updated_at DESC");
  return result.rows.map(mapShipmentRow);
}

export async function getOrderById(orderId: string): Promise<EcommerceOrder | null> {
  return loadOrderBundleById(orderId);
}

export async function adminUpdateOrderState(input: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  notes?: string;
}) {
  await query(
    `
      UPDATE commerce_orders
      SET
        status = $2,
        payment_status = $3,
        fulfillment_status = $4,
        notes = $5,
        paid_at = CASE WHEN $3 = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        completed_at = CASE WHEN $2 = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
        cancelled_at = CASE WHEN $2 = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [input.orderId, input.status, input.paymentStatus, input.fulfillmentStatus, input.notes?.trim() ?? ""]
  );

  await ensureEntitlementsForOrder(input.orderId);
}

export async function adminUpdatePaymentState(input: {
  paymentId: string;
  status: EcommercePayment["status"];
  externalRef?: string;
}) {
  const paymentResult = await query<PaymentRow>(
    `
      UPDATE commerce_payments
      SET
        status = $2,
        external_ref = $3,
        paid_at = CASE WHEN $2 = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [input.paymentId, input.status, input.externalRef?.trim() ?? null]
  );

  const payment = paymentResult.rows[0];
  if (!payment) return;

  const order = await loadOrderBundleById(payment.order_id);
  if (!order) return;

  const nextPaymentStatus: PaymentStatus =
    input.status === "paid" ? "paid" : input.status === "refunded" ? "refunded" : input.status === "failed" ? "failed" : "pending";
  const nextStatus = getOrderStatusFromState(nextPaymentStatus, order.fulfillmentStatus);

  await query(
    `
      UPDATE commerce_orders
      SET
        payment_status = $2,
        status = $3,
        paid_at = CASE WHEN $2 = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        updated_at = NOW()
      WHERE id = $1
    `,
    [payment.order_id, nextPaymentStatus, nextStatus]
  );

  await ensureEntitlementsForOrder(payment.order_id);
}

export async function applyGatewayPaymentResult(input: {
  paymentId: string;
  provider: string;
  amount: number;
  status: EcommercePayment["status"];
  externalRef?: string;
}) {
  const paymentResult = await query<PaymentRow>(
    "SELECT * FROM commerce_payments WHERE id = $1 AND provider = $2 LIMIT 1",
    [input.paymentId, input.provider]
  );
  const payment = paymentResult.rows[0];

  if (!payment) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (Number(payment.amount) !== input.amount) {
    return { ok: false as const, reason: "invalid_amount" as const };
  }

  if (payment.status === "paid" || payment.status === "refunded") {
    return { ok: true as const, alreadyProcessed: true, orderId: payment.order_id };
  }

  await adminUpdatePaymentState({
    paymentId: payment.id,
    status: input.status,
    externalRef: input.externalRef,
  });

  return { ok: true as const, alreadyProcessed: false, orderId: payment.order_id };
}

export async function adminUpdateShipmentState(input: {
  orderId: string;
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
}) {
  await query(
    `
      INSERT INTO commerce_shipments (order_id, carrier, tracking_number, status, notes, shipped_at, delivered_at)
      VALUES (
        $1, $2, $3, $4, $5,
        CASE WHEN $4 = 'shipped' THEN NOW() ELSE NULL END,
        CASE WHEN $4 = 'delivered' THEN NOW() ELSE NULL END
      )
      ON CONFLICT (order_id)
      DO UPDATE SET
        carrier = EXCLUDED.carrier,
        tracking_number = EXCLUDED.tracking_number,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        shipped_at = CASE
          WHEN EXCLUDED.status = 'shipped' AND commerce_shipments.shipped_at IS NULL THEN NOW()
          ELSE commerce_shipments.shipped_at
        END,
        delivered_at = CASE
          WHEN EXCLUDED.status = 'delivered' AND commerce_shipments.delivered_at IS NULL THEN NOW()
          ELSE commerce_shipments.delivered_at
        END,
        updated_at = NOW()
    `,
    [
      input.orderId,
      input.carrier?.trim() ?? "",
      input.trackingNumber?.trim() ?? "",
      input.status,
      input.notes?.trim() ?? "",
    ]
  );

  const order = await loadOrderBundleById(input.orderId);
  if (!order) return;

  const fulfillmentStatus: FulfillmentStatus =
    input.status === "delivered"
      ? "delivered"
      : input.status === "shipped"
        ? "shipped"
        : input.status === "packing"
          ? "processing"
          : input.status === "cancelled"
            ? "cancelled"
            : "pending";

  const status = getOrderStatusFromState(order.paymentStatus, fulfillmentStatus);
  await query(
    `
      UPDATE commerce_orders
      SET fulfillment_status = $2, status = $3, updated_at = NOW()
      WHERE id = $1
    `,
    [input.orderId, fulfillmentStatus, status]
  );
}
