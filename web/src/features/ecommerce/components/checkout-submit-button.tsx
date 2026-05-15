"use client";

import { useState } from "react";

type CheckoutSubmitButtonProps = {
  formId: string;
  disabled?: boolean;
};

export function CheckoutSubmitButton({ formId, disabled }: CheckoutSubmitButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    const form = document.getElementById(formId) as HTMLFormElement | null;

    if (!form) return;
    if (!form.reportValidity()) return;

    setPending(true);
    setMessage("");

    try {
      const formData = new FormData(form);
      const paymentMethod = String(formData.get("paymentMethod") ?? "");
      const action = paymentMethod === "pay2s" ? "/api/pay2s/create" : form.action;
      const response = await fetch(action, {
        method: form.method || "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });
      const payload = await response.json().catch(() => null) as { location?: string; message?: string } | null;

      if (response.ok && payload?.location) {
        window.location.assign(payload.location);
        return;
      }

      setMessage(payload?.message || "Không thể thanh toán. Vui lòng thử lại.");

      if (payload?.location) {
        window.location.assign(payload.location);
      }
    } catch {
      setMessage("Không thể kết nối checkout. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="inline-flex h-8 w-full shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 font-medium whitespace-nowrap text-primary-foreground transition-all outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled || pending}
        onClick={handleClick}
      >
        {pending ? "Đang xử lý..." : "Thanh toán"}
      </button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  );
}
