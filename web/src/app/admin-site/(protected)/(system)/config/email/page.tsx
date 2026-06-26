import { AtSign, MailCheck, Send, ServerCog, UserRoundCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { EmailDemoForm } from "@/features/admin/components/settings/email-demo-form";
import { EmailSettingsForm } from "@/features/admin/components/settings/email-settings-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminEmailSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const email = settings.email;
  const missingSender = !email.fromEmail;
  const missingSmtp = email.transport === "smtp" && !email.smtpHost;

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

      {missingSender || missingSmtp ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {missingSender ? "Cần cấu hình From Email để gửi mail. " : null}
          {missingSmtp ? "Transport SMTP đang bật nhưng chưa có SMTP Host." : null}
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 rounded-lg xl:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Email Configuration</CardTitle>
            <ServerCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <EmailSettingsForm email={email} />
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
