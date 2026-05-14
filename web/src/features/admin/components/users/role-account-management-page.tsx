import Link from "next/link";
import { Percent, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">{getRoleLabel(role)}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{users.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getRoleDescription(role)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Tỷ trọng trong hệ thống</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{roleShare}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {users.length}/{totalAccounts} tài khoản
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm">Thao tác nhanh</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/admin/users">Mở danh sách tổng</Link>} />
            {useCreateDialog ? (
              <Dialog>
                <DialogTrigger render={<Button />}>
                  {createLabel}
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{createLabel}</DialogTitle>
                    <DialogDescription>Tạo tài khoản mới với vai trò mặc định của nhóm hiện tại.</DialogDescription>
                  </DialogHeader>
                  {createForm}
                </DialogContent>
              </Dialog>
            ) : (
              <Button render={<Link href={createHref}>{createLabel}</Link>} />
            )}
          </CardContent>
        </Card>
      </div>

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
