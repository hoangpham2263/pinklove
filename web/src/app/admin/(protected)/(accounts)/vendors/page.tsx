import Link from "next/link";

import { VendorPortalCopyButton } from "@/features/admin/components/vendors/vendor-portal-copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureVendorPortalSlug, requireAdmin, listAccounts, listAccountsByRole } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { RoleAccountManagementPage } from "@/features/admin/components/users/role-account-management-page";

type AdminVendorsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminVendorsPage({ searchParams }: AdminVendorsPageProps) {
  const actor = await requireAdmin();
  await searchParams;
  const [users, allUsers] = await Promise.all([
    listAccountsByRole(USER_ROLES.VENDOR),
    listAccounts(),
  ]);
  const vendors = await Promise.all(
    users.map(async (vendor) => ({
      ...vendor,
      vendorPortalSlug: vendor.vendorPortalSlug || (await ensureVendorPortalSlug(vendor.id)) || "",
    }))
  );

  return (
    <RoleAccountManagementPage
      role={USER_ROLES.VENDOR}
      actor={actor}
      users={vendors}
      totalAccounts={allUsers.length}
      title="Quản lý xưởng in / nhà cung cấp"
      description="Nhóm actor này dành cho đối tác cung ứng sản phẩm hoặc dịch vụ. Có thể dùng để tách riêng nhà cung cấp khỏi khách hàng thông thường."
      createHref={ROUTES.ADMIN.VENDORS_CREATE}
      listHref={ROUTES.ADMIN.VENDORS}
      createLabel="Tạo nhà cung cấp"
    >
      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Workspace theo từng vendor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có vendor account nào để mở trang quản lý riêng.</p>
          ) : (
            vendors.map((vendor) => (
              <div key={vendor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <p className="font-medium">{vendor.displayName || vendor.fullName || vendor.username}</p>
                  <p className="text-sm text-muted-foreground">
                    @{vendor.username} {vendor.phone ? `• ${vendor.phone}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{ROUTES.PARTNER.PORTAL(vendor.vendorPortalSlug)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <VendorPortalCopyButton
                    label="Xem thông tin"
                    path={ROUTES.PARTNER.PORTAL(vendor.vendorPortalSlug)}
                    username={vendor.username}
                    password="12313"
                  />
                  <Button variant="outline" render={<Link href={ROUTES.PARTNER.PORTAL(vendor.vendorPortalSlug)}>Portal Link</Link>} />
                  <Button variant="outline" render={<Link href={ROUTES.ADMIN.VENDOR(vendor.id)}>Quản lý đơn riêng</Link>} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </RoleAccountManagementPage>
  );
}
