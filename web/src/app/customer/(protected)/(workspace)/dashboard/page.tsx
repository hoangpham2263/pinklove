import Link from "next/link";
import { ArrowRight, BadgePercent, FolderHeart, Plus, ShoppingBag, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <Button variant="outline" className="rounded-md" render={<Link href={ROUTES.TEMPLATES}>Tạo từ mẫu</Link>} />
          <Button className="rounded-md" render={<Link href={ROUTES.BUILDER}>Tự tạo thiệp</Link>} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{invitations.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{publishedInvitations}</p>
            <p className="text-sm text-muted-foreground">Draft: {draftInvitations}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Template Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{codedInvitations}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Builder Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{builderInvitations}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Link href={ROUTES.CUSTOMER.INVITATIONS} className="rounded-lg border p-4 transition-colors hover:bg-muted">
              <div className="flex items-center gap-3">
                <FolderHeart className="h-5 w-5" />
                <div>
                  <p className="font-medium">My Invitations</p>
                  <p className="text-sm text-muted-foreground">Quản lý toàn bộ thiệp của bạn.</p>
                </div>
              </div>
            </Link>
            <Link href={ROUTES.CUSTOMER.ORDERS} className="rounded-lg border p-4 transition-colors hover:bg-muted">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5" />
                <div>
                  <p className="font-medium">Đơn hàng</p>
                  <p className="text-sm text-muted-foreground">Theo dõi checkout, thanh toán và giao hàng.</p>
                </div>
              </div>
            </Link>
            <Link href={ROUTES.CUSTOMER.CONFIG_PROFILE} className="rounded-lg border p-4 transition-colors hover:bg-muted">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Profile</p>
                  <p className="text-sm text-muted-foreground">Cập nhật hồ sơ và thông tin hiển thị.</p>
                </div>
              </div>
            </Link>
            <Link href={ROUTES.CUSTOMER.AFFILIATE} className="rounded-lg border p-4 transition-colors hover:bg-muted">
              <div className="flex items-center gap-3">
                <BadgePercent className="h-5 w-5" />
                <div>
                  <p className="font-medium">Affiliate</p>
                  <p className="text-sm text-muted-foreground">Theo dõi trạng thái và link giới thiệu.</p>
                </div>
              </div>
            </Link>
            {vendorActor ? (
              <Link href={ROUTES.CUSTOMER.VENDOR} className="rounded-lg border p-4 transition-colors hover:bg-muted">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Vendor Workspace</p>
                    <p className="text-sm text-muted-foreground">Theo dõi thông tin vận hành dành cho nhà cung cấp.</p>
                  </div>
                </div>
              </Link>
            ) : null}
            <Link href={ROUTES.BUILDER} className="rounded-lg border p-4 transition-colors hover:bg-muted">
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5" />
                <div>
                  <p className="font-medium">Create New Site</p>
                  <p className="text-sm text-muted-foreground">Bắt đầu với builder hoặc template.</p>
                </div>
              </div>
            </Link>
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
