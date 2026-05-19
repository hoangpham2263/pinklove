import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSupplierRequestsForVendor } from "@/features/vendor-product-submissions/server/service";
import { requireVendor } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function PartnerSupplyRequestsPage() {
  const vendor = await requireVendor(ROUTES.PARTNER.LOGIN);
  const requests = await listSupplierRequestsForVendor(vendor.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-background p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Supply Requests</h1>
          <p className="mt-2 text-sm text-muted-foreground">Theo dõi các mẫu bạn đã xin cung cấp và phản hồi review từ admin.</p>
        </div>
        <Button render={<Link href={ROUTES.PARTNER.AVAILABLE_TEMPLATES}>Xem mẫu có sẵn</Link>} />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Danh sách yêu cầu</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {requests.length === 0 ? (
            <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">Bạn chưa gửi supplier request nào.</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full table-fixed text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="w-[42%] px-4 py-3 font-medium">Mẫu</th>
                    <th className="hidden w-[14%] px-4 py-3 font-medium md:table-cell">Giá nhập</th>
                    <th className="hidden w-[14%] px-4 py-3 font-medium lg:table-cell">Lead time</th>
                    <th className="hidden w-[14%] px-4 py-3 font-medium xl:table-cell">Năng lực</th>
                    <th className="w-[22%] px-4 py-3 font-medium">Trạng thái</th>
                    <th className="hidden w-[18%] px-4 py-3 font-medium xl:table-cell">Review note</th>
                    <th className="hidden w-[14%] px-4 py-3 font-medium xl:table-cell">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b last:border-0">
                      <td className="min-w-0 px-4 py-3">
                        <p className="truncate font-medium">{request.productName}</p>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">{request.purchaseCost}</td>
                      <td className="hidden px-4 py-3 lg:table-cell">{request.leadTimeDays} ngày</td>
                      <td className="hidden px-4 py-3 xl:table-cell">{request.monthlyCapacity}/tháng</td>
                      <td className="px-4 py-3">
                        <p className="truncate">{request.reviewStatus}</p>
                      </td>
                      <td className="hidden min-w-0 px-4 py-3 xl:table-cell">
                        <p className="truncate">{request.reviewNote || "-"}</p>
                      </td>
                      <td className="hidden px-4 py-3 xl:table-cell">{formatDate(request.updatedAt)}</td>
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
