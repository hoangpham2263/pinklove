"use client";

import Link from "next/link";
import { useState } from "react";
import { Banknote, CreditCard, Eye, Landmark, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  getPaymentMethodCategoryLabel,
  getPaymentMethodTypeLabel,
  getRequiresShippingLabel,
} from "@/features/ecommerce/admin/payment-method-labels";
import { ROUTES } from "@/lib/routes";
import type { EcommercePaymentMethodSettings } from "@/lib/system-settings";

type PaymentMethodsTableProps = {
  methods: EcommercePaymentMethodSettings[];
};

const METHOD_CATEGORY_ORDER: Array<EcommercePaymentMethodSettings["category"]> = ["manual", "offline", "gateway"];

const METHOD_CATEGORY_ICONS = {
  manual: Landmark,
  offline: Banknote,
  gateway: CreditCard,
};

export function PaymentMethodsTable({ methods }: PaymentMethodsTableProps) {
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const previewMethod = previewCode ? methods.find((method) => method.code === previewCode) ?? null : null;
  const methodGroups = METHOD_CATEGORY_ORDER.map((category) => ({
    category,
    methods: methods.filter((method) => method.category === category),
  }));
  const enabledCount = methods.filter((method) => method.enabled).length;
  const stats = [
    {
      key: "all",
      label: "Tất cả phương thức",
      total: methods.length,
      enabled: enabledCount,
      Icon: CreditCard,
    },
    ...methodGroups.map((group) => ({
      key: group.category,
      label: getPaymentMethodCategoryLabel(group.category),
      total: group.methods.length,
      enabled: group.methods.filter((method) => method.enabled).length,
      Icon: METHOD_CATEGORY_ICONS[group.category],
    })),
  ];

  return (
    <>
      <div className="space-y-5 lg:cspace-y-7.5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.Icon;
            return (
              <div key={item.key} className="rounded-md border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{item.total}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.enabled} đang bật</p>
              </div>
            );
          })}
        </div>

        {methodGroups.map((group) => {
          const Icon = METHOD_CATEGORY_ICONS[group.category];

          return (
            <div key={group.category} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{getPaymentMethodCategoryLabel(group.category)}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{group.methods.length} phương thức</Badge>
                  <Button
                    variant="outline"
                    render={
                      <Link href={`${ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW}?category=${group.category}`}>
                        <Plus className="h-4 w-4" />
                        Thêm
                      </Link>
                    }
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Nhà cung cấp</TableHead>
                      <TableHead>Kiểu</TableHead>
                      <TableHead>Điều kiện</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.methods.length > 0 ? (
                      group.methods.map((method) => (
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
                            <form
                              id={`payment-method-toggle-${method.code}`}
                              action={ROUTES.API.ADMIN.PAYMENT_METHODS.SAVE}
                              method="POST"
                              className="flex items-center gap-2"
                            >
                              <input type="hidden" name="intent" value="toggle-enabled" />
                              <input type="hidden" name="code" value={method.code} />
                              <input type="hidden" name="enabled" value={method.enabled ? "off" : "on"} />
                              <Switch
                                checked={method.enabled}
                                aria-label={method.enabled ? "Tắt phương thức thanh toán" : "Bật phương thức thanh toán"}
                                onCheckedChange={(_checked) => {
                                  const form = document.getElementById(`payment-method-toggle-${method.code}`) as HTMLFormElement | null;
                                  form?.requestSubmit();
                                }}
                              />
                            </form>
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
                              <form
                                action={ROUTES.API.ADMIN.PAYMENT_METHODS.DELETE}
                                method="POST"
                                onSubmit={(event) => {
                                  if (!confirm(`Xóa phương thức thanh toán "${method.label}"? Nếu đã có đơn hàng sử dụng, hệ thống sẽ không cho xóa.`)) {
                                    event.preventDefault();
                                  }
                                }}
                              >
                                <input type="hidden" name="code" value={method.code} />
                                <Button
                                  type="submit"
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Xóa phương thức"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                          Chưa có phương thức trong nhóm này.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
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
                  <span className="text-muted-foreground">Nhóm</span>
                  <span>{getPaymentMethodCategoryLabel(previewMethod.category)}</span>
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
