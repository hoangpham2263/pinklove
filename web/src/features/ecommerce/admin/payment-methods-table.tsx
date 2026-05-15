"use client";

import { useState } from"react";
import { Banknote, CreditCard, Landmark } from"lucide-react";
import { toast } from "sonner";

import { Badge } from"@/components/ui/badge";
import { Switch } from"@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from"@/components/ui/table";
import {
  getPaymentMethodCategoryLabel,
  getPaymentMethodTypeLabel,
  getRequiresShippingLabel,
} from"@/features/ecommerce/admin/payment-method-labels";
import { adminApi } from "@/lib/api-client.admin";
import { isCodeManagedPaymentMethod } from "@/lib/payment-methods";
import { ROUTES } from"@/lib/routes";
import type { EcommercePaymentMethodSettings } from"@/lib/system-settings";

type PaymentMethodsTableProps = {
  methods: EcommercePaymentMethodSettings[];
};

const METHOD_CATEGORY_ORDER: Array<EcommercePaymentMethodSettings["category"]> = ["manual","offline","gateway"];

const METHOD_CATEGORY_ICONS = {
  manual: Landmark,
  offline: Banknote,
  gateway: CreditCard,
};

export function PaymentMethodsTable({ methods }: PaymentMethodsTableProps) {
  const [paymentMethods, setPaymentMethods] = useState(methods);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const previewMethod = previewCode ? paymentMethods.find((method) => method.code === previewCode) ?? null : null;
  const previewIsSimple = previewMethod?.category === "manual" || previewMethod?.category === "offline";
  const methodGroups = METHOD_CATEGORY_ORDER.map((category) => ({
    category,
    methods: paymentMethods.filter((method) => method.category === category),
  }));
  const enabledCount = paymentMethods.filter((method) => method.enabled).length;
  const stats = [
    {
      key:"all",
      label:"Tất cả phương thức",
      total: paymentMethods.length,
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

  async function handleToggle(method: EcommercePaymentMethodSettings) {
    const nextEnabled = !method.enabled;
    setPaymentMethods((items) =>
      items.map((item) => (item.code === method.code ? { ...item, enabled: nextEnabled } : item))
    );

    try {
      const formData = new FormData();
      formData.append("intent", "toggle-enabled");
      formData.append("code", method.code);
      formData.append("enabled", nextEnabled ? "on" : "off");
      const result = await adminApi.savePaymentMethod(formData);
      toast.success(result.message ?? (nextEnabled ? "Đã bật phương thức thanh toán." : "Đã tắt phương thức thanh toán."));
    } catch (error) {
      setPaymentMethods((items) =>
        items.map((item) => (item.code === method.code ? { ...item, enabled: method.enabled } : item))
      );
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật phương thức thanh toán.");
    }
  }

  async function handleDelete(method: EcommercePaymentMethodSettings) {
    if (isCodeManagedPaymentMethod(method)) {
      toast.error("Phương thức này được quản lý bằng code. Hãy tắt phương thức thay vì xóa.");
      return;
    }

    if (!confirm(`Xóa phương thức thanh toán "${method.label}"? Nếu đã có đơn hàng sử dụng, hệ thống sẽ không cho xóa.`)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("code", method.code);
      const result = await adminApi.deletePaymentMethod(formData);
      setPaymentMethods((items) => items.filter((item) => item.code !== method.code));
      if (previewCode === method.code) setPreviewCode(null);
      toast.success(result.message ?? "Đã xóa phương thức thanh toán.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa phương thức thanh toán.");
    }
  }

  function getManualPaymentSummary(method: EcommercePaymentMethodSettings) {
    const accountParts = [method.bankName, method.bankAccountNumber, method.bankAccountName].filter(Boolean);
    return accountParts.length > 0 ? accountParts.join(" / ") : "Chưa cấu hình tài khoản nhận";
  }

  function getSimpleMethodSummary(method: EcommercePaymentMethodSettings) {
    if (method.category === "manual") {
      return getManualPaymentSummary(method);
    }

    return method.instructions || "Chưa cấu hình hướng dẫn";
  }

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
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="mt-2">{item.total}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-muted-foreground">{item.enabled} đang bật</p>
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
                    <h3>{getPaymentMethodCategoryLabel(group.category)}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{group.methods.length} phương thức</Badge>
                  {group.category !== "gateway" ? (
                    <AdminCreateLinkButton href={`${ROUTES.ADMIN.CONFIG_PAYMENT_METHOD_NEW}?category=${group.category}`}>
                      Thêm
                    </AdminCreateLinkButton>
                  ) : null}
                </div>
              </div>

              <div className="overflow-x-auto rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    {group.category === "manual" || group.category === "offline" ? (
                      <TableRow>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>{group.category === "manual" ? "Tài khoản nhận" : "Hướng dẫn"}</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead>Kiểu</TableHead>
                        <TableHead>Điều kiện</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {group.methods.length > 0 ? (
                      group.methods.map((method) => (
                        <TableRow key={method.code}>
                          <TableCell>
                            {method.label}
                          </TableCell>
                          {group.category === "manual" || group.category === "offline" ? (
                            <TableCell className="max-w-lg truncate text-muted-foreground">{getSimpleMethodSummary(method)}</TableCell>
                          ) : (
                            <>
                              <TableCell>{method.provider ||"-"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{getPaymentMethodTypeLabel(method.type)}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {getRequiresShippingLabel(method.requiresShipping)}
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={method.enabled}
                                aria-label={method.enabled ?"Tắt phương thức thanh toán" :"Bật phương thức thanh toán"}
                                onCheckedChange={() => void handleToggle(method)}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <AdminTableActions>
                              <AdminTableActionButton action="view" label="Xem nhanh" onClick={() => setPreviewCode(method.code)} />
                              <AdminTableActionButton action="edit" label="Sửa phương thức" href={ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(method.code)} />
                              {!isCodeManagedPaymentMethod(method) ? (
                                <AdminTableActionButton action="delete" label="Xóa phương thức" onClick={() => void handleDelete(method)} />
                              ) : null}
                            </AdminTableActions>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={group.category === "manual" || group.category === "offline" ? 4 : 6} className="h-20 text-center text-muted-foreground">
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
              <div className="grid gap-3">
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Code</span>
                  <code>{previewMethod.code}</code>
                </div>
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Nhóm</span>
                  <span>{getPaymentMethodCategoryLabel(previewMethod.category)}</span>
                </div>
                {!previewIsSimple ? (
                  <>
                    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                      <span className="text-muted-foreground">Provider</span>
                      <span>{previewMethod.provider ||"-"}</span>
                    </div>
                    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                      <span className="text-muted-foreground">Kiểu</span>
                      <span>{getPaymentMethodTypeLabel(previewMethod.type)}</span>
                    </div>
                    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                      <span className="text-muted-foreground">Điều kiện</span>
                      <span>{getRequiresShippingLabel(previewMethod.requiresShipping)}</span>
                    </div>
                  </>
                ) : null}
                <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span>{previewMethod.enabled ?"Đang bật" :"Đang tắt"}</span>
                </div>
                {!previewIsSimple ? (
                  <div className="space-y-1 border-t pt-3">
                    <p className="text-muted-foreground">Mô tả checkout</p>
                    <p>{previewMethod.description ||"-"}</p>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-muted-foreground">Hướng dẫn</p>
                  <p className="whitespace-pre-wrap">{previewMethod.instructions ||"-"}</p>
                </div>
                {previewMethod.bankName || previewMethod.bankAccountNumber || previewMethod.bankAccountName ? (
                  <div className="space-y-2 border-t pt-3">
                    <p>Thông tin nhận thanh toán</p>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Ngân hàng</span>
                        <span>{previewMethod.bankName ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">VietQR</span>
                        <span>{previewMethod.bankQrBankId ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Số tài khoản</span>
                        <span>{previewMethod.bankAccountNumber ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Chủ tài khoản</span>
                        <span>{previewMethod.bankAccountName ||"-"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                {previewMethod.provider ==="pay2s" ? (
                  <div className="space-y-2 border-t pt-3">
                    <p>Pay2S</p>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Endpoint</span>
                        <span className="break-all">{previewMethod.pay2sEndpoint ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Partner Code</span>
                        <span>{previewMethod.pay2sPartnerCode ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Access Key</span>
                        <span>{previewMethod.pay2sAccessKey ?"Đã cấu hình" :"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Secret Key</span>
                        <span>{previewMethod.pay2sSecretKey ?"Đã cấu hình" :"-"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                {previewMethod.provider ==="vnpay" ? (
                  <div className="space-y-2 border-t pt-3">
                    <p>VNPAY</p>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Payment URL</span>
                        <span className="break-all">{previewMethod.vnpayPaymentUrl ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">TMN Code</span>
                        <span>{previewMethod.vnpayTmnCode ||"-"}</span>
                      </div>
                      <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
                        <span className="text-muted-foreground">Hash Secret</span>
                        <span>{previewMethod.vnpayHashSecret ?"Đã cấu hình" :"-"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-end pt-2">
                  <AdminLinkButton href={ROUTES.ADMIN.CONFIG_PAYMENT_METHOD(previewMethod.code)}>Sửa chi tiết</AdminLinkButton>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
