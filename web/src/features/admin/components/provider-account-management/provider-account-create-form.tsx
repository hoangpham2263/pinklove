"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PasswordInput } from "@/components/common/password-input";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminCancelButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { getRoleLabel, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type ProviderAccountCreateFormProps = {
  returnTo?: string;
};

export function ProviderAccountCreateForm({
  returnTo = ROUTES.ADMIN.PROVIDER_ACCOUNTS,
}: ProviderAccountCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.createUser(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo nhà cung cấp.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo nhà cung cấp.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm
      action={adminApiActions.createUser}
      method="POST"
      className="grid gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="accessRole" value={`portal:${USER_ROLES.PROVIDER}`} />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Tài khoản provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="provider-email" className="text-sm font-medium">Email</label>
                <Input id="provider-email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="provider-accountName" className="text-sm font-medium">Tên tài khoản</label>
                <Input id="provider-accountName" name="accountName" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="provider-password" className="text-sm font-medium">Mật khẩu</label>
                <PasswordInput
                  id="provider-password"
                  name="password"
                  placeholder="Nhập mật khẩu hoặc tạo tự động"
                  autoComplete="new-password"
                  allowGenerate
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-visible rounded-lg gap-0">
          <CardHeader className="border-b gap-0 pb-0">
            <CardTitle>Hồ sơ provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="provider-full-name" className="text-sm font-medium">Họ và tên</label>
                <Input id="provider-full-name" name="fullName" />
              </div>
              <div className="space-y-2">
                <label htmlFor="provider-display-name" className="text-sm font-medium">Tên hiển thị</label>
                <Input id="provider-display-name" name="displayName" />
              </div>
              <div className="space-y-2">
                <label htmlFor="provider-phone" className="text-sm font-medium">Số điện thoại</label>
                <Input id="provider-phone" name="phone" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="provider-bio" className="text-sm font-medium">Bio</label>
              <Textarea
                id="provider-bio"
                name="bio"
                className="min-h-32"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 lg:col-span-3">
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card className="min-w-0 rounded-lg">
            <CardHeader>
              <CardTitle>Tạo provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium">Vai trò</label>
                <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
                  {getRoleLabel(USER_ROLES.PROVIDER)} ({USER_ROLES.PROVIDER})
                </div>
              </div>

              <div className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
                Sau khi tạo, provider sẽ xuất hiện trong danh sách tài khoản provider và có thể đăng nhập portal.
              </div>

              <div className="space-y-3 border-t pt-4">
                <AdminSubmitButton className="w-full rounded-md" disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Tạo nhà cung cấp"}
                </AdminSubmitButton>
                <AdminCancelButton
                  type="button"
                  className="w-full rounded-md"
                  render={<Link href={returnTo}>Hủy</Link>}
                  nativeButton={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </NativeForm>
  );
}
