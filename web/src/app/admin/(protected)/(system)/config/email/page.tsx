import { AtSign, MailCheck, Send, ServerCog, UserRoundCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { EmailDemoForm } from "@/features/admin/components/settings/email-demo-form";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminEmailSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const email = settings.email;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Email Sending" value={email.enabled ? "On" : "Off"} icon={MailCheck} />
        <AdminOverviewCard title="Transport" value={email.transport === "log" ? "Log server" : email.smtpHost || "SMTP chưa cấu hình"} icon={ServerCog} />
        <AdminOverviewCard title="Default Sender" icon={UserRoundCheck}>
          {email.fromEmail ? (
            <>
              <p className="break-all">{email.fromEmail}</p>
              <p>{email.fromName || "PinkLove"}</p>
            </>
          ) : (
            <p>Chưa cấu hình</p>
          )}
        </AdminOverviewCard>
        <AdminOverviewCard title="Demo Recipient" icon={AtSign}>
          <p className="break-all">{email.demoRecipient || "Chưa cấu hình"}</p>
        </AdminOverviewCard>
      </AdminOverviewGrid>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 rounded-lg xl:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Email Transport</CardTitle>
            <ServerCog className="h-4 w-4 text-muted-foreground" />
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
                  type: "password",
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

        <Card className="col-span-12 rounded-lg xl:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Custom Template Demo</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
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
