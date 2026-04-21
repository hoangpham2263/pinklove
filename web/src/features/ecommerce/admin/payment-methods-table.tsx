"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPaymentMethodTypeLabel, getRequiresShippingLabel } from "@/features/ecommerce/admin/payment-method-labels";
import { ROUTES } from "@/lib/routes";
import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";

type PaymentMethodsTableProps = {
  methods: EcommercePaymentMethodSettings[];
};

export function PaymentMethodsTable({ methods }: PaymentMethodsTableProps) {
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const previewMethod = previewCode ? methods.find((method) => method.code === previewCode) ?? null : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Phương thức thanh toán</h2>
            <p className="text-sm text-muted-foreground">
              Quản lý từng phương thức ở bảng riêng, xem nhanh hoặc mở trang sửa chi tiết.
            </p>
          </div>
          <Button render={<Link href={ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW}><Plus className="h-4 w-4" />Thêm phương thức</Link>} />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phương thức</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Kiểu</TableHead>
                <TableHead>Điều kiện</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length > 0 ? (
                methods.map((method) => (
                  <TableRow key={method.code}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{method.label}</p>
                        <code className="text-xs text-muted-foreground">{method.code}</code>
                      </div>
                    </TableCell>
                    <TableCell>{method.provider || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getPaymentMethodTypeLabel(method.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getRequiresShippingLabel(method.requiresShipping)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={method.enabled ? "default" : "secondary"}>
                        {method.enabled ? "Đang bật" : "Đang tắt"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Xem nhanh"
                          onClick={() => setPreviewCode(method.code)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Link
                          href={ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(method.code)}
                          title="Sửa phương thức"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Chưa có phương thức thanh toán nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(previewMethod)} onOpenChange={(open) => !open && setPreviewCode(null)}>
        <DialogContent>
          {previewMethod ? (
            <>
              <DialogHeader>
                <DialogTitle>{previewMethod.label}</DialogTitle>
                <DialogDescription>Xem nhanh cấu hình phương thức thanh toán.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Code</span>
                  <code>{previewMethod.code}</code>
                </div>
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Provider</span>
                  <span>{previewMethod.provider || "-"}</span>
                </div>
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Kiểu</span>
                  <span>{getPaymentMethodTypeLabel(previewMethod.type)}</span>
                </div>
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Điều kiện</span>
                  <span>{getRequiresShippingLabel(previewMethod.requiresShipping)}</span>
                </div>
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span>{previewMethod.enabled ? "Đang bật" : "Đang tắt"}</span>
                </div>
                <div className="space-y-1 border-t pt-3">
                  <p className="text-muted-foreground">Mô tả checkout</p>
                  <p>{previewMethod.description || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Hướng dẫn</p>
                  <p className="whitespace-pre-wrap">{previewMethod.instructions || "-"}</p>
                </div>
                {previewMethod.bankName || previewMethod.bankAccountNumber || previewMethod.bankAccountName ? (
                  <div className="space-y-2 border-t pt-3">
                    <p className="font-medium">Thông tin nhận thanh toán</p>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Ngân hàng</span>
                        <span>{previewMethod.bankName || "-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">VietQR</span>
                        <span>{previewMethod.bankQrBankId || "-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Số tài khoản</span>
                        <span>{previewMethod.bankAccountNumber || "-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Chủ tài khoản</span>
                        <span>{previewMethod.bankAccountName || "-"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-end pt-2">
                  <Button render={<Link href={ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(previewMethod.code)}>Sửa chi tiết</Link>} />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
