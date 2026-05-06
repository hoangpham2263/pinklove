import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import {
  listProductVendorSuppliersForAdmin,
  listSupplierRequestsForAdmin,
  listVendorProductSubmissionsForAdmin,
} from "@/features/vendor-product-submissions/server/service";
import { getVendorProductSubmissionTypeLabel } from "@/features/vendor-product-submissions/labels";
import { VendorProductStatusBadge } from "@/features/vendor-product-submissions/components/vendor-product-status-badge";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type AdminVendorProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminVendorProductsPage({ searchParams }: AdminVendorProductsPageProps) {
  await requireAdmin();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [submissions, supplierRequests, suppliers] = await Promise.all([
    listVendorProductSubmissionsForAdmin(),
    listSupplierRequestsForAdmin(),
    listProductVendorSuppliersForAdmin(),
  ]);
  const vendorFilter = getSearchParamValue(resolvedSearchParams?.vendorId)?.trim() ?? "";
  const statusFilter = getSearchParamValue(resolvedSearchParams?.status)?.trim() ?? "";
  const filteredSubmissions = submissions.filter((item) => {
    if (vendorFilter && item.vendorUserId !== vendorFilter) {
      return false;
    }

    if (statusFilter && item.reviewStatus !== statusFilter) {
      return false;
    }

    return true;
  });
  const uniqueVendors = Array.from(
    new Map(submissions.map((item) => [item.vendorUserId, { id: item.vendorUserId, name: item.vendorDisplayName }])).values()
  ).sort((left, right) => left.name.localeCompare(right.name, "vi"));

  const buildFilterHref = (nextVendorId?: string, nextStatus?: string) => {
    const params = new URLSearchParams();
    const vendorId = nextVendorId ?? vendorFilter;
    const status = nextStatus ?? statusFilter;
    if (vendorId) {
      params.set("vendorId", vendorId);
    }
    if (status) {
      params.set("status", status);
    }
    const query = params.toString();
    return query ? `${ROUTES.ADMIN.VENDOR_PRODUCTS}?${query}` : ROUTES.ADMIN.VENDOR_PRODUCTS;
  };

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendor Product Review</h1>
        <p className="text-sm text-muted-foreground">
          Duyệt proposal mẫu mới và supplier request cho mẫu có sẵn trước khi vendor được bán/cung cấp.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Tổng hồ sơ</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Submitted</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "submitted").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Under Review</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "under_review").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Suppliers</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{suppliers.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Approved suppliers</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {suppliers.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có vendor nào được duyệt làm supplier.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 pr-4 font-medium">Vendor</th>
                    <th className="py-3 pr-4 font-medium">Mẫu</th>
                    <th className="py-3 pr-4 font-medium">Nguồn</th>
                    <th className="py-3 pr-4 font-medium">Giá nhập</th>
                    <th className="py-3 pr-4 font-medium">Lead time</th>
                    <th className="py-3 pr-4 font-medium">Năng lực</th>
                    <th className="py-3 pr-4 font-medium">Trạng thái</th>
                    <th className="py-3 text-right font-medium">Lifecycle</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b align-top last:border-b-0">
                      <td className="py-4 pr-4">
                        <p className="font-medium">{supplier.vendorDisplayName}</p>
                        <p className="text-xs text-muted-foreground">{supplier.vendorUsername}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-medium">{supplier.productName}</p>
                        <p className="text-xs text-muted-foreground">/{supplier.productSlug}</p>
                      </td>
                      <td className="py-4 pr-4">{supplier.source}</td>
                      <td className="py-4 pr-4">{supplier.purchaseCost}</td>
                      <td className="py-4 pr-4">{supplier.leadTimeDays} ngày</td>
                      <td className="py-4 pr-4">{supplier.monthlyCapacity}/tháng</td>
                      <td className="py-4 pr-4">{supplier.status}</td>
                      <td className="py-4 text-right">
                        <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.SUPPLIER_STATUS(supplier.id)} method="POST" className="ml-auto grid min-w-[260px] gap-2">
                          <textarea name="reviewNote" className="min-h-14 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Lifecycle note" />
                          <div className="grid grid-cols-2 gap-2">
                            {supplier.status !== "active" ? <Button type="submit" name="nextStatus" value="active" size="sm">Activate</Button> : null}
                            {supplier.status !== "paused" ? <Button type="submit" name="nextStatus" value="paused" variant="outline" size="sm">Pause</Button> : null}
                            {supplier.status !== "suspended" ? <Button type="submit" name="nextStatus" value="suspended" variant="outline" size="sm">Suspend</Button> : null}
                            {supplier.status !== "revoked" ? <Button type="submit" name="nextStatus" value="revoked" variant="destructive" size="sm">Revoke</Button> : null}
                          </div>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Supplier requests</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {supplierRequests.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Chưa có vendor nào xin cung cấp mẫu có sẵn.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 pr-4 font-medium">Vendor</th>
                    <th className="py-3 pr-4 font-medium">Mẫu</th>
                    <th className="py-3 pr-4 font-medium">Giá nhập</th>
                    <th className="py-3 pr-4 font-medium">Lead time</th>
                    <th className="py-3 pr-4 font-medium">Năng lực</th>
                    <th className="py-3 pr-4 font-medium">Trạng thái</th>
                    <th className="py-3 pr-4 font-medium">Ghi chú</th>
                    <th className="py-3 text-right font-medium">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierRequests.map((request) => (
                    <tr key={request.id} className="border-b align-top last:border-b-0">
                      <td className="py-4 pr-4">
                        <p className="font-medium">{request.vendorDisplayName}</p>
                        <p className="text-xs text-muted-foreground">{request.vendorUsername}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-medium">{request.productName}</p>
                        <p className="text-xs text-muted-foreground">/{request.productSlug}</p>
                      </td>
                      <td className="py-4 pr-4">{request.purchaseCost}</td>
                      <td className="py-4 pr-4">{request.leadTimeDays} ngày</td>
                      <td className="py-4 pr-4">{request.monthlyCapacity}/tháng</td>
                      <td className="py-4 pr-4">{request.reviewStatus}</td>
                      <td className="py-4 pr-4">
                        <p>{request.materialNote || request.qualityNote || request.vendorNote || "-"}</p>
                        {request.reviewNote ? <p className="mt-1 text-xs text-muted-foreground">Review: {request.reviewNote}</p> : null}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.SUPPLIER_REQUEST_REVIEW(request.id)} method="POST" className="space-y-2">
                            <textarea name="reviewNote" className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Review note" />
                            <div className="grid grid-cols-2 gap-2">
                              <Button type="submit" name="nextStatus" value="under_review" variant="outline" size="sm">Review</Button>
                              <Button type="submit" name="nextStatus" value="approved" size="sm">Approve</Button>
                              <Button type="submit" name="nextStatus" value="changes_requested" variant="outline" size="sm">Changes</Button>
                              <Button type="submit" name="nextStatus" value="rejected" variant="destructive" size="sm">Reject</Button>
                            </div>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Bộ lọc quản trị</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-4">
          <Button variant={vendorFilter ? "outline" : "default"} render={<Link href={buildFilterHref("")}>Tất cả vendor</Link>} />
          {uniqueVendors.map((vendor) => (
            <Button
              key={vendor.id}
              variant={vendorFilter === vendor.id ? "default" : "outline"}
              render={<Link href={buildFilterHref(vendor.id)}>{vendor.name}</Link>}
            />
          ))}
          <Button variant={statusFilter ? "outline" : "default"} render={<Link href={buildFilterHref(undefined, "")}>Mọi trạng thái</Link>} />
          <Button variant={statusFilter === "submitted" ? "default" : "outline"} render={<Link href={buildFilterHref(undefined, "submitted")}>Submitted</Link>} />
          <Button
            variant={statusFilter === "under_review" ? "default" : "outline"}
            render={<Link href={buildFilterHref(undefined, "under_review")}>Under Review</Link>}
          />
          <Button
            variant={statusFilter === "changes_requested" ? "default" : "outline"}
            render={<Link href={buildFilterHref(undefined, "changes_requested")}>Need Changes</Link>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Danh sách review</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredSubmissions.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Không có hồ sơ nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 pr-4 font-medium">Vendor</th>
                    <th className="py-3 pr-4 font-medium">Sản phẩm</th>
                    <th className="py-3 pr-4 font-medium">Loại yêu cầu</th>
                    <th className="py-3 pr-4 font-medium">Giá nhập</th>
                    <th className="py-3 pr-4 font-medium">Giá bán admin</th>
                    <th className="py-3 pr-4 font-medium">Tồn kho</th>
                    <th className="py-3 pr-4 font-medium">Trạng thái</th>
                    <th className="py-3 pr-4 font-medium">Cập nhật</th>
                    <th className="py-3 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b align-top last:border-b-0">
                      <td className="py-4 pr-4">
                        <div className="space-y-1">
                          <p className="font-medium">{submission.vendorDisplayName}</p>
                          <p className="text-xs text-muted-foreground">{submission.vendorUsername}</p>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="space-y-1">
                          <p className="font-medium">{submission.name}</p>
                          <p className="text-xs text-muted-foreground">/{submission.slugCandidate}</p>
                          {submission.linkedProductName ? (
                            <p className="text-xs text-muted-foreground">Live: {submission.linkedProductName}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 pr-4">{getVendorProductSubmissionTypeLabel(submission.submissionType)}</td>
                      <td className="py-4 pr-4">{submission.purchaseCost}</td>
                      <td className="py-4 pr-4">{submission.adminSellPrice ?? "—"}</td>
                      <td className="py-4 pr-4">{submission.proposedStockQuantity}</td>
                      <td className="py-4 pr-4"><VendorProductStatusBadge status={submission.reviewStatus} /></td>
                      <td className="py-4 pr-4">{formatDateTime(submission.updatedAt)}</td>
                      <td className="py-4 text-right">
                        <Button variant="outline" render={<Link href={ROUTES.ADMIN.VENDOR_PRODUCT(submission.id)}>Review</Link>} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
