import { CheckCircle2, ClipboardList, Clock3, Truck } from "lucide-react";

import { CurrencyInput } from "@/components/common/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AdminTableActionButton, AdminTableActions } from "@/features/admin/components/admin-table-actions";
import { AdminProviderOfferingRequestsTable } from "@/features/provider-offering-submissions/components/admin-provider-offering-requests-table";
import {
  getOfferingProviderSupplierSourceLabel,
  getOfferingProviderSupplierStatusLabel,
  getProviderOfferingSupplierRequestStatusLabel,
} from "@/features/provider-offering-submissions/labels";
import {
  listOfferingProviderSuppliersForAdmin,
  listSupplierRequestsForAdmin,
  listProviderOfferingSubmissionsForAdmin,
} from "@/features/provider-offering-submissions/server/service";
import { requireAdmin } from "@/lib/auth";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";

export default async function AdminProviderOfferingRequestsPage() {
  await requireAdmin();

  const [submissions, supplierRequests, suppliers] = await Promise.all([
    listProviderOfferingSubmissionsForAdmin(),
    listSupplierRequestsForAdmin(),
    listOfferingProviderSuppliersForAdmin(),
  ]);
  const uniqueProviders = Array.from(
    new Map(submissions.map((item) => [item.providerId, { id: item.providerId, name: item.providerDisplayName }])).values()
  ).sort((left, right) => left.name.localeCompare(right.name, "vi"));
  const submittedCount = submissions.filter((item) => item.reviewStatus === "submitted").length;
  const underReviewCount = submissions.filter((item) => item.reviewStatus === "under_review").length;
  const approvedCount = submissions.filter((item) => item.reviewStatus === "approved").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng yêu cầu" value={submissions.length} icon={ClipboardList} />
        <AdminOverviewCard title="Chờ duyệt" value={submittedCount} icon={Clock3} />
        <AdminOverviewCard title="Đang duyệt" value={underReviewCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Đã duyệt / Supplier" value={`${approvedCount} / ${suppliers.length}`} icon={Truck} />
      </AdminOverviewGrid>

      <AdminProviderOfferingRequestsTable submissions={submissions} providers={uniqueProviders} />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Yêu cầu cung cấp mẫu</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {supplierRequests.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có provider nào xin cung cấp mẫu có sẵn.
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
                    <TableHead className="text-right font-medium">Thời gian xử lý</TableHead>
                    <TableHead className="text-right font-medium">Năng lực</TableHead>
                    <TableHead className="font-medium">Trạng thái</TableHead>
                    <TableHead className="font-medium">Ghi chú</TableHead>
                    <TableHead className="text-right font-medium">Duyệt</TableHead>
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
                        {request.reviewNote ? <p className="mt-1 text-xs text-muted-foreground">Ghi chú duyệt: {request.reviewNote}</p> : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.SUPPLIER_REQUEST_REVIEW(request.id)} method="POST" className="ml-auto grid w-full gap-2 md:w-[220px]">
                          <CurrencyInput
                            name="adminSellPrice"
                            defaultValue={request.offeringPrice > 0 ? String(request.offeringPrice) : ""}
                            className="h-9 rounded-md bg-white px-3 text-sm"
                            placeholder="Giá bán"
                          />
                          <textarea name="reviewNote" className="min-h-16 w-full rounded-md border bg-white px-3 py-2 text-sm" placeholder="Ghi chú duyệt" />
                          <AdminTableActions>
                            <AdminTableActionButton action="edit" label="Đánh dấu đang duyệt" type="submit" name="nextStatus" value="under_review" />
                            <AdminTableActionButton action="approve" label="Duyệt yêu cầu" type="submit" name="nextStatus" value="approved" />
                            <AdminTableActionButton action="restore" label="Yêu cầu bổ sung" type="submit" name="nextStatus" value="changes_requested" />
                            <AdminTableActionButton action="reject" label="Từ chối yêu cầu" type="submit" name="nextStatus" value="rejected" />
                          </AdminTableActions>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Supplier đã duyệt</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
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
                    <TableHead className="text-right font-medium">Thời gian xử lý</TableHead>
                    <TableHead className="text-right font-medium">Năng lực</TableHead>
                    <TableHead className="font-medium">Trạng thái</TableHead>
                    <TableHead className="text-right font-medium">Vòng đời</TableHead>
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
                        <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.SUPPLIER_STATUS(supplier.id)} method="POST" className="ml-auto grid w-full gap-2 md:w-[260px]">
                          <CurrencyInput
                            name="adminSellPrice"
                            defaultValue={supplier.offeringPrice > 0 ? String(supplier.offeringPrice) : ""}
                            className="h-9 rounded-md bg-white px-3 text-sm"
                            placeholder="Giá bán"
                          />
                          <textarea name="reviewNote" className="min-h-14 w-full rounded-md border bg-white px-3 py-2 text-sm" placeholder="Ghi chú vòng đời" />
                          <AdminTableActions>
                            {supplier.status !== "active" ? (
                              <AdminTableActionButton action="approve" label="Kích hoạt lại" type="submit" name="nextStatus" value="active" />
                            ) : null}
                            {supplier.status !== "paused" ? (
                              <AdminTableActionButton action="cancel" label="Tạm dừng" type="submit" name="nextStatus" value="paused" />
                            ) : null}
                            {supplier.status !== "suspended" ? (
                              <AdminTableActionButton action="spam" label="Hạn chế" type="submit" name="nextStatus" value="suspended" />
                            ) : null}
                            {supplier.status !== "revoked" ? (
                              <AdminTableActionButton action="delete" label="Thu hồi" type="submit" name="nextStatus" value="revoked" />
                            ) : null}
                          </AdminTableActions>
                        </form>
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
