import type { EcommerceSettings } from "@/lib/system-settings";

type CurrencyFormatConfig = Pick<
  EcommerceSettings,
  "currency" | "currencySymbol" | "thousandSeparator" | "decimalSeparator"
>;

const DEFAULT_CURRENCY_FORMAT: CurrencyFormatConfig = {
  currency: "VND",
  currencySymbol: "₫",
  thousandSeparator: ".",
  decimalSeparator: ",",
};

export function formatCurrency(value: number | string | null | undefined, config?: Partial<CurrencyFormatConfig>) {
  const formatConfig = { ...DEFAULT_CURRENCY_FORMAT, ...config };
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const isNegative = safeValue < 0;
  const absoluteValue = Math.abs(safeValue);
  const [wholePartRaw, decimalPartRaw] = absoluteValue.toFixed(2).split(".");
  const wholePart = wholePartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, formatConfig.thousandSeparator);
  const hasDecimal = Number(decimalPartRaw) > 0;
  const decimalPart = hasDecimal ? `${formatConfig.decimalSeparator}${decimalPartRaw}` : "";
  const amount = `${wholePart}${decimalPart}`;
  const sign = isNegative ? "-" : "";

  return `${sign}${amount} ${formatConfig.currencySymbol}`.trim();
}

export function formatVnd(value: number | string | null | undefined) {
  return formatCurrency(value, DEFAULT_CURRENCY_FORMAT);
}

export function formatCompactVnd(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const sign = safeValue < 0 ? "-" : "";
  const absoluteValue = Math.abs(safeValue);

  if (absoluteValue >= 1_000_000_000) {
    return `${sign}${(absoluteValue / 1_000_000_000).toFixed(1)}B ${DEFAULT_CURRENCY_FORMAT.currencySymbol}`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${sign}${(absoluteValue / 1_000_000).toFixed(1)}M ${DEFAULT_CURRENCY_FORMAT.currencySymbol}`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}${(absoluteValue / 1_000).toFixed(1)}K ${DEFAULT_CURRENCY_FORMAT.currencySymbol}`;
  }

  return formatVnd(safeValue);
}
