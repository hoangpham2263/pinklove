"use client";

import { useEffect, useRef } from "react";
import { Banknote, CreditCard, QrCode, WalletCards } from "lucide-react";

import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";

const STORAGE_KEY = "pinklove.checkout.paymentMethod";

type CheckoutPaymentMethodPickerProps = {
  methods: EcommercePaymentMethodSettings[];
};

function PaymentMethodMark({ provider, type }: { provider: string; type: string }) {
  const Icon =
    provider === "manual_bank_transfer" || provider === "pay2s"
      ? QrCode
      : provider === "cash" || type === "offline"
        ? Banknote
        : provider === "vnpay"
          ? CreditCard
          : WalletCards;

  return (
    <span className="flex size-7.5 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-foreground">
      <Icon className="size-5" />
    </span>
  );
}

export function CheckoutPaymentMethodPicker({ methods }: CheckoutPaymentMethodPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedCode = window.localStorage.getItem(STORAGE_KEY) ?? "";
    const codes = new Set(methods.map((method) => method.code));
    const nextCode = codes.has(storedCode) ? storedCode : methods[0]?.code ?? "";
    const radio = containerRef.current?.querySelector<HTMLInputElement>(
      `input[name="paymentMethod"][value="${CSS.escape(nextCode)}"]`
    );

    if (radio) radio.checked = true;
    if (containerRef.current) containerRef.current.style.visibility = "visible";
  }, [methods]);

  const handleSelect = (code: string) => {
    window.localStorage.setItem(STORAGE_KEY, code);
  };

  return (
    <div ref={containerRef} className="space-y-3" style={{ visibility: "hidden" }}>
      {methods.map((method) => (
        <label
          key={method.code}
          className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition hover:bg-muted/30"
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.code}
            required
            onChange={() => handleSelect(method.code)}
            form="checkout-form"
            className="mt-0"
          />
          <PaymentMethodMark provider={method.provider} type={method.type} />
          <span className="min-w-0 font-medium">{method.label}</span>
        </label>
      ))}
    </div>
  );
}
