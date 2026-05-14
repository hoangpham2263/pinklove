import { Percent, Plus, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminCreateLinkButton, AdminDialogCreateTrigger, AdminLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import type { AccountUser, AuthUser } from "@/lib/auth";
import { getRoleDescription, getRoleLabel, type UserRole } from "@/lib/roles";
import { UserManagement } from "@/features/admin/components/users/user-management";
import { QuickCreateUserForm } from "@/features/admin/components/users/quick-create-user-form";

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
  showInlineCreateForm?: boolean;
  useCreateDialog?: boolean;
  showVendorWorkspaceColumn?: boolean;
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
  showInlineCreateForm = true,
  useCreateDialog = false,
  showVendorWorkspaceColumn = false,
  children,
}: RoleAccountManagementPageProps) {
  const roleShare = totalAccounts === 0 ? 0 : Math.round((users.length / totalAccounts) * 100);
  const createForm = <QuickCreateUserForm defaultRole={role} returnTo={listHref} />;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title={getRoleLabel(role)} value={users.length} description={getRoleDescription(role)} icon={Users} />
        <AdminOverviewCard title="Tỷ trọng trong hệ thống" value={`${roleShare}%`} description={`${users.length}/${totalAccounts} tài khoản`} icon={Percent} />
        <AdminOverviewCard title="Thao tác nhanh" icon={Plus} contentClassName="flex flex-wrap gap-3">
            <AdminLinkButton href="/admin/users">Mở danh sách tổng</AdminLinkButton>
            {useCreateDialog ? (
              <Dialog>
                <AdminDialogCreateTrigger>
                  {createLabel}
                </AdminDialogCreateTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{createLabel}</DialogTitle>
                    <DialogDescription>Tạo tài khoản mới với vai trò mặc định của nhóm hiện tại.</DialogDescription>
                  </DialogHeader>
                  {createForm}
                </DialogContent>
              </Dialog>
            ) : (
              <AdminCreateLinkButton href={createHref}>{createLabel}</AdminCreateLinkButton>
            )}
        </AdminOverviewCard>
      </AdminOverviewGrid>

      {children}

      {showInlineCreateForm ? (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{createLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            {createForm}
          </CardContent>
        </Card>
      ) : null}

      <UserManagement
        initialUsers={users}
        actor={actor}
        returnTo={listHref}
        defaultRoleFilter={role}
        showVendorWorkspaceColumn={showVendorWorkspaceColumn}
      />
    </section>
  );
}
