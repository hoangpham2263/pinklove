"use client";

import { useState, type FormEvent } from "react";
import { Copy, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { AdminActionTileButton, AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import {
  DEFAULT_EMAIL_TEMPLATE_VARIABLES,
  EMAIL_SHORTCODES,
  renderEmailTemplateSet,
} from "@/lib/email-template";

type EmailDemoFormProps = {
  defaultRecipient: string;
  siteName: string;
  supportEmail: string;
};

const DEFAULT_SUBJECT = "Xin chào {{customerName}} từ {{siteName}}";
const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; color: #171717; line-height: 1.6;">
  <h1 style="font-size: 24px; margin: 0 0 12px;">Xin chào {{customerName}}</h1>
  <p>Cảm ơn bạn đã quan tâm đến {{siteName}}.</p>
  <p>Mã đơn demo: <strong>{{orderNumber}}</strong></p>
  <p>Tổng tiền: <strong>{{orderTotal}}</strong></p>
  <p><a href="{{checkoutUrl}}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; text-decoration: none;">Xem chi tiết</a></p>
  <p style="font-size: 13px; color: #6b7280;">Cần hỗ trợ? Liên hệ {{supportEmail}}.</p>
</div>`;
const DEFAULT_TEXT = "Xin chào {{customerName}}, đơn {{orderNumber}} có tổng {{orderTotal}}. Xem thêm tại {{checkoutUrl}}.";

export function EmailDemoForm({ defaultRecipient, siteName, supportEmail }: EmailDemoFormProps) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const rendered = renderEmailTemplateSet(
    {
      subject,
      text,
      html,
    },
    {
      ...DEFAULT_EMAIL_TEMPLATE_VARIABLES,
      siteName: siteName || DEFAULT_EMAIL_TEMPLATE_VARIABLES.siteName,
      supportEmail: supportEmail || DEFAULT_EMAIL_TEMPLATE_VARIABLES.supportEmail,
      currentDate: new Intl.DateTimeFormat("vi-VN").format(new Date()),
    }
  );

  async function copyShortcode(token: string) {
    await navigator.clipboard.writeText(token);
    toast.success(`Đã copy ${token}.`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await adminApi.sendTestEmail(formData);
      const data = result.data as { transport?: string; accepted?: string[] } | undefined;
      const accepted = data?.accepted?.join(", ");
      setLastResult(
        data?.transport === "log"
          ? "Email demo đã được ghi vào server log."
          : accepted
            ? `Email demo đã gửi tới ${accepted}.`
            : "Email demo đã gửi."
      );
      toast.success(result.message ?? "Đã chạy demo email.");
    } catch (error) {
      setLastResult(error instanceof Error ? error.message : "Không thể chạy demo email.");
      toast.error(error instanceof Error ? error.message : "Không thể chạy demo email.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
    <NativeForm action={adminApiActions.sendTestEmail} method="POST" className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="recipient" className="text-sm font-medium">
          Demo recipient
        </label>
        <Input
          id="recipient"
          name="recipient"
          type="email"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          placeholder="your@example.com"
          className="h-9"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <Input
          id="subject"
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="h-9"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="html" className="text-sm font-medium">
            Raw HTML
          </label>
          <AdminOutlineButton className="h-8" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4" />
            Preview
          </AdminOutlineButton>
        </div>
        <textarea
          id="html"
          name="html"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          className="min-h-60 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono outline-none transition-colors"
          spellCheck={false}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="text" className="text-sm font-medium">
          Plain text fallback
        </label>
        <textarea
          id="text"
          name="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none transition-colors"
        />
      </div>

      <div className="grid gap-2 rounded-xl border border-dashed bg-muted/30 p-3">
        <div className="text-sm font-medium">Shortcodes</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EMAIL_SHORTCODES.map((shortcode) => (
            <AdminActionTileButton
              key={shortcode.key}
              onClick={() => copyShortcode(shortcode.token)}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{shortcode.token}</span>
                <span className="block truncate text-xs text-muted-foreground">{shortcode.label}</span>
              </span>
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            </AdminActionTileButton>
          ))}
        </div>
      </div>

      <AdminSubmitButton disabled={isSending}>
        <Send className="h-4 w-4" />
        {isSending ? "Đang gửi..." : "Gửi demo"}
      </AdminSubmitButton>
      {lastResult ? (
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {lastResult}
        </p>
      ) : null}
    </NativeForm>

    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription className="break-all">{rendered.subject}</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 p-4">
          <div className="overflow-hidden rounded-md border bg-white">
            <iframe
              title="Email HTML preview"
              srcDoc={rendered.html}
              sandbox=""
              className="h-[70vh] w-full bg-white"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
