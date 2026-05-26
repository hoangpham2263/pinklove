"use client";

import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminDialogPrimaryTrigger, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminTableClearButton, AdminTableSearch, AdminTableSelect, AdminTableToolbar } from "@/features/admin/components/admin-table-controls";
import {
  getOfferingProviderSupplierSourceLabel,
  getOfferingProviderSupplierStatusLabel,
  getProviderOfferingSupplierRequestStatusLabel,
} from "@/features/provider-offering-submissions/labels";
import type {
  AdminProviderSupplySourcingOffering,
  OfferingProviderSupplier,
  OfferingProviderSupplierSource,
  OfferingProviderSupplierStatus,
  ProviderOfferingSupplierRequest,
  ProviderOfferingSupplierRequestStatus,
} from "@/features/provider-offering-submissions/types";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { SupplierRequestActions, SupplierStatusActions } from "./sourcing-table-actions";

type ProviderSourcingListProps = {
  supplierRequests: ProviderOfferingSupplierRequest[];
  suppliers: OfferingProviderSupplier[];
  sourcingOfferings: AdminProviderSupplySourcingOffering[];
  mode?: "all" | "offerings" | "requests" | "suppliers";
};

const REQUEST_STATUS_OPTIONS: Array<{ value: "" | ProviderOfferingSupplierRequestStatus; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "submitted", label: getProviderOfferingSupplierRequestStatusLabel("submitted") },
  { value: "under_review", label: getProviderOfferingSupplierRequestStatusLabel("under_review") },
  { value: "changes_requested", label: getProviderOfferingSupplierRequestStatusLabel("changes_requested") },
  { value: "approved", label: getProviderOfferingSupplierRequestStatusLabel("approved") },
  { value: "rejected", label: getProviderOfferingSupplierRequestStatusLabel("rejected") },
  { value: "archived", label: getProviderOfferingSupplierRequestStatusLabel("archived") },
];

const SUPPLIER_STATUS_OPTIONS: Array<{ value: "" | OfferingProviderSupplierStatus; label: string }> = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "active", label: getOfferingProviderSupplierStatusLabel("active") },
  { value: "paused", label: getOfferingProviderSupplierStatusLabel("paused") },
  { value: "suspended", label: getOfferingProviderSupplierStatusLabel("suspended") },
  { value: "revoked", label: getOfferingProviderSupplierStatusLabel("revoked") },
];

const SUPPLIER_SOURCE_OPTIONS: Array<{ value: "" | OfferingProviderSupplierSource; label: string }> = [
  { value: "", label: "Tất cả nguồn" },
  { value: "admin", label: getOfferingProviderSupplierSourceLabel("admin") },
  { value: "proposal", label: getOfferingProviderSupplierSourceLabel("proposal") },
  { value: "supplier_request", label: getOfferingProviderSupplierSourceLabel("supplier_request") },
];

function includesKeyword(values: unknown[], keyword: string) {
  if (!keyword) {
    return true;
  }

  return values
    .filter((value) => value !== null && value !== undefined)
    .some((value) => String(value).toLowerCase().includes(keyword));
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function ProviderSourcingList({ supplierRequests, suppliers, sourcingOfferings, mode = "all" }: ProviderSourcingListProps) {
  const [offeringSearch, setOfferingSearch] = useState("");
  const [offeringStatus, setOfferingStatus] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatus, setSupplierStatus] = useState("");
  const [supplierSource, setSupplierSource] = useState("");

  const filteredOfferings = useMemo(() => {
    const keyword = offeringSearch.trim().toLowerCase();

    return sourcingOfferings.filter((offering) => {
      const statusValue = offering.allowProviderSupply ? "open" : "closed";
      return (
        (!offeringStatus || statusValue === offeringStatus) &&
        includesKeyword([offering.name, offering.slug, offering.fulfillmentType], keyword)
      );
    });
  }, [offeringSearch, offeringStatus, sourcingOfferings]);

  const filteredRequests = useMemo(() => {
    const keyword = requestSearch.trim().toLowerCase();

    return supplierRequests.filter((request) => {
      return (
        (!requestStatus || request.reviewStatus === requestStatus) &&
        includesKeyword(
          [
            request.providerDisplayName,
            request.providerUsername,
            request.offeringName,
            request.offeringSlug,
            request.providerSku,
            request.serviceArea,
            request.materialNote,
            request.qualityNote,
            request.providerNote,
            request.reviewNote,
          ],
          keyword
        )
      );
    });
  }, [requestSearch, requestStatus, supplierRequests]);

  const filteredSuppliers = useMemo(() => {
    const keyword = supplierSearch.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      return (
        (!supplierStatus || supplier.status === supplierStatus) &&
        (!supplierSource || supplier.source === supplierSource) &&
        includesKeyword(
          [
            supplier.providerDisplayName,
            supplier.providerUsername,
            supplier.offeringName,
            supplier.offeringSlug,
            supplier.providerSku,
            supplier.serviceArea,
            supplier.qualityNote,
          ],
          keyword
        )
      );
    });
  }, [supplierSearch, supplierSource, supplierStatus, suppliers]);

  const hasOfferingFilters = offeringSearch.trim().length > 0 || offeringStatus.length > 0;
  const hasRequestFilters = requestSearch.trim().length > 0 || requestStatus.length > 0;
  const hasSupplierFilters = supplierSearch.trim().length > 0 || supplierStatus.length > 0 || supplierSource.length > 0;

  return (
    <div className="space-y-8">
      {mode === "all" || mode === "offerings" ? <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeader title="Dịch vụ/sản phẩm cần provider" description="Các offering đang bật cho provider đăng ký cung ứng." />
          <Dialog>
            <AdminDialogPrimaryTrigger>Thông báo provider</AdminDialogPrimaryTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Thông báo provider nhận cung ứng</DialogTitle>
                <DialogDescription>Gửi yêu cầu kiểm tra giá nhập, năng lực và điều kiện cung ứng cho một dịch vụ/sản phẩm.</DialogDescription>
              </DialogHeader>
              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.SOURCING_ANNOUNCE} method="POST" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dịch vụ/sản phẩm cần provider</label>
                  <select name="offeringId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Chọn dịch vụ/sản phẩm</option>
                    {sourcingOfferings.map((offering) => (
                      <option key={offering.id} value={offering.id}>
                        {offering.name} - {formatVnd(offering.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Yêu cầu cần kiểm tra</label>
                  <textarea
                    name="note"
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Giá nhập, chất liệu, năng lực/tháng, khu vực, thời gian xử lý..."
                  />
                </div>
                <AdminSubmitButton type="submit">Gửi thông báo</AdminSubmitButton>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <AdminTableToolbar>
          <AdminTableSearch value={offeringSearch} onChange={setOfferingSearch} placeholder="Tìm theo tên, slug, fulfillment..." />
          <AdminTableSelect
            value={offeringStatus}
            label="Lọc trạng thái mở nguồn"
            onChange={setOfferingStatus}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "open", label: "Đang mở" },
              { value: "closed", label: "Chưa mở" },
            ]}
          />
          <AdminTableClearButton
            visible={hasOfferingFilters}
            onClick={() => {
              setOfferingSearch("");
              setOfferingStatus("");
            }}
          />
        </AdminTableToolbar>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Dịch vụ/sản phẩm</TableHead>
                <TableHead className="text-right font-medium">Giá bán</TableHead>
                <TableHead className="text-right font-medium">Đang chờ</TableHead>
                <TableHead className="text-right font-medium">Đã duyệt</TableHead>
                <TableHead className="font-medium">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOfferings.length > 0 ? (
                filteredOfferings.map((offering) => (
                  <TableRow key={offering.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{offering.name}</p>
                        <p className="text-xs text-muted-foreground">/{offering.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatVnd(offering.price)}</TableCell>
                    <TableCell className="text-right">{offering.openRequestCount}</TableCell>
                    <TableCell className="text-right">{offering.approvedSupplierCount}</TableCell>
                    <TableCell>{offering.allowProviderSupply ? "Đang mở" : "Chưa mở"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Không có dịch vụ/sản phẩm phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section> : null}

      {mode === "all" || mode === "requests" ? <section className="space-y-4">
        <SectionHeader title="Provider đăng ký cung ứng" />
        <AdminTableToolbar>
          <AdminTableSearch value={requestSearch} onChange={setRequestSearch} placeholder="Tìm provider, dịch vụ/sản phẩm, SKU, ghi chú..." />
          <AdminTableSelect value={requestStatus} label="Lọc trạng thái yêu cầu" onChange={setRequestStatus} options={REQUEST_STATUS_OPTIONS} />
          <AdminTableClearButton
            visible={hasRequestFilters}
            onClick={() => {
              setRequestSearch("");
              setRequestStatus("");
            }}
          />
        </AdminTableToolbar>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Nhà cung cấp</TableHead>
                <TableHead className="font-medium">Mẫu</TableHead>
                <TableHead className="text-right font-medium">Giá nhập</TableHead>
                <TableHead className="text-right font-medium">Giá bán</TableHead>
                <TableHead className="text-right font-medium">Thời gian</TableHead>
                <TableHead className="text-right font-medium">Năng lực</TableHead>
                <TableHead className="font-medium">Trạng thái</TableHead>
                <TableHead className="font-medium">Ghi chú</TableHead>
                <TableHead className="text-right font-medium">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request.id} className="align-top">
                    <TableCell>
                      <div className="space-y-1">
                        <p>{request.providerDisplayName}</p>
                        <p className="text-xs text-muted-foreground">{request.providerUsername}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{request.offeringName}</p>
                        <p className="text-xs text-muted-foreground">/{request.offeringSlug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatVnd(request.purchaseCost)}</TableCell>
                    <TableCell className="text-right">{formatVnd(request.offeringPrice)}</TableCell>
                    <TableCell className="text-right">{request.leadTimeDays} ngày</TableCell>
                    <TableCell className="text-right">{request.monthlyCapacity}/tháng</TableCell>
                    <TableCell>{getProviderOfferingSupplierRequestStatusLabel(request.reviewStatus)}</TableCell>
                    <TableCell>
                      <p>{request.materialNote || request.qualityNote || request.providerNote || "-"}</p>
                      {request.reviewNote ? <p className="mt-1 text-xs text-muted-foreground">Duyệt: {request.reviewNote}</p> : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <SupplierRequestActions request={request} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Không có đăng ký phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section> : null}

      {mode === "all" || mode === "suppliers" ? <section className="space-y-4">
        <SectionHeader title="Supplier đã duyệt" />
        <AdminTableToolbar>
          <AdminTableSearch value={supplierSearch} onChange={setSupplierSearch} placeholder="Tìm provider, dịch vụ/sản phẩm, SKU, khu vực..." />
          <AdminTableSelect value={supplierStatus} label="Lọc trạng thái supplier" onChange={setSupplierStatus} options={SUPPLIER_STATUS_OPTIONS} />
          <AdminTableSelect value={supplierSource} label="Lọc nguồn supplier" onChange={setSupplierSource} options={SUPPLIER_SOURCE_OPTIONS} />
          <AdminTableClearButton
            visible={hasSupplierFilters}
            onClick={() => {
              setSupplierSearch("");
              setSupplierStatus("");
              setSupplierSource("");
            }}
          />
        </AdminTableToolbar>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Nhà cung cấp</TableHead>
                <TableHead className="font-medium">Mẫu</TableHead>
                <TableHead className="font-medium">Nguồn</TableHead>
                <TableHead className="text-right font-medium">Giá nhập</TableHead>
                <TableHead className="text-right font-medium">Giá bán</TableHead>
                <TableHead className="text-right font-medium">Thời gian</TableHead>
                <TableHead className="text-right font-medium">Năng lực</TableHead>
                <TableHead className="font-medium">Trạng thái</TableHead>
                <TableHead className="text-right font-medium">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="align-top">
                    <TableCell>
                      <div className="space-y-1">
                        <p>{supplier.providerDisplayName}</p>
                        <p className="text-xs text-muted-foreground">{supplier.providerUsername}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{supplier.offeringName}</p>
                        <p className="text-xs text-muted-foreground">/{supplier.offeringSlug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getOfferingProviderSupplierSourceLabel(supplier.source)}</TableCell>
                    <TableCell className="text-right">{formatVnd(supplier.purchaseCost)}</TableCell>
                    <TableCell className="text-right">{formatVnd(supplier.offeringPrice)}</TableCell>
                    <TableCell className="text-right">{supplier.leadTimeDays} ngày</TableCell>
                    <TableCell className="text-right">{supplier.monthlyCapacity}/tháng</TableCell>
                    <TableCell>{getOfferingProviderSupplierStatusLabel(supplier.status)}</TableCell>
                    <TableCell className="text-right">
                      <SupplierStatusActions supplier={supplier} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Không có supplier phù hợp với bộ lọc hiện tại.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section> : null}
    </div>
  );
}
