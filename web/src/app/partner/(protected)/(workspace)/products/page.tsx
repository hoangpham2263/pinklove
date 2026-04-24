import Link from "next/link";

import { RouteBreadcrumbs } from "@/components/common/route-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureVendorPortalSlug, getUserProfile, requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { PartnerVendorHeader } from "@/features/vendor-orders/components/partner-vendor-header";
import { listVendorProductSubmissionsForVendor } from "@/features/vendor-product-submissions/server/service";
import { getVendorProductReviewStatusLabel, getVendorProductSubmissionTypeLabel } from "@/features/vendor-product-submissions/labels";
import { VendorProductStatusBadge } from "@/features/vendor-product-submissions/components/vendor-product-status-badge";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function PartnerProductsPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const [portalSlug, profile, submissions] = await Promise.all([
    ensureVendorPortalSlug(vendor.id),
    getUserProfile(vendor.id),
    listVendorProductSubmissionsForVendor(vendor.id),
  ]);
  const vendorName = profile.displayName || profile.fullName || vendor.username;
  const portalHref = portalSlug ? ROUTES.PARTNER.PORTAL(portalSlug) : ROUTES.PARTNER.ROOT;

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <PartnerVendorHeader
        vendorName={vendorName}
        portalHref={portalHref}
        currentPath={ROUTES.PARTNER.PRODUCTS}
      />

      <div className="container mx-auto space-y-5 px-4 py-5 lg:py-7.5 2xl:py-10">
        <RouteBreadcrumbs wrapperClassName="rounded-2xl border border-zinc-200/80 bg-white/92 px-4 py-3" />

        <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white/92 p-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Sản phẩm vendor</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
              Vendor tự nhập thông tin sản phẩm, giá nhập và số lượng. Admin chỉ duyệt, phản hồi và nhập giá bán thực tế.
            </p>
          </div>
          <Button render={<Link href={ROUTES.PARTNER.PRODUCT_NEW}>Tạo hồ sơ mới</Link>} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-200/80 bg-white/92">
            <CardHeader className="pb-2"><CardTitle className="text-base">Tổng hồ sơ</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{submissions.length}</p></CardContent>
          </Card>
          <Card className="border-zinc-200/80 bg-white/92">
            <CardHeader className="pb-2"><CardTitle className="text-base">Chờ duyệt</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => ["submitted", "under_review"].includes(item.reviewStatus)).length}</p></CardContent>
          </Card>
          <Card className="border-zinc-200/80 bg-white/92">
            <CardHeader className="pb-2"><CardTitle className="text-base">Cần chỉnh sửa</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "changes_requested").length}</p></CardContent>
          </Card>
        </div>

        <Card className="border-zinc-200/80 bg-white/92">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Danh sách hồ sơ sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                Chưa có hồ sơ sản phẩm nào. Hãy tạo hồ sơ đầu tiên để gửi admin duyệt.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="text-left text-zinc-500">
                    <tr className="border-b">
                      <th className="py-3 pr-4 font-medium">Sản phẩm</th>
                      <th className="py-3 pr-4 font-medium">Loại yêu cầu</th>
                      <th className="py-3 pr-4 font-medium">Giá nhập</th>
                      <th className="py-3 pr-4 font-medium">Số lượng</th>
                      <th className="py-3 pr-4 font-medium">Trạng thái</th>
                      <th className="py-3 pr-4 font-medium">Cập nhật</th>
                      <th className="py-3 text-right font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b align-top last:border-b-0">
                        <td className="py-4 pr-4">
                          <div className="space-y-1">
                            <p className="font-medium text-zinc-950">{submission.name}</p>
                            <p className="text-xs text-zinc-500">/{submission.slugCandidate}</p>
                            {submission.linkedProductName ? (
                              <p className="text-xs text-zinc-500">Live: {submission.linkedProductName}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-zinc-700">{getVendorProductSubmissionTypeLabel(submission.submissionType)}</td>
                        <td className="py-4 pr-4 text-zinc-700">{submission.purchaseCost}</td>
                        <td className="py-4 pr-4 text-zinc-700">{submission.proposedStockQuantity}</td>
                        <td className="py-4 pr-4">
                          <div className="space-y-2">
                            <VendorProductStatusBadge status={submission.reviewStatus} />
                            <p className="text-xs text-zinc-500">{getVendorProductReviewStatusLabel(submission.reviewStatus)}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-zinc-700">{formatDateTime(submission.updatedAt)}</td>
                        <td className="py-4 text-right">
                          <Button variant="outline" render={<Link href={ROUTES.PARTNER.PRODUCT(submission.id)}>Mở hồ sơ</Link>} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
