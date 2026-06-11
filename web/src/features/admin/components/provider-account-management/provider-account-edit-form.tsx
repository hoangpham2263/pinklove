"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PasswordInput } from "@/components/common/password-input";
import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AccountUser } from "@/lib/auth";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type ProviderAccountEditFormProps = {
  provider: AccountUser;
};

export function ProviderAccountEditForm({ provider }: ProviderAccountEditFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await adminApi.updateUser(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã cập nhật provider.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật provider.");
    }
  }

  return (
    <NativeForm id="provider-update-form" action={adminApiActions.updateUser} method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="userId" value={provider.id} />
      <input type="hidden" name="accessRole" value={`portal:${USER_ROLES.PROVIDER}`} />
      <input type="hidden" name="returnTo" value={ROUTES.ADMIN.PROVIDER_ACCOUNT(provider.id)} />

      <Card className="min-w-0 overflow-visible rounded-lg gap-0">
        <CardHeader className="border-b gap-0 pb-0">
          <CardTitle>Thông tin provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="provider-username" className="text-sm font-medium">Username</label>
              <Input id="provider-username" name="username" defaultValue={provider.username} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="provider-password" className="text-sm font-medium">Mật khẩu mới</label>
              <PasswordInput
                id="provider-password"
                name="password"
                value={password}
                placeholder="Nhập mật khẩu mới hoặc tạo tự động"
                allowGenerate
                onValueChange={setPassword}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="provider-full-name" className="text-sm font-medium">Họ tên</label>
              <Input id="provider-full-name" name="fullName" defaultValue={provider.fullName ?? ""} />
            </div>
            <div className="space-y-2">
              <label htmlFor="provider-display-name" className="text-sm font-medium">Display name</label>
              <Input id="provider-display-name" name="displayName" defaultValue={provider.displayName ?? ""} />
            </div>
            <div className="space-y-2">
              <label htmlFor="provider-phone" className="text-sm font-medium">Điện thoại</label>
              <Input id="provider-phone" name="phone" defaultValue={provider.phone ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="provider-bio" className="text-sm font-medium">Bio</label>
            <Textarea
              id="provider-bio"
              name="bio"
              defaultValue={provider.bio ?? ""}
              className="min-h-32"
            />
          </div>

        </CardContent>
      </Card>
    </NativeForm>
  );
}
