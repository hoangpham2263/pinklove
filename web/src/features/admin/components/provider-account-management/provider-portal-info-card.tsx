"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/common/password-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminIconButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";

type ProviderPortalInfoCardProps = {
  path: string;
  username: string;
};

export function ProviderPortalInfoCard({ path, username }: ProviderPortalInfoCardProps) {
  const [copiedField, setCopiedField] = useState<"portal" | "username" | "all" | null>(null);
  const [password, setPassword] = useState("");
  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return path;
    }

    return path.startsWith("/") ? `${window.location.origin}${path}` : path;
  }, [path]);
  const allText = `Portal: ${portalUrl}\nUsername: ${username}${password ? `\nPassword: ${password}` : ""}`;

  async function handleCopy(value: string, field: "portal" | "username" | "all", message: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast(message);
    window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
  }

  return (
    <Card className="min-w-0 rounded-lg">
      <CardHeader>
        <CardTitle>Thông tin gửi đối tác</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Portal link</p>
          <div className="flex items-center gap-2">
            <Input value={portalUrl} readOnly />
            <AdminIconButton
              aria-label="Copy link portal"
              onClick={() => handleCopy(portalUrl, "portal", "Đã copy link portal đối tác.")}
            >
              {copiedField === "portal" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </AdminIconButton>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Username</p>
          <div className="flex items-center gap-2">
            <Input value={username} readOnly />
            <AdminIconButton
              aria-label="Copy username"
              onClick={() => handleCopy(username, "username", "Đã copy username đối tác.")}
            >
              {copiedField === "username" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </AdminIconButton>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Password gửi đối tác</p>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <PasswordInput
                value={password}
                placeholder="Nhập hoặc tạo mật khẩu mới"
                autoComplete="new-password"
                allowGenerate
                onValueChange={setPassword}
              />
            </div>
            <AdminIconButton
              type="button"
              aria-label="Copy password"
              disabled={!password}
              onClick={() => handleCopy(password, "all", "Đã copy password đối tác.")}
            >
              <Copy className="h-4 w-4" />
            </AdminIconButton>
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Mật khẩu cũ không thể xem lại. Hãy đặt mật khẩu mới nếu cần gửi thông tin đăng nhập.
        </div>

        <div className="flex justify-end">
          <AdminSubmitButton
            type="button"
            className="rounded-md"
            onClick={() => handleCopy(allText, "all", "Đã copy toàn bộ thông tin đối tác.")}
          >
            {copiedField === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedField === "all" ? "Đã copy" : "Copy toàn bộ"}
          </AdminSubmitButton>
        </div>
      </CardContent>
    </Card>
  );
}
