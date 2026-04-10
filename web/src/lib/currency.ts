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

export function formatCurrency(value: number, config?: Partial<CurrencyFormatConfig>) {
  const formatConfig = { ...DEFAULT_CURRENCY_FORMAT, ...config };
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const [wholePartRaw, decimalPartRaw] = absoluteValue.toFixed(2).split(".");
  const wholePart = wholePartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, formatConfig.thousandSeparator);
  const hasDecimal = Number(decimalPartRaw) > 0;
  const decimalPart = hasDecimal ? `${formatConfig.decimalSeparator}${decimalPartRaw}` : "";
  const amount = `${wholePart}${decimalPart}`;
  const sign = isNegative ? "-" : "";

  return `${sign}${amount} ${formatConfig.currencySymbol}`.trim();
}
