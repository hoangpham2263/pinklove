"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api-client.admin";
import type { AdminOrderStateSnapshot } from "@/lib/api-client.admin";
import { getFulfillmentStatusLabel, getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/status-labels";
import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/features/ecommerce/types";

const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "ready_to_ship",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "pending", "paid", "failed", "refunded"];
const FULFILLMENT_STATUSES: FulfillmentStatus[] = ["not_required", "pending", "processing", "shipped", "delivered", "cancelled"];

type AdminOrderStatePanelProps = {
  orderId: string;
  detailUrl: string;
  initialOrder: AdminOrderStateSnapshot;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function AdminOrderStatePanel({ orderId, detailUrl, initialOrder }: AdminOrderStatePanelProps) {
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialOrder.paymentStatus);
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(initialOrder.fulfillmentStatus);
  const [notes, setNotes] = useState(initialOrder.notes);
  const [isSaving, setIsSaving] = useState(false);

  async function loadOrder() {
    const data = await adminApi.fetchAdminOrderState(detailUrl);
    setOrder(data);
    setStatus(data.status);
    setPaymentStatus(data.paymentStatus);
    setFulfillmentStatus(data.fulfillmentStatus);
    setNotes(data.notes);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("orderId", orderId);
      formData.set("status", status);
      formData.set("paymentStatus", paymentStatus);
      formData.set("fulfillmentStatus", fulfillmentStatus);
      formData.set("notes", notes);

      const result = await adminApi.updateOrderState(formData);
      toast.success(result.message ? String(result.message) : "Da cap nhat trang thai don hang.");
      await loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Khong the cap nhat trang thai don hang.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Cap nhat gan nhat: {formatDateTime(order.updatedAt)}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium">Trang thai don</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getOrderStatusLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Trang thai thanh toan</label>
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getPaymentStatusLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Fulfillment</label>
          <select
            value={fulfillmentStatus}
            onChange={(event) => setFulfillmentStatus(event.target.value as FulfillmentStatus)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {FULFILLMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getFulfillmentStatusLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-medium">Ghi chu</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? "Dang luu..." : "Luu trang thai don"}
        </Button>
      </form>
    </div>
  );
}
