import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { GuestMarketingPageShell } from "@/app/(guest)/_components/guest-marketing-background";
import { PasswordInput } from "@/components/common/password-input";
import { NativeForm } from "@/components/common/native-form";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  description: "Tạo mật khẩu mới cho tài khoản PinkLove.",
};

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error?: string) {
  if (error === "weak_password") return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  if (error === "invalid_token") return "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";
  return null;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const query = (await searchParams) ?? {};
  const token = getSingleParam(query.token) ?? "";
  const error = getErrorMessage(getSingleParam(query.error));

  return (
    <GuestMarketingPageShell ambientGlowDensity="compact" className="flex items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/60 bg-white/88 p-6 shadow-[0_20px_80px_rgba(35,31,39,0.08)]">
        <Link href={ROUTES.AUTH.LOGIN} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-guest-primary">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-stone-950">Đặt lại mật khẩu</h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        {error ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}

        <NativeForm action="/api/auth/reset-password" method="POST" className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <label htmlFor="reset-password-password" className="text-sm font-medium text-stone-900">Mật khẩu mới</label>
            <PasswordInput
              id="reset-password-password"
              name="password"
              required
              allowGenerate
              autoComplete="new-password"
              placeholder={`Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
              className="h-11 rounded border-guest-border bg-white px-4 shadow-none placeholder:text-guest-placeholder focus-visible:border-guest-primary focus-visible:ring-0"
            />
          </div>
          <button type="submit" disabled={!token} className="inline-flex h-11 w-full items-center justify-center rounded bg-guest-primary text-sm font-medium text-white shadow-default transition hover:bg-guest-primary/80 disabled:cursor-not-allowed disabled:opacity-60">
            Cập nhật mật khẩu
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </NativeForm>
      </div>
    </GuestMarketingPageShell>
  );
}
