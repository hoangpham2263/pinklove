import { CheckCircle2, ClipboardList, Send, Truck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import {
  getOfferingProviderSupplierSourceLabel,
  getOfferingProviderSupplierStatusLabel,
  getProviderOfferingSupplierRequestStatusLabel,
} from "@/features/provider-offering-submissions/labels";
import {
  listOfferingProviderSuppliersForAdmin,
  listProviderSupplySourcingOfferingsForAdmin,
  listSupplierRequestsForAdmin,
} from "@/features/provider-offering-submissions/server/service";
import { requireAdmin } from "@/lib/auth";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { SupplierRequestActions, SupplierStatusActions } from "./sourcing-table-actions";

export default async function AdminProviderSourcingPage() {
  await requireAdmin();

  const [supplierRequests, suppliers, sourcingOfferings] = await Promise.all([
    listSupplierRequestsForAdmin(),
    listOfferingProviderSuppliersForAdmin(),
    listProviderSupplySourcingOfferingsForAdmin(),
  ]);
  const openRequestCount = supplierRequests.filter((request) =>
    ["submitted", "under_review", "changes_requested"].includes(request.reviewStatus)
  ).length;
  const activeSupplierCount = suppliers.filter((supplier) => supplier.status === "active").length;
  const openSourcingCount = sourcingOfferings.filter((offering) => offering.allowProviderSupply).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Provider Sourcing</h1>
        <p className="text-sm text-muted-foreground">
          Tìm nguồn hàng, duyệt đăng ký cung ứng và quản lý vòng đời supplier theo từng offering.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Sản phẩm mở nguồn" value={openSourcingCount} icon={Send} />
        <AdminOverviewCard title="Yêu cầu supplier" value={supplierRequests.length} description={`${openRequestCount} đang mở`} icon={ClipboardList} />
        <AdminOverviewCard title="Supplier active" value={activeSupplierCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Tổng supplier" value={suppliers.length} icon={Truck} />
      </AdminOverviewGrid>

      <Card className="min-w-0 overflow-visible rounded-lg gap-0">
        <CardHeader className="border-b gap-0 pb-0">
          <CardTitle>Tìm nguồn hàng từ provider</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,360px)_1fr]">
          <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.SOURCING_ANNOUNCE} method="POST" className="space-y-3 rounded-md border bg-muted/20 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sản phẩm cần tìm nguồn</label>
              <select name="offeringId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Chọn sản phẩm</option>
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
            <AdminSubmitButton type="submit" className="w-full">
              Thông báo provider
            </AdminSubmitButton>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Sản phẩm</TableHead>
                  <TableHead className="text-right font-medium">Giá bán</TableHead>
                  <TableHead className="text-right font-medium">Đang chờ</TableHead>
                  <TableHead className="text-right font-medium">Đã duyệt</TableHead>
                  <TableHead className="font-medium">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourcingOfferings.slice(0, 12).map((offering) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-visible rounded-lg gap-0">
        <CardHeader className="border-b gap-0 pb-0">
          <CardTitle>Provider đăng ký nhận nguồn hàng</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {supplierRequests.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có provider nào gửi thông tin nhận nguồn hàng.
            </div>
          ) : (
            <div className="rounded-md border">
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
                  {supplierRequests.map((request) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-visible rounded-lg gap-0">
        <CardHeader className="border-b gap-0 pb-0">
          <CardTitle>Supplier đã duyệt</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {suppliers.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có provider nào được duyệt làm supplier.
            </div>
          ) : (
            <div className="rounded-md border">
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
                  {suppliers.map((supplier) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
