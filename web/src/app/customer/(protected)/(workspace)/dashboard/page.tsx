import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, FolderHeart, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerActionLinkTile, CustomerCreateLinkButton, CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import { CustomerOverviewCard, CustomerOverviewGrid } from "@/features/customer/ui/customer-overview-card";
import { requireAppUser } from "@/lib/auth";
import { isVendorRole } from "@/lib/roles";
import { getInvitationPath } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { listInvitationsForUser } from "@/features/invitations/server/service";
import { getAffiliateAccountForUser } from "@/features/affiliate/server/service";
import { InvitationCard } from "@/features/invitations/components/invitation-card";

function getAffiliateStatusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "rejected") return "Rejected";
  if (status === "blocked") return "Blocked";
  return "Pending";
}

export default async function CustomerDashboardPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [invitations, affiliateAccount] = await Promise.all([
    listInvitationsForUser(user.id),
    getAffiliateAccountForUser(user.id),
  ]);

  const publishedInvitations = invitations.filter((invitation) => invitation.status === "published").length;
  const draftInvitations = invitations.length - publishedInvitations;
  const codedInvitations = invitations.filter((invitation) => invitation.siteType === "coded_template").length;
  const builderInvitations = invitations.length - codedInvitations;
  const recentInvitations = invitations.slice(0, 2);
  const vendorActor = isVendorRole(user.role);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi thiệp cưới, hồ sơ cá nhân và trạng thái affiliate của bạn tại một nơi.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CustomerLinkButton href={ROUTES.TEMPLATES}>Tạo từ mẫu</CustomerLinkButton>
          <CustomerCreateLinkButton href={ROUTES.BUILDER}>Tự tạo thiệp</CustomerCreateLinkButton>
        </div>
      </div>

      <CustomerOverviewGrid>
        <CustomerOverviewCard title="Tổng thiệp" value={invitations.length} description="Toàn bộ thiệp trong tài khoản" icon={LayoutDashboard} />
        <CustomerOverviewCard title="Published" value={publishedInvitations} description={`Draft: ${draftInvitations}`} icon={CheckCircle2} />
        <CustomerOverviewCard title="Template Invitations" value={codedInvitations} icon={FolderHeart} />
        <CustomerOverviewCard title="Builder Invitations" value={builderInvitations} icon={FileText} />
      </CustomerOverviewGrid>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.INVITATIONS} label="My Invitations" description="Quản lý toàn bộ thiệp của bạn." showArrow />
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.ORDERS} label="Đơn hàng" description="Theo dõi checkout, thanh toán và giao hàng." showArrow />
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.CONFIG_PROFILE} label="Profile" description="Cập nhật hồ sơ và thông tin hiển thị." showArrow />
            <CustomerActionLinkTile href={ROUTES.CUSTOMER.AFFILIATE} label="Affiliate" description="Theo dõi trạng thái và link giới thiệu." showArrow />
            {vendorActor ? (
              <CustomerActionLinkTile href={ROUTES.CUSTOMER.VENDOR} label="Vendor Workspace" description="Theo dõi thông tin vận hành dành cho nhà cung cấp." showArrow />
            ) : null}
            <CustomerActionLinkTile href={ROUTES.BUILDER} label="Create New Site" description="Bắt đầu với builder hoặc template." showArrow />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Affiliate Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!affiliateAccount ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Bạn chưa đăng ký affiliate. Khi cần chia sẻ link giới thiệu, hãy bật tài khoản affiliate tại trang riêng.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={affiliateAccount.status === "active" ? "default" : "secondary"}>
                      {getAffiliateStatusLabel(affiliateAccount.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="font-semibold">{affiliateAccount.code}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-semibold">{affiliateAccount.clickCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-semibold">{affiliateAccount.conversionCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="text-2xl font-semibold">{affiliateAccount.earnedCommission}</p>
                  </div>
                </div>
              </>
            )}
            <Button
              variant="outline"
              className="w-full rounded-md"
              render={
                <Link href={ROUTES.CUSTOMER.AFFILIATE}>
                  Mở Affiliate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Recent Invitations</CardTitle>
          <Button
            variant="outline"
            className="rounded-md"
            render={<Link href={ROUTES.CUSTOMER.INVITATIONS}>Xem tất cả</Link>}
          />
        </CardHeader>
        <CardContent>
          {recentInvitations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Chưa có thiệp nào. Bạn có thể bắt đầu từ mẫu sẵn hoặc builder.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {recentInvitations.map((invitation) => (
                <InvitationCard key={invitation.id} invitation={invitation} publicHref={getInvitationPath(invitation)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
