import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailDemoForm } from "@/features/admin/components/settings/email-demo-form";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminEmailSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const email = settings.email;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Email</h1>
            <p className="text-muted-foreground">Cấu hình gửi email dùng chung cho xác thực, đơn hàng, liên hệ và workflow hệ thống.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Email Sending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{email.enabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Transport</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold uppercase">{email.transport}</p>
            <p className="text-muted-foreground">{email.transport === "log" ? "Demo ghi log server" : email.smtpHost || "Chưa cấu hình SMTP host"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Default Sender</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-sm font-medium">{email.fromEmail || "Chưa cấu hình"}</p>
            <p className="text-muted-foreground">{email.fromName || "PinkLove"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Email Transport</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsDataTableForm
              section="email"
              title="Email"
              saveMessage="Đã lưu cấu hình email."
              columnWidths={{
                label: "w-[18%]",
                description: "w-[42%]",
                value: "w-[40%]",
              }}
              rows={[
                {
                  id: "enabled",
                  label: "Enabled",
                  description: "Bật gửi email thật qua core `sendEmail`. Khi tắt, các workflow sẽ dừng trước khi gửi.",
                  type: "boolean",
                  value: email.enabled,
                },
                {
                  id: "transport",
                  label: "Transport",
                  description: "`log` dùng cho demo/local. `smtp` gửi qua SMTP host đã cấu hình.",
                  type: "select",
                  value: email.transport,
                  options: [
                    { label: "Log", value: "log" },
                    { label: "SMTP", value: "smtp" },
                  ],
                },
                {
                  id: "fromName",
                  label: "From Name",
                  description: "Tên người gửi mặc định hiển thị trong inbox.",
                  type: "text",
                  value: email.fromName,
                },
                {
                  id: "fromEmail",
                  label: "From Email",
                  description: "Địa chỉ sender mặc định. Bắt buộc khi gửi demo hoặc gửi email thật.",
                  type: "text",
                  value: email.fromEmail,
                },
                {
                  id: "replyTo",
                  label: "Reply-To",
                  description: "Địa chỉ nhận phản hồi nếu khác sender.",
                  type: "text",
                  value: email.replyTo,
                },
                {
                  id: "smtpHost",
                  label: "SMTP Host",
                  description: "Hostname SMTP provider. Chỉ dùng khi transport là SMTP.",
                  type: "text",
                  value: email.smtpHost,
                },
                {
                  id: "smtpPort",
                  label: "SMTP Port",
                  description: "Port SMTP, thường là 587 hoặc 465.",
                  type: "text",
                  value: String(email.smtpPort),
                },
                {
                  id: "smtpSecure",
                  label: "SMTP Secure",
                  description: "Bật TLS ngay khi kết nối, thường dùng với port 465.",
                  type: "boolean",
                  value: email.smtpSecure,
                },
                {
                  id: "smtpUsername",
                  label: "SMTP Username",
                  description: "Username đăng nhập SMTP nếu provider yêu cầu.",
                  type: "text",
                  value: email.smtpUsername,
                },
                {
                  id: "smtpPassword",
                  label: "SMTP Password",
                  description: "Mật khẩu hoặc app password SMTP. Hiện lưu trong cấu hình hệ thống.",
                  type: "text",
                  value: email.smtpPassword,
                },
                {
                  id: "demoRecipient",
                  label: "Demo Recipient",
                  description: "Email nhận demo mặc định cho card kiểm tra bên cạnh.",
                  type: "text",
                  value: email.demoRecipient,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Custom Template Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Nhập HTML thuần, preview với shortcode mẫu, rồi gửi thử qua core `sendEmail`.
            </p>
            <EmailDemoForm
              defaultRecipient={email.demoRecipient}
              siteName={email.fromName || settings.branding.siteName}
              supportEmail={email.replyTo || email.fromEmail}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
