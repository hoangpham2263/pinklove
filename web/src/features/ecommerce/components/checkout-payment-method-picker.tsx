"use client";

import { useEffect, useRef } from "react";
import { Banknote, CreditCard, QrCode, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";

const STORAGE_KEY = "pinklove.checkout.paymentMethod";

type CheckoutPaymentMethodPickerProps = {
  methods: EcommercePaymentMethodSettings[];
  formId?: string;
};

type PaymentMethodCardProps = {
  methods: EcommercePaymentMethodSettings[];
  formId?: string;
  title?: string;
  emptyMessage?: string;
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
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-foreground">
      <Icon className="size-4.5" />
    </span>
  );
}

export function PaymentMethodCard({
  methods,
  formId = "checkout-form",
  title = "Phương thức thanh toán",
  emptyMessage = "Chưa có phương thức thanh toán nào đang bật trong admin.",
}: PaymentMethodCardProps) {
  return (
    <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {methods.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <CheckoutPaymentMethodPicker methods={methods} formId={formId} />
        )}
      </CardContent>
    </Card>
  );
}

export function CheckoutPaymentMethodPicker({ methods, formId = "checkout-form" }: CheckoutPaymentMethodPickerProps) {
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
    <div ref={containerRef} className="space-y-2" style={{ visibility: "hidden" }}>
      {methods.map((method) => (
        <label
          key={method.code}
          className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 transition hover:bg-muted/30 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/5"
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.code}
            required
            onChange={() => handleSelect(method.code)}
            form={formId}
            className="mt-0 size-4"
          />
          <PaymentMethodMark provider={method.provider} type={method.type} />
          <span className="min-w-0 text-sm font-medium">{method.label}</span>
        </label>
      ))}
    </div>
  );
}
