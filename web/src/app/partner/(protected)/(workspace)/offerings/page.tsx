import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorTableActionButton, VendorTableActions } from "@/features/vendor-orders/components/vendor-table-actions";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { listVendorOfferingSubmissionsForVendor } from "@/features/vendor-offering-submissions/server/service";
import { getVendorOfferingSubmissionTypeLabel } from "@/features/vendor-offering-submissions/labels";
import { VendorOfferingStatusBadge } from "@/features/vendor-offering-submissions/components/vendor-offering-status-badge";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function PartnerOfferingsPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const submissions = await listVendorOfferingSubmissionsForVendor(vendor.id);

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
          <Button render={<Link href={ROUTES.PARTNER.OFFERING_NEW}>Tạo hồ sơ mới</Link>} />
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
              <div className="rounded-md border">
                <table className="w-full table-auto text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                      <th className="w-[40%] px-4 py-3 font-medium">Sản phẩm</th>
                      <th className="hidden w-[14%] px-4 py-3 font-medium lg:table-cell">Loại</th>
                      <th className="hidden w-[12%] px-4 py-3 font-medium xl:table-cell">Giá nhập</th>
                      <th className="hidden w-[12%] px-4 py-3 font-medium xl:table-cell">Số lượng</th>
                      <th className="hidden w-[16%] px-4 py-3 font-medium md:table-cell">Trạng thái</th>
                      <th className="hidden w-[14%] px-4 py-3 font-medium xl:table-cell">Cập nhật</th>
                      <th className="w-[72px] px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b align-top last:border-b-0">
                        <td className="min-w-0 px-4 py-4">
                          <p className="truncate font-medium">{submission.name}</p>
                        </td>
                        <td className="hidden px-4 py-4 text-muted-foreground lg:table-cell">{getVendorOfferingSubmissionTypeLabel(submission.submissionType)}</td>
                        <td className="hidden px-4 py-4 text-muted-foreground xl:table-cell">{submission.purchaseCost}</td>
                        <td className="hidden px-4 py-4 text-muted-foreground xl:table-cell">{submission.proposedStockQuantity}</td>
                        <td className="hidden px-4 py-4 md:table-cell">
                          <VendorOfferingStatusBadge status={submission.reviewStatus} />
                        </td>
                        <td className="hidden px-4 py-4 text-muted-foreground xl:table-cell">{formatDateTime(submission.updatedAt)}</td>
                        <td className="px-4 py-4 text-right">
                          <VendorTableActions>
                            <VendorTableActionButton action="view" label="Mở hồ sơ" href={ROUTES.PARTNER.OFFERING(submission.id)} />
                          </VendorTableActions>
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
