import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowRight, PackageCheck, ShieldCheck, Store } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderLoginForm } from "@/features/auth/components/login-forms";
import { getCurrentUser, isProviderRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function ProviderLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (isProviderRole(user.role)) {
      redirect(ROUTES.PROVIDER.DASHBOARD);
    }

    redirect(ROUTES.CUSTOMER.DASHBOARD);
  }

  const settings = await getSystemSettings();
  const providerTitle = "Cổng nhà cung cấp của " + settings.branding.siteName;

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <div className="mx-auto grid min-h-screen w-full gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] lg:px-10">
        <div className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/70 bg-white/90 px-4 py-2 text-sm text-amber-900">
            <Store className="h-4 w-4" />
            {providerTitle}
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              Provider Portal
            </h1>
            <p className="text-base leading-7 text-zinc-600 md:text-lg">
              Đăng nhập bằng tài khoản nhà cung cấp để xem đơn được giao, cập nhật tiến độ và quản lý hồ sơ dịch vụ.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-zinc-200/80 bg-white/90">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PackageCheck className="h-4 w-4" />
                  Đơn được giao
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-zinc-600">
                Chỉ những đơn admin phân công mới xuất hiện trong workspace của nhà cung cấp.
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white/90">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4" />
                  Quyền hạn tách riêng
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-zinc-600">
                Không truy cập admin, không thấy dữ liệu vận hành nội bộ ngoài phần việc được giao.
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white/90">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowRight className="h-4 w-4" />
                  Cập nhật tiến độ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-zinc-600">
                Nhà cung cấp có thể phản hồi trạng thái, ghi chú và theo dõi timeline cho từng đơn.
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Suspense fallback={null}>
            <ProviderLoginForm
              title="Đăng nhập provider"
              description="Sử dụng tài khoản đã được cấp để vào workspace nhà cung cấp."
              embedded
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
