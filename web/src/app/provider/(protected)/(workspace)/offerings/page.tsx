import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { ProviderOfferingRequestsTable } from "@/features/provider-offering-submissions/components/provider-offering-requests-table";
import { listProviderOfferingSubmissionsForProvider } from "@/features/provider-offering-submissions/server/service";

export default async function ProviderOfferingsPage() {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const submissions = await listProviderOfferingSubmissionsForProvider(provider.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border bg-background p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Yêu cầu sản phẩm</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Quản lý các yêu cầu tạo mới, cập nhật hoặc ngừng bán sản phẩm. Admin duyệt, phản hồi và nhập giá bán thực tế.
            </p>
          </div>
          <Button render={<Link href={ROUTES.PROVIDER.OFFERING_NEW}>Tạo yêu cầu mới</Link>} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tổng yêu cầu</CardTitle></CardHeader>
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
            <CardTitle className="text-base font-semibold">Danh sách yêu cầu sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {submissions.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Chưa có yêu cầu sản phẩm nào. Hãy tạo yêu cầu đầu tiên để gửi admin duyệt.
              </div>
            ) : (
              <ProviderOfferingRequestsTable submissions={submissions} />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
