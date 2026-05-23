"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eye } from "lucide-react";
import { toast } from "sonner";

import { AdminDialogOutlineTrigger, AdminIconButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ProviderPortalCopyButtonProps = {
  path: string;
  username: string;
  password: string;
  label?: string;
  className?: string;
};

export function ProviderPortalCopyButton({
  path,
  username,
  password,
  label = "Thông tin đối tác",
  className,
}: ProviderPortalCopyButtonProps) {
  const [copiedField, setCopiedField] = useState<"portal" | "username" | "password" | "all" | null>(null);

  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return path;
    }

    return path.startsWith("/") ? `${window.location.origin}${path}` : path;
  }, [path]);

  const allText = `Portal: ${portalUrl}\nUsername: ${username}\nPassword: ${password}`;

  async function handleCopy(value: string, field: "portal" | "username" | "password" | "all", message: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast(message);
    window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1500);
  }

  return (
    <Dialog>
      <AdminDialogOutlineTrigger className={className}>
        <Eye className="h-4 w-4" />
        {label}
      </AdminDialogOutlineTrigger>
      <DialogContent className="max-w-lg">
        <div className="space-y-6">
          <DialogHeader>
            <DialogTitle>Thông tin gửi đối tác</DialogTitle>
            <DialogDescription>
              Xem nhanh và copy link portal, username và mật khẩu để gửi cho đối tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <p className="text-sm font-medium">Mật khẩu</p>
              <div className="flex items-center gap-2">
                <Input value={password} readOnly />
                <AdminIconButton
                  aria-label="Copy mật khẩu"
                  onClick={() => handleCopy(password, "password", "Đã copy mật khẩu đối tác.")}
                >
                  {copiedField === "password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </AdminIconButton>
              </div>
            </div>
          </div>

          <AdminSubmitButton
            type="button"
            className="w-full"
            onClick={() => handleCopy(allText, "all", "Đã copy toàn bộ thông tin đối tác.")}
          >
            {copiedField === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedField === "all" ? "Đã copy" : "Copy toàn bộ thông tin"}
          </AdminSubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
