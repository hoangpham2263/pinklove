import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { sendEmail } from "@/lib/email";
import { DEFAULT_EMAIL_TEMPLATE_VARIABLES, renderEmailTemplateSet } from "@/lib/email-template";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return respondError(request, {
      status: 401,
      error: "UNAUTHORIZED",
      message: "Vui lòng đăng nhập admin.",
      location: ROUTES.ADMIN.LOGIN,
    });
  }

  const formData = await request.formData();
  const settings = (await getSystemSettings()).email;
  const recipient = String(formData.get("recipient") ?? settings.demoRecipient).trim();
  const subject = String(formData.get("subject") ?? "").trim() || "PinkLove email demo";
  const html =
    String(formData.get("html") ?? "").trim() ||
    "<p>Xin chào {{customerName}}, đây là email demo từ <strong>{{siteName}}</strong>.</p>";
  const text =
    String(formData.get("text") ?? "").trim() ||
    "Xin chào {{customerName}}, đây là email demo từ {{siteName}}.";

  if (!recipient) {
    return respondError(request, {
      error: "missing_recipient",
      message: "Vui lòng nhập email nhận demo.",
    });
  }

  try {
    const rendered = renderEmailTemplateSet(
      {
        subject,
        text,
        html,
      },
      {
        ...DEFAULT_EMAIL_TEMPLATE_VARIABLES,
        siteName: settings.fromName || DEFAULT_EMAIL_TEMPLATE_VARIABLES.siteName,
        supportEmail: settings.replyTo || settings.fromEmail || DEFAULT_EMAIL_TEMPLATE_VARIABLES.supportEmail,
        currentDate: new Intl.DateTimeFormat("vi-VN").format(new Date()),
      }
    );

    const result = await sendEmail({
      to: recipient,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      replyTo: settings.replyTo || undefined,
    });

    return respondSuccess(request, {
      message:
        result.transport === "log"
          ? "Đã ghi email demo vào server log."
          : "Đã gửi email demo.",
      data: {
        transport: result.transport,
        accepted: result.accepted,
      },
    });
  } catch (error) {
    console.error("Failed to send demo email:", error);
    return respondError(request, {
      error: "email_send_failed",
      message: error instanceof Error ? error.message : "Không thể gửi email demo.",
    });
  }
}
