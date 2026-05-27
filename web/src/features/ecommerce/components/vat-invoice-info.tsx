import type { EcommerceVatInvoiceInfo } from "@/features/ecommerce/types";

type VatInvoiceInfoProps = {
  info?: EcommerceVatInvoiceInfo | null;
};

export function VatInvoiceInfo({ info }: VatInvoiceInfoProps) {
  if (!info) {
    return (
      <p className="text-sm text-muted-foreground">
        Đơn hàng này đã ghi nhận yêu cầu xuất hóa đơn VAT. Đội ngũ sẽ liên hệ để xác nhận thông tin xuất hóa đơn.
      </p>
    );
  }

  const rows = [
    ["Tên công ty / đơn vị", info.companyName],
    ["Mã số thuế", info.taxCode],
    ["Địa chỉ xuất hóa đơn", info.companyAddress],
    ["Email nhận hóa đơn", info.invoiceEmail],
    ["Người nhận / bộ phận", info.buyerName],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <dl className="grid gap-3 text-sm md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className={label === "Địa chỉ xuất hóa đơn" ? "md:col-span-2" : undefined}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="mt-1 font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
