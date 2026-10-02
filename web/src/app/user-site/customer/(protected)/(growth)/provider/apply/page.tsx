import { redirect } from "next/navigation";

import { NativeForm } from "@/components/common/native-form";
import { PageToast } from "@/components/common/page-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getUserProfile, isProviderRole, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type ProviderApplyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getProviderApplyErrorMessage(error: string | undefined) {
  if (!error) return null;
  if (error === "MISSING_REQUIRED_FIELDS") return "Vui lòng điền đủ các trường bắt buộc.";
  if (error === "INVALID_EMAIL") return "Email chưa đúng định dạng.";
  if (error === "APPLICATION_ALREADY_EXISTS") return "Email này đã có hồ sơ đăng ký đang được xử lý.";
  return "Không thể gửi hồ sơ provider lúc này.";
}

export default async function ProviderApplyPage({ searchParams }: ProviderApplyPageProps) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  if (isProviderRole(user.role)) {
    redirect(ROUTES.PROVIDER.DASHBOARD);
  }

  const query = (await searchParams) ?? {};
  const profile = await getUserProfile(user.id);
  const displayName = profile.displayName || profile.fullName || user.accountName;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.submitted ? (
        <PageToast
          message="Đã gửi hồ sơ nhà cung cấp. Admin sẽ review và kích hoạt provider nếu hồ sơ phù hợp."
          variant="success"
        />
      ) : null}
      {query.error ? (
        <PageToast
          message={getProviderApplyErrorMessage(String(query.error)) ?? "Không thể gửi hồ sơ provider lúc này."}
          variant="error"
        />
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Không gian provider</p>
        <h1 className="text-2xl font-semibold">Gửi hồ sơ nhà cung cấp</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Hoàn tất thông tin để admin review. Khi được duyệt, bạn sẽ đăng nhập qua cổng provider riêng để quản lý dịch vụ, đơn hàng và lead.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-5 shadow-sm md:p-6">
        <NativeForm action={ROUTES.API.APPLICATIONS.PROVIDER} method="POST" className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="returnTo" value={ROUTES.CUSTOMER.PROVIDER_APPLY} />
          <div className="space-y-2">
            <label htmlFor="provider-companyName" className="text-sm font-medium">Tên doanh nghiệp</label>
            <Input id="provider-companyName" name="companyName" defaultValue={displayName} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="provider-contactName" className="text-sm font-medium">Người liên hệ</label>
            <Input id="provider-contactName" name="contactName" defaultValue={displayName} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="provider-phone" className="text-sm font-medium">Số điện thoại</label>
            <Input id="provider-phone" name="phone" defaultValue={profile.phone || ""} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="provider-email" className="text-sm font-medium">Email làm việc</label>
            <Input id="provider-email" name="email" type="email" defaultValue={user.email} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="provider-city" className="text-sm font-medium">Khu vực phục vụ</label>
            <Input id="provider-city" name="city" placeholder="TP.HCM, Hà Nội..." required />
          </div>
          <div className="space-y-2">
            <label htmlFor="provider-categories" className="text-sm font-medium">Nhóm dịch vụ/sản phẩm</label>
            <Input id="provider-categories" name="categories" placeholder="Studio, thiệp cưới, trang trí..." required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="provider-website" className="text-sm font-medium">Website/Facebook/TikTok</label>
            <Input id="provider-website" name="website" placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="provider-experience" className="text-sm font-medium">Kinh nghiệm/năng lực</label>
            <Textarea id="provider-experience" name="experience" rows={3} placeholder="Mô tả kinh nghiệm, quy mô xử lý, sản phẩm/dịch vụ nổi bật..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="provider-notes" className="text-sm font-medium">Ghi chú thêm</label>
            <Textarea id="provider-notes" name="notes" rows={3} placeholder="Thông tin admin cần biết khi review hồ sơ." />
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit">Gửi hồ sơ provider</Button>
          </div>
        </NativeForm>
      </div>
    </section>
  );
}
