"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { PasswordInput } from "@/components/common/password-input";
import { AdminField, AdminInput, AdminSelect } from "@/features/admin/components/admin-form";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import type { EmailSettings } from "@/lib/system-settings";

type EmailSettingsFormProps = {
  email: EmailSettings;
};

export function EmailSettingsForm({ email }: EmailSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(email.enabled);
  const [transport, setTransport] = useState(email.transport);
  const [smtpSecure, setSmtpSecure] = useState(email.smtpSecure);
  const [fromEmail, setFromEmail] = useState(email.fromEmail);
  const [smtpHost, setSmtpHost] = useState(email.smtpHost);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const isReadyToSend = enabled && Boolean(fromEmail.trim()) && (transport === "log" || Boolean(smtpHost.trim()));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("section", "email");
      formData.set("enabled", enabled ? "on" : "");
      formData.set("transport", transport);
      formData.set("smtpSecure", smtpSecure ? "on" : "");

      const result = await adminApi.updateConfig(formData);
      toast.success(result.message ?? "Đã lưu cấu hình email.");
      setLastSavedAt(new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
      finishMutation(router, result, { redirect: false, refresh: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình email.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.updateConfig} method="POST" className="space-y-5" onSubmit={handleSubmit}>
      <div className={`rounded-md border px-4 py-3 text-sm ${isReadyToSend ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        <p className="font-medium">
          {isReadyToSend ? "Cấu hình cơ bản đã đủ để gửi email." : "Cấu hình email chưa đủ để gửi."}
        </p>
        <p className="mt-1">
          {isReadyToSend
            ? "Hãy dùng Custom Template Demo bên phải để gửi thử và xác nhận SMTP hoạt động thật."
            : "Cần bật gửi email, nhập Email người gửi, và nếu dùng SMTP thì phải có SMTP host."}
        </p>
        {lastSavedAt ? <p className="mt-1">Đã lưu lúc {lastSavedAt}.</p> : null}
      </div>

      <section className="rounded-md border bg-background p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Trạng thái gửi mail</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bật gửi mail thật và chọn cách gửi. Local có thể dùng Log để test flow.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex min-h-10 items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm font-medium">Bật gửi email</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4"
            />
          </label>
          <AdminField label="Transport">
            <AdminSelect value={transport} onChange={(event) => setTransport(event.target.value as EmailSettings["transport"])}>
              <option value="log">Log server</option>
              <option value="smtp">SMTP</option>
            </AdminSelect>
          </AdminField>
        </div>
      </section>

      <section className="rounded-md border bg-background p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Người gửi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Thông tin hiển thị trong inbox và địa chỉ nhận phản hồi.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Tên người gửi">
            <AdminInput name="fromName" defaultValue={email.fromName || "PinkLove"} placeholder="PinkLove" />
          </AdminField>
          <AdminField label="Email người gửi">
            <AdminInput
              name="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(event) => setFromEmail(event.target.value)}
              placeholder="hello@example.com"
            />
          </AdminField>
          <AdminField label="Reply-To">
            <AdminInput name="replyTo" type="email" defaultValue={email.replyTo} placeholder="support@example.com" />
          </AdminField>
          <AdminField label="Email nhận test mặc định">
            <AdminInput name="demoRecipient" type="email" defaultValue={email.demoRecipient} placeholder="your@example.com" />
          </AdminField>
        </div>
      </section>

      <section className="rounded-md border bg-background p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold">SMTP</h2>
          <p className="mt-1 text-sm text-muted-foreground">Chỉ cần điền khi Transport là SMTP. Port phổ biến: 587 với STARTTLS hoặc 465 với TLS.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="SMTP host">
            <AdminInput
              name="smtpHost"
              value={smtpHost}
              onChange={(event) => setSmtpHost(event.target.value)}
              placeholder="smtp.example.com"
            />
          </AdminField>
          <AdminField label="SMTP port">
            <AdminInput name="smtpPort" type="number" min="1" max="65535" defaultValue={String(email.smtpPort)} placeholder="587" />
          </AdminField>
          <AdminField label="SMTP username">
            <AdminInput name="smtpUsername" defaultValue={email.smtpUsername} autoComplete="username" />
          </AdminField>
          <AdminField label="SMTP password">
            <PasswordInput name="smtpPassword" defaultValue={email.smtpPassword} autoComplete="new-password" />
          </AdminField>
          <label className="flex min-h-10 items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
            <span>
              <span className="block text-sm font-medium">SMTP secure</span>
              <span className="block text-xs text-muted-foreground">Bật TLS ngay khi kết nối, thường dùng với port 465.</span>
            </span>
            <input
              type="checkbox"
              checked={smtpSecure}
              onChange={(event) => setSmtpSecure(event.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>
      </section>

      <AdminSubmitButton disabled={isSaving}>
        <Save className="h-4 w-4" />
        {isSaving ? "Đang lưu..." : "Lưu cấu hình email"}
      </AdminSubmitButton>
    </NativeForm>
  );
}
