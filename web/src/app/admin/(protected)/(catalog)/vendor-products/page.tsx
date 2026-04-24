import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listVendorProductSubmissionsForAdmin } from "@/features/vendor-product-submissions/server/service";
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
  const submissions = await listVendorProductSubmissionsForAdmin();
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
          Vendor tự nhập hồ sơ sản phẩm và admin duyệt, phản hồi hoặc áp dụng vào catalog live.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Tổng hồ sơ</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Submitted</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "submitted").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Under Review</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "under_review").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Approved</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "approved").length}</p></CardContent></Card>
      </div>

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
