import { BadgePercent, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { requireAdmin, listAccounts, countAdmins } from "@/lib/auth";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";

type AdminUserCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUserCreatePage({ searchParams }: AdminUserCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const users = await listAccounts();
  const adminCount = await countAdmins();
  const customerCount = users.filter((user) => user.role === USER_ROLES.CUSTOMER).length;
  const affiliateCount = users.filter((user) => user.role === USER_ROLES.AFFILIATE).length;
  const vendorCount = users.filter((user) => user.role === USER_ROLES.VENDOR).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo người dùng</h1>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng người dùng" value={users.length} icon={Users} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.ADMIN)} value={adminCount} icon={ShieldCheck} />
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.CUSTOMER)} value={customerCount} icon={UserPlus} />
        <AdminOverviewCard title="Đối tác + Vendor" value={affiliateCount + vendorCount} description={`Affiliate: ${affiliateCount} • Vendor: ${vendorCount}`} icon={BadgePercent} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo tài khoản mới</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm />
        </CardContent>
      </Card>
    </section>
  );
}
