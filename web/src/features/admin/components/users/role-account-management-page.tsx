import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  children?: React.ReactNode;
};

export function RoleAccountManagementPage({
  role,
  actor,
  users,
  totalAccounts,
  title,
  description,
  createHref,
  listHref,
  createLabel,
  children,
}: RoleAccountManagementPageProps) {
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" render={<Link href="/admin/users">Mở danh sách tổng</Link>} />
          <Button render={<Link href={createHref}>{createLabel}</Link>} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{getRoleLabel(role)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{users.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{getRoleDescription(role)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tỷ trọng trong hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalAccounts === 0 ? 0 : Math.round((users.length / totalAccounts) * 100)}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {users.length}/{totalAccounts} tài khoản
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Tạo mới với vai trò mặc định đã khóa theo actor hiện tại.</p>
            <p>Đổi vai trò hoặc xóa ngay trong bảng để chuyển actor sang nhóm khác.</p>
          </CardContent>
        </Card>
      </div>

      {children}

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{createLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCreateUserForm defaultRole={role} returnTo={listHref} />
        </CardContent>
      </Card>

      <UserManagement
        initialUsers={users}
        actor={actor}
        returnTo={listHref}
        defaultRoleFilter={role}
      />
    </section>
  );
}
