"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/confirm-provider";
import { NativeForm } from "@/components/common/native-form";
import { PasswordInput } from "@/components/common/password-input";
import { AdminDeleteButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AccountUser, AuthUser, UserProfile } from "@/lib/auth";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { USER_ROLE_OPTIONS, USER_ROLES, getRoleLabel } from "@/lib/roles";
import type { AdminRole } from "@/features/access/server/service";

type EditUserFormProps = {
  actor: AuthUser;
  user: AccountUser;
  profile: UserProfile | null;
  returnTo?: string;
  adminRoles: AdminRole[];
};

export function EditUserForm({ actor, user, profile, returnTo, adminRoles }: EditUserFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentAccessRole = user.role === USER_ROLES.ADMIN
    ? `admin:${user.adminRoleId}`
    : `portal:${user.role}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await adminApi.updateUser(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã cập nhật tài khoản.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật người dùng.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const isConfirmed = await confirm({
      title: "Xóa người dùng",
      description: `Bạn có chắc chắn muốn xóa người dùng: ${user.username}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });

    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      if (returnTo) {
        formData.append("returnTo", returnTo);
      }
      const result = await adminApi.deleteUser(formData);
      toast.success(result.message ?? "Đã xóa tài khoản.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tài khoản.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <NativeForm
      id="user-update-form"
      action={adminApiActions.updateUser}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="userId" value={user.id} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên đăng nhập</label>
                <Input name="username" defaultValue={user.username} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mật khẩu mới (để trống nếu không đổi)</label>
                <PasswordInput name="password" placeholder="Nhập mật khẩu mới hoặc tạo tự động" autoComplete="new-password" allowGenerate />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Hồ sơ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ và tên</label>
                <Input name="fullName" defaultValue={profile?.fullName ?? ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên hiển thị</label>
                <Input name="displayName" defaultValue={profile?.displayName ?? ""} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input name="phone" defaultValue={profile?.phone ?? ""} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tiểu sử</label>
              <Textarea
                name="bio"
                defaultValue={profile?.bio ?? ""}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Thiết lập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Vai trò</label>
              <select
                name="accessRole"
                defaultValue={currentAccessRole}
                disabled={user.id === actor.id}
                className="h-10 w-full disabled:opacity-50"
              >
                {adminRoles.filter((role) => role.isActive).map((role) => (
                  <option key={role.id} value={`admin:${role.id}`}>
                    {role.key === "super_admin" ? "Admin" : role.label}
                  </option>
                ))}
                {USER_ROLE_OPTIONS.filter((role) => role.value !== USER_ROLES.ADMIN).map((role) => (
                  <option key={role.value} value={`portal:${role.value}`}>
                    {getRoleLabel(role.value)} ({role.value})
                  </option>
                ))}
                </select>
            </div>

            <AdminSubmitButton className="w-full rounded-md" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </AdminSubmitButton>

            {user.id !== actor.id ? (
              <div className="border-t pt-4">
                <AdminDeleteButton className="w-full rounded-md" disabled={isDeleting} onClick={() => void handleDelete()}>
                  {isDeleting ? "Đang xóa..." : "Xóa người dùng"}
                </AdminDeleteButton>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
