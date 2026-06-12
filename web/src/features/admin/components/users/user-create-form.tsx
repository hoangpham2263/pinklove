"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { PasswordInput } from "@/components/common/password-input";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminField, AdminInput, AdminSelect } from "@/features/admin/components/admin-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { USER_ROLE_OPTIONS, type UserRole, USER_ROLES, getRoleLabel } from "@/lib/roles";
import type { AdminRole } from "@/features/access/server/service";

type UserCreateFormProps = {
  defaultRole?: UserRole;
  returnTo?: string;
  adminRoles?: AdminRole[];
};

export function UserCreateForm({
  defaultRole = USER_ROLES.CUSTOMER,
  returnTo,
  adminRoles = [],
}: UserCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultAccessRole = defaultRole === USER_ROLES.ADMIN
    ? `admin:${adminRoles.find((role) => role.key === "super_admin")?.id ?? ""}`
    : `portal:${defaultRole}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);

    try {
      const result = await adminApi.createUser(new FormData(form));
      toast.success(result.message ?? "Đã tạo tài khoản mới.");
      finishMutation(router, result, { redirect: false });
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm
      id="user-create-form"
      action={adminApiActions.createUser}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Tên đăng nhập">
                <AdminInput name="username" required />
              </AdminField>
              <AdminField label="Mật khẩu">
                <PasswordInput
                  name="password"
                  placeholder="Nhập mật khẩu hoặc tạo tự động"
                  autoComplete="new-password"
                  allowGenerate
                  required
                />
              </AdminField>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Hồ sơ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Họ và tên">
                <AdminInput name="fullName" />
              </AdminField>
              <AdminField label="Tên hiển thị">
                <AdminInput name="displayName" />
              </AdminField>
              <AdminField label="Số điện thoại">
                <AdminInput name="phone" />
              </AdminField>
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
            <AdminField label="Vai trò">
              <AdminSelect
                name="accessRole"
                defaultValue={defaultAccessRole}
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
              </AdminSelect>
            </AdminField>

            <AdminSubmitButton className="h-10 w-full rounded-md" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
            </AdminSubmitButton>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
