import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, Store, PackageCheck, ArrowRight } from "lucide-react";

import { PageToast } from "@/components/common/page-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerVendorPortalPanel } from "@/features/vendor-orders/components/partner-vendor-portal-panel";
import { countVendorAssignmentsForVendor, listVendorOrderSummariesForVendor } from "@/features/vendor-orders/server/service";
import { PartnerLoginForm } from "@/features/auth/components/login-forms";
import { ensureVendorPortalSlug, getCurrentUser, getVendorPortalAccountBySlug, isVendorRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type PartnerVendorEntryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getPartnerPortalErrorMessage(error: string | undefined) {
  if (!error) return null;
  if (error === "invalid_payload") return "Dữ liệu cập nhật vendor không hợp lệ.";
  if (error === "assignment_not_found") return "Assignment không tồn tại hoặc bạn không còn quyền truy cập.";
  return "Không thể xử lý thao tác vendor lúc này.";
}

export default async function PartnerVendorEntryPage({ params, searchParams }: PartnerVendorEntryPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const vendor = await getVendorPortalAccountBySlug(slug);

  if (!vendor) {
    notFound();
  }

  const vendorSlug = vendor.vendorPortalSlug || (await ensureVendorPortalSlug(vendor.id));
  if (!vendorSlug) {
    notFound();
  }

  if (vendorSlug !== slug) {
    redirect(ROUTES.PARTNER.PORTAL(vendorSlug));
  }

  const currentUser = await getCurrentUser();
  if (currentUser) {
    if (!isVendorRole(currentUser.role)) {
      redirect(ROUTES.CUSTOMER.DASHBOARD);
    }

    if (currentUser.id !== vendor.id) {
      const currentVendorSlug = await ensureVendorPortalSlug(currentUser.id);
      if (currentVendorSlug) {
        redirect(ROUTES.PARTNER.PORTAL(currentVendorSlug));
      }
    }
  }

  const vendorName = vendor.displayName || vendor.fullName || vendor.username;

  if (currentUser?.id === vendor.id) {
    const [stats, assignments] = await Promise.all([
      countVendorAssignmentsForVendor(vendor.id),
      listVendorOrderSummariesForVendor(vendor.id),
    ]);

    return (
      <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:px-10">
          {query.error ? (
            <PageToast
              message={getPartnerPortalErrorMessage(String(query.error)) ?? "Không thể xử lý thao tác vendor lúc này."}
              variant="error"
            />
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white/92 p-6 shadow-sm">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
                <Store className="h-4 w-4" />
                Portal đối tác riêng
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">{vendorName}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 md:text-base">
                  Đây là workspace riêng của đối tác. Bạn chỉ thấy các đơn admin đã giao và có thể cập nhật tiến độ theo thời gian thực.
                </p>
              </div>
            </div>
            <div className="min-w-[220px] rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Link làm việc</p>
              <p className="mt-2 break-all text-sm font-medium text-zinc-900">{ROUTES.PARTNER.PORTAL(vendorSlug)}</p>
            </div>
          </div>

          <PartnerVendorPortalPanel
            summaryUrl="/api/partner/portal-summary"
            initialStats={stats}
            initialAssignments={assignments}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8f1_0%,#fffdf9_42%,#ffffff_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] lg:px-10">
        <div className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/70 bg-white/90 px-4 py-2 text-sm text-amber-900 shadow-sm">
            <Store className="h-4 w-4" />
            Cổng làm việc riêng cho đối tác
          </div>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
              {vendorName}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
              Đây là trang làm việc riêng dành cho đối tác của PinkLove. Tài khoản đối tác không vào trang quản trị nội bộ,
              chỉ xem và cập nhật các đơn hàng đã được admin giao xử lý.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
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

            <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
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

            <Card className="border-zinc-200/80 bg-white/90 shadow-sm">
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

          <div className="rounded-3xl border border-zinc-200/80 bg-white/85 p-6 shadow-sm">
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
          <div className="w-full max-w-[430px] space-y-4">
            <PartnerLoginForm
              title={vendorName}
              description="Đăng nhập để mở workspace đơn hàng riêng của đối tác này."
              returnTo={ROUTES.PARTNER.PORTAL(vendorSlug)}
              portalSlug={vendorSlug}
              embedded
            />
            <Card className="border-dashed border-zinc-300 bg-white/95 shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-6 text-sm text-zinc-600">
                <p>
                  Sau khi đăng nhập, đối tác sẽ đi thẳng vào danh sách đơn được giao thay vì khu quản trị nội bộ.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Portal riêng: {ROUTES.PARTNER.PORTAL(vendorSlug)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
