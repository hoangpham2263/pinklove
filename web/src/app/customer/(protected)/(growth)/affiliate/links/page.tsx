import { headers } from "next/headers";
import { BadgePercent, MousePointerClick, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AffiliateLinkBuilder } from "@/features/affiliate/components/affiliate-link-builder";
import { getAffiliateAccountForUser } from "@/features/affiliate/server/service";
import { CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import { CustomerOverviewCard, CustomerOverviewGrid } from "@/features/customer/ui/customer-overview-card";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSiteUrlFromHeaderValues } from "@/lib/seo";

export default async function CustomerAffiliateLinksPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const account = await getAffiliateAccountForUser(user.id);
  const headerStore = await headers();
  const origin = getSiteUrlFromHeaderValues({
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    forwardedProto: headerStore.get("x-forwarded-proto"),
  });

  if (!account) {
    return (
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle>Chưa đăng ký affiliate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Bạn cần đăng ký chương trình affiliate trước khi tạo link giới thiệu.</p>
            <CustomerLinkButton href={ROUTES.CUSTOMER.AFFILIATE}>Mở trang affiliate</CustomerLinkButton>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (account.status !== "active") {
    return (
      <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle>Tài khoản affiliate chưa active</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Tài khoản hiện đang ở trạng thái <span className="font-medium text-foreground">{account.status}</span>.
              Link chỉ nên tạo và gửi khi admin đã duyệt active để tracking hoạt động.
            </p>
            <CustomerLinkButton href={ROUTES.CUSTOMER.AFFILIATE}>Xem trạng thái affiliate</CustomerLinkButton>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo link affiliate</h1>
          <p className="text-sm text-muted-foreground">
            Nhập link trong website, tạo link gắn mã affiliate rồi gửi cho khách.
          </p>
        </div>
        <CustomerLinkButton href={ROUTES.CUSTOMER.AFFILIATE}>Tổng quan affiliate</CustomerLinkButton>
      </div>

      <CustomerOverviewGrid>
        <CustomerOverviewCard title="Mã affiliate" value={account.code} description="Mã đang active" icon={BadgePercent} />
        <CustomerOverviewCard title="Clicks" value={account.clickCount} description="Tổng click đã ghi nhận" icon={MousePointerClick} />
        <CustomerOverviewCard title="Conversions" value={account.conversionCount} description="Conversion đã duyệt/paid" icon={TrendingUp} />
      </CustomerOverviewGrid>

      <AffiliateLinkBuilder code={account.code} origin={origin} />
    </section>
  );
}
