import { redirect } from "next/navigation";

import { ProviderLoginForm } from "@/features/auth/components/login-forms";
import { getCurrentUser, isProviderRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (isProviderRole(user.role)) {
      redirect(ROUTES.PROVIDER.DASHBOARD);
    }

    redirect(ROUTES.CUSTOMER.PROVIDER_APPLY);
  }

  return (
    <ProviderLoginForm
      title="Đăng nhập provider"
      description="Sử dụng tài khoản đã được duyệt để xem đơn được giao, cập nhật tiến độ và quản lý hồ sơ dịch vụ."
    />
  );
}
