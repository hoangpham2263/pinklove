import { notFound, redirect } from "next/navigation";
import { ShieldCheck, Store, PackageCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerLoginForm } from "@/features/auth/components/login-forms";
import { ensureProviderPortalSlug, getCurrentUser, getProviderPortalAccountBySlug, isProviderRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

type PartnerProviderEntryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PartnerProviderEntryPage({ params }: PartnerProviderEntryPageProps) {
  const { slug } = await params;
  const provider = await getProviderPortalAccountBySlug(slug);

  if (!provider) {
    notFound();
  }

  const providerSlug = provider.providerPortalSlug || (await ensureProviderPortalSlug(provider.id));
  if (!providerSlug) {
    notFound();
  }

  if (providerSlug !== slug) {
    redirect(ROUTES.PARTNER.PORTAL(providerSlug));
  }

  const currentUser = await getCurrentUser();
  if (currentUser) {
    if (!isProviderRole(currentUser.role)) {
      redirect(ROUTES.CUSTOMER.DASHBOARD);
    }

    if (currentUser.id !== provider.id) {
      const currentProviderSlug = await ensureProviderPortalSlug(currentUser.id);
      if (currentProviderSlug) {
        redirect(ROUTES.PARTNER.PORTAL(currentProviderSlug));
      }
    }
  }

  const providerName = provider.displayName || provider.fullName || provider.username;
  const settings = await getSystemSettings();
  const partnerTitle = "Đối tác của " + settings.branding.siteName;

  if (currentUser?.id === provider.id) {
    redirect(ROUTES.PARTNER.DASHBOARD);
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <div className="mx-auto grid min-h-screen w-full gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] lg:px-10">
        <div className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/70 bg-white/90 px-4 py-2 text-sm text-amber-900">
            <Store className="h-4 w-4" />
            {partnerTitle}
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              {providerName}
            </h1>
            <p className="text-base leading-7 text-zinc-600 md:text-lg">
              {partnerTitle} Tài khoản đối tác không vào trang quản trị nội bộ,
              chỉ xem và cập nhật các đơn hàng đã được admin giao xử lý.
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
                Chỉ những đơn admin phân công mới xuất hiện trong workspace của đối tác.
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
                Đối tác có thể phản hồi trạng thái, ghi chú và theo dõi timeline cho từng đơn.
              </CardContent>
            </Card>
          </div>

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-6">
            <p className="text-sm font-medium text-zinc-900">Luồng sử dụng</p>
            <div className="mt-3 flex flex-col gap-3 text-sm text-zinc-600 md:flex-row md:items-center">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">1. Admin giao đơn</span>
              <span className="hidden text-zinc-300 md:inline">/</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">2. Đối tác đăng nhập portal riêng</span>
              <span className="hidden text-zinc-300 md:inline">/</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">3. Cập nhật xử lý đơn hàng</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full space-y-4">
            <PartnerLoginForm
              title={providerName}
              description="Đăng nhập để mở workspace đơn hàng riêng của đối tác này."
              returnTo={ROUTES.PARTNER.PORTAL(providerSlug)}
              portalSlug={providerSlug}
              embedded
            />
            <Card className="border-dashed border-zinc-300 bg-white/95">
              <CardContent className="flex flex-col gap-3 pt-6 text-sm text-zinc-600">
                <p>
                  Sau khi đăng nhập, đối tác sẽ đi thẳng vào danh sách đơn được giao thay vì khu quản trị nội bộ.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Portal riêng: {ROUTES.PARTNER.PORTAL(providerSlug)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
