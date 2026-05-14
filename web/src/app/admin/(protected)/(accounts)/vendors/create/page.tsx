import { Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";
import { listAccountsByRole, requireAdmin } from "@/lib/auth";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type AdminVendorsCreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminVendorsCreatePage({ searchParams }: AdminVendorsCreatePageProps) {
  await requireAdmin();
  await searchParams;
  const vendors = await listAccountsByRole(USER_ROLES.VENDOR);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo xưởng in / nhà cung cấp</h1>
      </div>

      <AdminOverviewGrid className="md:grid-cols-1 lg:grid-cols-1">
        <AdminOverviewCard title={getRoleLabel(USER_ROLES.VENDOR)} value={vendors.length} icon={Building2} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Tạo tài khoản nhà cung cấp</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm defaultRole={USER_ROLES.VENDOR} returnTo={ROUTES.ADMIN.VENDORS} />
        </CardContent>
      </Card>
    </section>
  );
}
