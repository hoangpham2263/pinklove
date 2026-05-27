"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VatInvoiceRequestCardProps = {
  title?: string;
  description?: string;
};

export function VatInvoiceRequestCard({
  title = "Hóa đơn VAT",
  description = "",
}: VatInvoiceRequestCardProps) {
  return (
    <Card className="border-rose-100 bg-white/90 shadow-sm backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <VatInvoiceRequestFields />
      </CardContent>
    </Card>
  );
}

export function VatInvoiceRequestFields() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="requestVatInvoice"
          className="size-4 rounded border-input text-primary"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        <span className="font-medium">Yêu cầu xuất hóa đơn VAT</span>
      </label>

      {enabled ? (
        <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên công ty / đơn vị</label>
            <input
              type="text"
              name="vatCompanyName"
              required={enabled}
              disabled={!enabled}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="Công ty TNHH ABC"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mã số thuế</label>
            <input
              type="text"
              name="vatTaxCode"
              required={enabled}
              disabled={!enabled}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="0312345678"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Địa chỉ xuất hóa đơn</label>
            <input
              type="text"
              name="vatCompanyAddress"
              required={enabled}
              disabled={!enabled}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email nhận hóa đơn</label>
            <input
              type="email"
              name="vatInvoiceEmail"
              required={enabled}
              disabled={!enabled}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="ketoan@congty.vn"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Người nhận / bộ phận</label>
            <input
              type="text"
              name="vatBuyerName"
              disabled={!enabled}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="Nguyễn Văn A / Phòng kế toán"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
