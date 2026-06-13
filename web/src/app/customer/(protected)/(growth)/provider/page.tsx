import Link from "next/link";
import { ExternalLink, Settings2, Store, UserCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { isProviderRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-base font-semibold">{value}</p>
    </div>
  );
}

function ActionLink({ href, label, disabled = false }: { href: string; label: string; disabled?: boolean }) {
  if (disabled) {
    return (
      <Button className="w-full justify-start" variant="outline" disabled>
        {label}
      </Button>
    );
  }

  return (
    <Button className="w-full justify-between" variant="outline" render={<Link href={href}>{label}<ExternalLink className="size-4" /></Link>} />
  );
}

export default async function CustomerProviderPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const profile = await getUserProfile(user.id);
  const isProvider = isProviderRole(user.role);
  const displayName = profile.displayName || profile.fullName || user.username;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Không gian nhà cung cấp</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Quản lý trạng thái tài khoản provider, lối vào portal vận hành và hồ sơ hiển thị.
          </p>
        </div>
        <Badge className="rounded-full border bg-muted/40 px-3 py-1 text-muted-foreground">
          {isProvider ? "Provider active" : "Chưa kích hoạt provider"}
        </Badge>
      </div>

      {!isProvider ? (
        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle>Vai trò hiện tại chưa phải provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Tài khoản này vẫn có thể truy cập khu customer chung, nhưng chưa được gắn actor `PROVIDER`.</p>
            <Button variant="outline" render={<Link href={ROUTES.CUSTOMER.DASHBOARD}>Quay lại dashboard</Link>} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-9">
          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                  <Store className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Tóm tắt tài khoản provider</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Thông tin định danh dùng để chuyển qua portal vận hành.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <SummaryBox label="Tên đăng nhập" value={user.username} />
              <SummaryBox label="Tên hiển thị" value={displayName} />
              <SummaryBox label="Điện thoại" value={profile.phone || "Chưa cập nhật"} />
              <SummaryBox label="Vai trò" value={isProvider ? "PROVIDER" : user.role} />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40">
                  <Settings2 className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Flow hiện tại</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Các bước vận hành provider đang được gom trong portal riêng.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 text-sm md:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="font-medium">1. Cập nhật hồ sơ</p>
                <p className="mt-2 text-muted-foreground">Provider hoàn thiện thông tin, avatar, địa chỉ và hồ sơ dịch vụ/sản phẩm.</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="font-medium">2. Admin review</p>
                <p className="mt-2 text-muted-foreground">Admin duyệt hồ sơ theo table, nhập giá bán thực tế rồi đẩy vào catalog live.</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="font-medium">3. Theo dõi vận hành</p>
                <p className="mt-2 text-muted-foreground">Đơn, lead, quote và thông báo được xử lý trong workspace provider.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-3">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Hồ sơ hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} className="h-24 w-24 rounded-full border object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-muted/40">
                    <UserCircle2 className="size-10 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{profile.providerPortalSlug || "Chưa có portal slug"}</p>
                </div>
              </div>
              <Button className="w-full" render={<Link href={ROUTES.CUSTOMER.CONFIG_PROFILE}>Cập nhật hồ sơ</Link>} />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionLink href={ROUTES.PROVIDER.ROOT} label="Mở portal provider" disabled={!isProvider} />
              <ActionLink href={ROUTES.PROVIDER.OFFERINGS} label="Quản lý dịch vụ/sản phẩm" disabled={!isProvider} />
              <ActionLink href={ROUTES.PROVIDER.ORDERS} label="Danh sách đơn provider" disabled={!isProvider} />
              <ActionLink href={ROUTES.CUSTOMER.CONFIG} label="Configs tài khoản" />
              <ActionLink href={ROUTES.CUSTOMER.INVITATIONS} label="Thiệp đang quản lý" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
