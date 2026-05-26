"use client";

import type React from "react";
import { CheckCircle2, RotateCcw, ShieldAlert, X, XCircle } from "lucide-react";

import { CurrencyInput } from "@/components/common/currency-input";
import { NativeForm } from "@/components/common/native-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminTableActionTrigger, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import {
  getOfferingProviderSupplierSourceLabel,
  getOfferingProviderSupplierStatusLabel,
  getProviderOfferingSupplierRequestStatusLabel,
} from "@/features/provider-offering-submissions/labels";
import type { OfferingProviderSupplier, ProviderOfferingSupplierRequest } from "@/features/provider-offering-submissions/types";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 text-sm md:grid-cols-2">{children}</div>;
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-h-9 rounded-md bg-muted/40 px-3 py-2">{value || "-"}</div>
    </div>
  );
}

function SubmitStatusButton({
  children,
  name = "nextStatus",
  value,
  variant = "outline",
}: {
  children: React.ReactNode;
  name?: string;
  value: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Button type="submit" name={name} value={value} variant={variant} className="gap-2">
      {children}
    </Button>
  );
}

export function SupplierRequestActions({ request }: { request: ProviderOfferingSupplierRequest }) {
  return (
    <AdminTableActions>
      <Dialog>
        <AdminTableActionTrigger action="view" label="Xem yêu cầu supplier" />
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin đăng ký cung ứng</DialogTitle>
            <DialogDescription>{request.providerDisplayName} - {request.offeringName}</DialogDescription>
          </DialogHeader>
          <InfoGrid>
            <InfoField label="Nhà cung cấp" value={`${request.providerDisplayName} (${request.providerUsername})`} />
            <InfoField label="Sản phẩm" value={request.offeringName} />
            <InfoField label="Giá nhập" value={formatVnd(request.purchaseCost)} />
            <InfoField label="Giá bán hiện tại" value={formatVnd(request.offeringPrice)} />
            <InfoField label="Thời gian xử lý" value={`${request.leadTimeDays} ngày`} />
            <InfoField label="Năng lực" value={`${request.monthlyCapacity}/tháng`} />
            <InfoField label="Khu vực" value={request.serviceArea || "-"} />
            <InfoField label="Trạng thái" value={getProviderOfferingSupplierRequestStatusLabel(request.reviewStatus)} />
          </InfoGrid>
          <InfoField label="Ghi chú provider" value={request.materialNote || request.qualityNote || request.providerNote || "-"} />
          <InfoField label="Ghi chú duyệt" value={request.reviewNote || "-"} />
        </DialogContent>
      </Dialog>

      <Dialog>
        <AdminTableActionTrigger action="edit" label="Duyệt yêu cầu supplier" />
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duyệt đăng ký cung ứng</DialogTitle>
            <DialogDescription>{request.providerDisplayName} - {request.offeringName}</DialogDescription>
          </DialogHeader>
          <NativeForm action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.SUPPLIER_REQUEST_REVIEW(request.id)} method="POST" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá bán admin</label>
              <CurrencyInput
                name="adminSellPrice"
                defaultValue={request.offeringPrice > 0 ? String(request.offeringPrice) : ""}
                className="bg-white"
                placeholder="Giá bán"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú duyệt</label>
              <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm" placeholder="Nhập ghi chú gửi provider" />
            </div>
            <div className="flex flex-wrap gap-2">
              <SubmitStatusButton value="under_review">
                <RotateCcw className="size-4" />
                Đang duyệt
              </SubmitStatusButton>
              <SubmitStatusButton value="approved">
                <CheckCircle2 className="size-4" />
                Duyệt yêu cầu
              </SubmitStatusButton>
              <SubmitStatusButton value="changes_requested">
                <RotateCcw className="size-4" />
                Yêu cầu bổ sung
              </SubmitStatusButton>
              <SubmitStatusButton value="rejected" variant="destructive">
                <XCircle className="size-4" />
                Từ chối
              </SubmitStatusButton>
            </div>
          </NativeForm>
        </DialogContent>
      </Dialog>
    </AdminTableActions>
  );
}

export function SupplierStatusActions({ supplier }: { supplier: OfferingProviderSupplier }) {
  return (
    <AdminTableActions>
      <Dialog>
        <AdminTableActionTrigger action="view" label="Xem supplier" />
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin supplier</DialogTitle>
            <DialogDescription>{supplier.providerDisplayName} - {supplier.offeringName}</DialogDescription>
          </DialogHeader>
          <InfoGrid>
            <InfoField label="Nhà cung cấp" value={`${supplier.providerDisplayName} (${supplier.providerUsername})`} />
            <InfoField label="Sản phẩm" value={supplier.offeringName} />
            <InfoField label="Nguồn" value={getOfferingProviderSupplierSourceLabel(supplier.source)} />
            <InfoField label="Trạng thái" value={getOfferingProviderSupplierStatusLabel(supplier.status)} />
            <InfoField label="Giá nhập" value={formatVnd(supplier.purchaseCost)} />
            <InfoField label="Giá bán hiện tại" value={formatVnd(supplier.offeringPrice)} />
            <InfoField label="Thời gian xử lý" value={`${supplier.leadTimeDays} ngày`} />
            <InfoField label="Năng lực" value={`${supplier.monthlyCapacity}/tháng`} />
          </InfoGrid>
          <InfoField label="Ghi chú chất lượng / trạng thái" value={<span className="whitespace-pre-wrap">{supplier.qualityNote || "-"}</span>} />
        </DialogContent>
      </Dialog>

      <Dialog>
        <AdminTableActionTrigger action="edit" label="Cập nhật trạng thái supplier" />
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái supplier</DialogTitle>
            <DialogDescription>{supplier.providerDisplayName} - {supplier.offeringName}</DialogDescription>
          </DialogHeader>
          <NativeForm action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.SUPPLIER_STATUS(supplier.id)} method="POST" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá bán admin</label>
              <CurrencyInput
                name="adminSellPrice"
                defaultValue={supplier.offeringPrice > 0 ? String(supplier.offeringPrice) : ""}
                className="bg-white"
                placeholder="Giá bán"
              />
              <p className="text-xs text-muted-foreground">Chỉ áp dụng khi kích hoạt supplier.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú lý do thay đổi</label>
              <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm" placeholder="Nhập lý do thay đổi trạng thái" />
            </div>
            <div className="flex flex-wrap gap-2">
              {supplier.status !== "active" ? (
                <SubmitStatusButton value="active">
                  <CheckCircle2 className="size-4" />
                  Kích hoạt
                </SubmitStatusButton>
              ) : null}
              {supplier.status !== "paused" ? (
                <SubmitStatusButton value="paused">
                  <X className="size-4" />
                  Tạm dừng
                </SubmitStatusButton>
              ) : null}
              {supplier.status !== "suspended" ? (
                <SubmitStatusButton value="suspended">
                  <ShieldAlert className="size-4" />
                  Hạn chế
                </SubmitStatusButton>
              ) : null}
              {supplier.status !== "revoked" ? (
                <SubmitStatusButton value="revoked" variant="destructive">
                  <XCircle className="size-4" />
                  Thu hồi
                </SubmitStatusButton>
              ) : null}
            </div>
          </NativeForm>
        </DialogContent>
      </Dialog>
    </AdminTableActions>
  );
}
