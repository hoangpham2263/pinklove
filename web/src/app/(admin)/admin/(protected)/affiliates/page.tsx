import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeForm } from "@/components/common/native-form";
import { PageToast } from "@/components/common/page-toast";
import { listAffiliateAccounts, getAffiliateProgramSummary } from "@/features/affiliate/server/service";
import { requireAdmin } from "@/lib/auth";

type AdminAffiliatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getAffiliateStatusLabel(status: string) {
  if (status === "active") return "Đang hoạt động";
  if (status === "rejected") return "Từ chối";
  if (status === "blocked") return "Đã khóa";
  return "Chờ duyệt";
}

function getAffiliateErrorMessage(error: string | undefined) {
  if (!error) return null;
  if (error === "AFFILIATE_NOT_FOUND") return "Không tìm thấy tài khoản affiliate.";
  if (error === "AFFILIATE_COMMISSION_INVALID") return "Mức commission không hợp lệ.";
  if (error === "missing_user") return "Thiếu user cần cập nhật.";
  return "Không thể cập nhật affiliate lúc này.";
}

export default async function AdminAffiliatesPage({ searchParams }: AdminAffiliatesPageProps) {
  await requireAdmin();
  const query = (await searchParams) ?? {};
  const summary = await getAffiliateProgramSummary();
  const accounts = await listAffiliateAccounts();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.saved ? <PageToast message="Đã cập nhật cấu hình affiliate." variant="success" /> : null}
      {query.error ? <PageToast message={getAffiliateErrorMessage(String(query.error)) ?? "Không thể cập nhật affiliate lúc này."} variant="error" /> : null}

      <div className="grid gap-5 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.activeCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tổng click</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.clickCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tổng conversion</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.conversionCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý tài khoản affiliate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Phần này đã sẵn sàng cho duyệt tài khoản, cấp mã ref và cấu hình commission nền tảng. Conversion và payout sẽ chỉ hoạt động đầy đủ sau khi dự án có đơn hàng thực tế.
          </p>

          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có user nào đăng ký affiliate.</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.userId} className="rounded-lg border p-4">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{account.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Mã: {account.code} • Click: {account.clickCount} • Conversion: {account.conversionCount}
                      </p>
                    </div>
                    <Badge variant={account.status === "active" ? "default" : "secondary"}>
                      {getAffiliateStatusLabel(account.status)}
                    </Badge>
                  </div>

                  <NativeForm action="/api/admin/affiliates/update" method="POST" className="grid gap-4 lg:grid-cols-6">
                    <input type="hidden" name="userId" value={String(account.userId)} />

                    <div className="space-y-2">
                      <label className="font-medium">Trạng thái</label>
                      <select name="status" defaultValue={account.status} className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                        <option value="pending">pending</option>
                        <option value="active">active</option>
                        <option value="rejected">rejected</option>
                        <option value="blocked">blocked</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium">Kiểu commission</label>
                      <select
                        name="commissionType"
                        defaultValue={account.commissionType}
                        className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="percent">percent</option>
                        <option value="fixed">fixed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-medium">Giá trị commission</label>
                      <Input name="commissionValue" type="number" step="0.01" min="0" defaultValue={String(account.commissionValue)} />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <label className="font-medium">Ghi chú admin</label>
                      <Input name="notes" defaultValue={account.notes || ""} placeholder="Ví dụ: duyệt tay, chờ tích hợp checkout..." />
                    </div>

                    <div className="flex items-end">
                      <Button type="submit" className="w-full">Lưu cấu hình</Button>
                    </div>
                  </NativeForm>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
