"use client";

import { useMemo, useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name" | "onChange" | "type" | "value"> & {
  name: string;
  defaultValue?: number | string | null;
  value?: number | string | null;
  onValueChange?: (value: number) => void;
};

function normalizeCurrencyInput(value: number | string | null | undefined) {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return "";
    }

    return String(Math.trunc(value));
  }

  const rawValue = String(value ?? "").trim();
  const sanitizedValue = rawValue.replace(/[^\d.,]/g, "");
  const decimalMatch = sanitizedValue.match(/^(.+)([.,])(\d{1,2})$/);
  const wholeValue = decimalMatch ? decimalMatch[1] : sanitizedValue;
  const numericValue = wholeValue.replace(/[^\d]/g, "");

  if (!numericValue) {
    return "";
  }

  return String(Math.max(0, Number(numericValue)));
}

function formatCurrencyInput(value: string) {
  if (!value) {
    return "";
  }

  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function CurrencyInput({
  name,
  defaultValue,
  value,
  onValueChange,
  className,
  disabled,
  required,
  placeholder,
  id,
  ...props
}: CurrencyInputProps) {
  const controlledValue = useMemo(() => normalizeCurrencyInput(value), [value]);
  const [internalValue, setInternalValue] = useState(() => normalizeCurrencyInput(defaultValue));
  const rawValue = value === undefined ? internalValue : controlledValue;

  function updateValue(nextDisplayValue: string) {
    const nextRawValue = normalizeCurrencyInput(nextDisplayValue);

    if (value === undefined) {
      setInternalValue(nextRawValue);
    }

    onValueChange?.(Number(nextRawValue || "0"));
  }

  return (
    <>
      <input type="hidden" name={name} value={rawValue || "0"} />
      <input
        {...props}
        id={id}
        type="text"
        inputMode="numeric"
        value={formatCurrencyInput(rawValue)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(event) => updateValue(event.target.value)}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 transition-colors placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          className
        )}
      />
    </>
  );
}
