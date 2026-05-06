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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 pr-4 font-medium">Mẫu</th>
                    <th className="py-3 pr-4 font-medium">Giá nhập</th>
                    <th className="py-3 pr-4 font-medium">Lead time</th>
                    <th className="py-3 pr-4 font-medium">Năng lực</th>
                    <th className="py-3 pr-4 font-medium">Trạng thái</th>
                    <th className="py-3 pr-4 font-medium">Review note</th>
                    <th className="py-3 font-medium">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{request.productName}</p>
                        <p className="text-xs text-muted-foreground">/{request.productSlug}</p>
                      </td>
                      <td className="py-3 pr-4">{request.purchaseCost}</td>
                      <td className="py-3 pr-4">{request.leadTimeDays} ngày</td>
                      <td className="py-3 pr-4">{request.monthlyCapacity}/tháng</td>
                      <td className="py-3 pr-4">{request.reviewStatus}</td>
                      <td className="py-3 pr-4">{request.reviewNote || "-"}</td>
                      <td className="py-3">{formatDate(request.updatedAt)}</td>
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
