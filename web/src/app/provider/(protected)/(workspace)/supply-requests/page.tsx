import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getProviderOfferingSupplierRequestStatusLabel } from "@/features/provider-offering-submissions/labels";
import { listSupplierRequestsForProvider } from "@/features/provider-offering-submissions/server/service";
import { ProviderEmptyState, ProviderPage, ProviderPageHeader, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ProviderSupplyRequestsPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const requests = await listSupplierRequestsForProvider(provider.id);

  return (
    <ProviderPage>
      <ProviderPageHeader
        title="Yêu cầu cung cấp của tôi"
        description="Theo dõi các sản phẩm bạn đã xin cung cấp và phản hồi duyệt từ admin."
        actions={<Button render={<Link href={ROUTES.PROVIDER.AVAILABLE_TEMPLATES}>Xem sản phẩm cần nguồn hàng</Link>} />}
      />

      <ProviderSectionCard title="Danh sách yêu cầu">
        {requests.length === 0 ? (
          <ProviderEmptyState>Bạn chưa gửi yêu cầu cung cấp nào.</ProviderEmptyState>
        ) : (
          <div className="rounded-md border">
            <table className="w-full table-auto text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="w-[42%] px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="hidden w-[14%] px-4 py-3 font-medium md:table-cell">Giá nhập</th>
                  <th className="hidden w-[14%] px-4 py-3 font-medium lg:table-cell">Thời gian xử lý</th>
                  <th className="hidden w-[14%] px-4 py-3 font-medium xl:table-cell">Năng lực</th>
                  <th className="w-[22%] px-4 py-3 font-medium">Trạng thái</th>
                  <th className="hidden w-[18%] px-4 py-3 font-medium xl:table-cell">Ghi chú duyệt</th>
                  <th className="hidden w-[14%] px-4 py-3 font-medium xl:table-cell">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b last:border-0">
                    <td className="min-w-0 px-4 py-3">
                      <p className="truncate font-medium">{request.offeringName}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{formatVnd(request.purchaseCost)}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">{request.leadTimeDays} ngày</td>
                    <td className="hidden px-4 py-3 xl:table-cell">{request.monthlyCapacity}/tháng</td>
                    <td className="px-4 py-3">
                      <p className="truncate">{getProviderOfferingSupplierRequestStatusLabel(request.reviewStatus)}</p>
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
      </ProviderSectionCard>
    </ProviderPage>
  );
}
