import { CustomerProfileForm } from "@/features/customer/components/customer-profile-form";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerConfigProfilePage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const profile = await getUserProfile(user.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Cấu hình hồ sơ</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cập nhật thông tin hiển thị, liên hệ và avatar tài khoản.</p>
      </div>
      <CustomerProfileForm initialProfile={profile} />
    </section>
  );
}
