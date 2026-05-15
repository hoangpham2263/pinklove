"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type Pay2SCheckoutButtonProps = {
  orderId?: string;
  paymentId?: string;
  amount?: number;
  className?: string;
  children?: ReactNode;
};

export function Pay2SCheckoutButton({
  orderId,
  paymentId,
  amount,
  className,
  children = "Thanh toán Pay2S",
}: Pay2SCheckoutButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const createPayment = async () => {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/pay2s/create", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, paymentId, amount }),
      });
      const payload = await response.json().catch(() => null) as { paymentUrl?: string; location?: string; message?: string } | null;
      const location = payload?.paymentUrl || payload?.location;

      if (response.ok && location) {
        window.location.assign(location);
        return;
      }

      setMessage(payload?.message || "Không thể tạo thanh toán Pay2S.");
    } catch {
      setMessage("Không thể kết nối Pay2S. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className || "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"}
        disabled={pending || (!orderId && !paymentId)}
        onClick={createPayment}
      >
        {pending ? "Đang xử lý..." : children}
      </button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}
