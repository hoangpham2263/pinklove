import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { GuestMarketingPageShell } from "@/app/(guest)/_components/guest-marketing-background";
import { NativeForm } from "@/components/common/native-form";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  description: "Nhập email tài khoản PinkLove để nhận liên kết đặt lại mật khẩu.",
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const query = (await searchParams) ?? {};
  const status = getSingleParam(query.status);
  const error = getSingleParam(query.error);

  return (
    <GuestMarketingPageShell ambientGlowDensity="compact" className="flex items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/88 p-6 shadow-[0_20px_80px_rgba(35,31,39,0.08)]">
        <Link href={ROUTES.AUTH.LOGIN} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-guest-primary">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-stone-950">Quên mật khẩu</h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          Nhập email tài khoản. Nếu email tồn tại, hệ thống sẽ gửi liên kết đặt lại mật khẩu.
        </p>

        {status === "sent" ? (
          <div className="mt-5 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.
          </div>
        ) : null}

        {error === "missing_email" ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Vui lòng nhập email.
          </div>
        ) : null}

        <NativeForm action="/api/auth/forgot-password" method="POST" className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="forgot-password-email" className="text-sm font-medium text-stone-900">Email</label>
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="your@example.com"
              className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary"
            />
          </div>
          <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded bg-guest-primary text-sm font-medium text-white shadow-default transition hover:bg-guest-primary/80">
            Gửi liên kết đặt lại
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </NativeForm>
      </div>
    </GuestMarketingPageShell>
  );
}
