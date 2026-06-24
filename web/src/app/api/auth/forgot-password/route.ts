import { NextResponse } from "next/server";

import { createPasswordResetTokenForEmail } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function buildLocation(status: string) {
  return `${ROUTES.AUTH.FORGOT_PASSWORD}?${new URLSearchParams({ status }).toString()}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.AUTH.FORGOT_PASSWORD}?error=missing_email` },
    });
  }

  const reset = await createPasswordResetTokenForEmail(email);

  if (reset) {
    const resetUrl = new URL(ROUTES.AUTH.RESET_PASSWORD, request.url);
    resetUrl.searchParams.set("token", reset.token);

    try {
      await sendEmail({
        to: reset.email,
        subject: "Đặt lại mật khẩu PinkLove",
        text: [
          "Bạn vừa yêu cầu đặt lại mật khẩu PinkLove.",
          `Mở liên kết này để đặt mật khẩu mới: ${resetUrl.toString()}`,
          "Liên kết có hiệu lực trong 60 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.",
        ].join("\n\n"),
        html: `
          <p>Bạn vừa yêu cầu đặt lại mật khẩu PinkLove.</p>
          <p><a href="${resetUrl.toString()}">Đặt lại mật khẩu</a></p>
          <p>Liên kết có hiệu lực trong 60 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        `,
      });
    } catch (error) {
      console.warn("Failed to send password reset email", error);
      if (process.env.NODE_ENV !== "production") {
        console.info("Password reset link for local testing:", resetUrl.toString());
      }
    }
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: buildLocation("sent") },
  });
}
