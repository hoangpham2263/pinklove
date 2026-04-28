import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
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
  const submissions = await listVendorProductSubmissionsForVendor(vendor.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border bg-background p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sản phẩm vendor</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Vendor tự nhập thông tin sản phẩm, giá nhập và số lượng. Admin chỉ duyệt, phản hồi và nhập giá bán thực tế.
            </p>
          </div>
          <Button render={<Link href={ROUTES.PARTNER.PRODUCT_NEW}>Tạo hồ sơ mới</Link>} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tổng hồ sơ</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{submissions.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Chờ duyệt</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => ["submitted", "under_review"].includes(item.reviewStatus)).length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cần chỉnh sửa</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{submissions.filter((item) => item.reviewStatus === "changes_requested").length}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">Danh sách hồ sơ sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {submissions.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có hồ sơ sản phẩm nào. Hãy tạo hồ sơ đầu tiên để gửi admin duyệt.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="text-left text-muted-foreground">
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
                            <p className="font-medium">{submission.name}</p>
                            <p className="text-xs text-muted-foreground">/{submission.slugCandidate}</p>
                            {submission.linkedProductName ? (
                              <p className="text-xs text-muted-foreground">Live: {submission.linkedProductName}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">{getVendorProductSubmissionTypeLabel(submission.submissionType)}</td>
                        <td className="py-4 pr-4 text-muted-foreground">{submission.purchaseCost}</td>
                        <td className="py-4 pr-4 text-muted-foreground">{submission.proposedStockQuantity}</td>
                        <td className="py-4 pr-4">
                          <div className="space-y-2">
                            <VendorProductStatusBadge status={submission.reviewStatus} />
                            <p className="text-xs text-muted-foreground">{getVendorProductReviewStatusLabel(submission.reviewStatus)}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">{formatDateTime(submission.updatedAt)}</td>
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
