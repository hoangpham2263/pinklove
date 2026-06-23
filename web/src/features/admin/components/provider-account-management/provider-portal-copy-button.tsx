"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eye } from "lucide-react";
import { toast } from "sonner";

import { AdminDialogOutlineTrigger, AdminIconButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ProviderPortalCopyButtonProps = {
  path: string;
  email: string;
  label?: string;
  className?: string;
};

export function ProviderPortalCopyButton({
  path,
  email,
  label = "Thông tin đối tác",
  className,
}: ProviderPortalCopyButtonProps) {
  const [copiedField, setCopiedField] = useState<"portal" | "email" | "all" | null>(null);

  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return path;
    }

    return path.startsWith("/") ? `${window.location.origin}${path}` : path;
  }, [path]);

  const allText = `Portal: ${portalUrl}\nEmail: ${email}`;

  async function handleCopy(value: string, field: "portal" | "email" | "all", message: string) {
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
              Copy link portal và email để gửi cho đối tác. Mật khẩu không thể xem lại sau khi đã hash; nếu cần gửi mật khẩu mới, hãy đặt lại trong màn hình sửa tài khoản.
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
              <p className="text-sm font-medium">Email</p>
              <div className="flex items-center gap-2">
                <Input value={email} readOnly />
                <AdminIconButton
                  aria-label="Copy email"
                  onClick={() => handleCopy(email, "email", "Đã copy email đối tác.")}
                >
                  {copiedField === "email" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </AdminIconButton>
              </div>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Không hiển thị mật khẩu cũ để tránh gửi sai. Hãy reset mật khẩu nếu đối tác cần thông tin đăng nhập mới.
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
