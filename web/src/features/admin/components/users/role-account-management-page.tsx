import { Percent, Plus, Users } from "lucide-react";

import { AdminCreateLinkButton, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import type { AccountUser, AuthUser } from "@/lib/auth";
import { getRoleDescription, getRoleLabel, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { UserManagement } from "@/features/admin/components/users/user-management";

type RoleAccountManagementPageProps = {
  role: UserRole;
  actor: AuthUser;
  users: AccountUser[];
  totalAccounts: number;
  title: string;
  description: string;
  createHref: string;
  listHref: string;
  createLabel: string;
  showProviderWorkspaceColumn?: boolean;
  children?: React.ReactNode;
};

export function RoleAccountManagementPage({
  role,
  actor,
  users,
  totalAccounts,
  createHref,
  listHref,
  createLabel,
  showProviderWorkspaceColumn = false,
  children,
}: RoleAccountManagementPageProps) {
  const roleShare = totalAccounts === 0 ? 0 : Math.round((users.length / totalAccounts) * 100);
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title={getRoleLabel(role)} value={users.length} description={getRoleDescription(role)} icon={Users} />
        <AdminOverviewCard title="Tỷ trọng trong hệ thống" value={`${roleShare}%`} description={`${users.length}/${totalAccounts} tài khoản`} icon={Percent} />
        <AdminOverviewCard title="Thao tác nhanh" icon={Plus} contentClassName="flex flex-wrap gap-3">
            <AdminLinkButton href={ROUTES.ADMIN.USERS}>Mở danh sách tổng</AdminLinkButton>
            <AdminCreateLinkButton href={createHref}>{createLabel}</AdminCreateLinkButton>
        </AdminOverviewCard>
      </AdminOverviewGrid>

      {children}

      <UserManagement
        initialUsers={users}
        actor={actor}
        returnTo={listHref}
        defaultRoleFilter={role}
        showProviderWorkspaceColumn={showProviderWorkspaceColumn}
      />
    </section>
  );
}
