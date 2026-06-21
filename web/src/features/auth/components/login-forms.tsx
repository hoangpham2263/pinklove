"use client";

import { NativeForm } from "@/components/common/native-form";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, ChevronDown, HeartHandshake, ReceiptText, Search, Sparkles } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Section, SectionContainer } from "@/components/common/section";
import { GuestMarketingPageDecor } from "@/app/(guest)/_components/guest-marketing-background";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import { PHONE_COUNTRY_FLAG_SVGS } from "@/features/auth/phone-country-flags";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  detectCurrentPhoneCountry,
  type PhoneCountry,
  type PhoneCountryCode,
} from "@/features/auth/phone-countries";

export type AuthFormProps = {
  heading?: string;
  subheading?: string;
  sideImage?: string;
};

type CustomerAuthShellProps = AuthFormProps & {
  children: React.ReactNode;
  eyebrow: string;
  panelTitle: string;
  panelDescription: string;
  visualAlt: string;
};

type CustomerAuthMode = "login" | "register";

function getErrorMessage(error: string | null): string | null {
  if (!error) return null;

  if (error === "missing_fields") return "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
  if (
    error === "invalid_credentials" ||
    error === "not_admin" ||
    error === "use_admin_login" ||
    error === "not_user"
  ) {
    return "Tên đăng nhập hoặc mật khẩu không chính xác.";
  }
  if (error === "google_not_configured") return "Đăng nhập Google chưa được cấu hình.";
  if (error === "google_callback_invalid") return "Phản hồi từ Google không hợp lệ.";
  if (error === "google_state_invalid") return "Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.";
  if (error === "google_login_failed") return "Đăng nhập Google thất bại. Vui lòng thử lại.";
  if (error === "weak_password") return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  if (error === "invalid_email") return "Vui lòng nhập địa chỉ email hợp lệ.";
  if (error === "terms_required") return "Vui lòng đồng ý điều khoản sử dụng và chính sách bảo mật.";
  if (error === "username_taken") return "Tên đăng nhập đã tồn tại.";
  if (error === "register_failed") return "Không thể tạo tài khoản. Vui lòng thử tên khác.";
  return "Xác thực không thành công.";
}

function CustomerAuthShell({
  children,
  eyebrow,
  heading,
  subheading,
  panelTitle,
  panelDescription,
  sideImage,
  visualAlt,
}: CustomerAuthShellProps) {
  return (
    <section className="grid min-h-screen grid-cols-12 overflow-hidden bg-white">
      <div className="guest-soft-top-bg contact-wave-bg relative isolate hidden min-h-screen overflow-hidden px-10 py-12 lg:col-span-7 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(circle at 18% 3%, color-mix(in srgb, var(--color-guest-primary) 10%, transparent) 0%, transparent 26rem), radial-gradient(circle at 82% 4%, color-mix(in srgb, var(--color-guest-primary) 7%, transparent) 0%, transparent 24rem), linear-gradient(180deg, color-mix(in srgb, var(--color-guest-primary) 8%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 4%, white) 32vh, color-mix(in srgb, var(--color-guest-primary) 6%, white) 56vh, color-mix(in srgb, var(--color-guest-primary) 9%, white) 100%)",
          }}
        />
        <GuestMarketingPageDecor ambientGlowDensity="compact" />
        {sideImage ? (
          <Image
            src={sideImage}
            alt={visualAlt}
            fill
            className="z-0 object-cover opacity-55 mix-blend-soft-light"
            priority
          />
        ) : null}
        <div className="relative z-10 flex items-center gap-3 text-stone-950">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/75 text-guest-primary shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">PinkLove</span>
            <span className="h-5 w-px bg-stone-300" />
            <span className="text-sm font-medium text-stone-500">Customer Platform</span>
          </div>
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-2 text-sm text-guest-primary shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            {eyebrow}
          </p>
          <h1 className="mt-7.5 text-5xl lg:text-5xl font-semibold leading-tight">
            {heading || "Nền tảng cưới toàn diện cho khách hàng PinkLove"}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            {subheading}
          </p>
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="grid grid-cols-2 gap-x-8 gap-y-7 text-stone-700">
            {[
              {
                title: "Thiệp cưới",
                description: "Tạo thiệp online, quản lý mẫu yêu thích và trang sự kiện",
                Icon: Sparkles,
              },
              {
                title: "Dịch vụ cưới",
                description: "Khám phá nhà cung cấp, gói dịch vụ và ưu đãi phù hợp",
                Icon: HeartHandshake,
              },
              {
                title: "Đơn hàng",
                description: "Theo dõi thanh toán, lịch hẹn và trạng thái xử lý",
                Icon: ReceiptText,
              },
              {
                title: "Kế hoạch",
                description: "Sắp xếp checklist, ngân sách và các mốc chuẩn bị quan trọng",
                Icon: CalendarCheck,
              },
            ].map(({ title, description, Icon }) => (
              <div key={title} className="flex min-w-0 gap-4">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/35 text-guest-primary shadow-sm backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-950">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-stone-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400">PinkLove trong những con số</p>
            <div className="mt-4 grid grid-cols-4 gap-6">
              {[
                ["10.000+", "khách hàng tin dùng"],
                ["2.500+", "thiệp cưới đã tạo"],
                ["500+", "dịch vụ cưới kết nối"],
                ["99,9%", "thời gian hoạt động"],
              ].map(([value, label]) => (
                <div key={label} className="min-w-0">
                  <p className="text-3xl font-semibold leading-none text-stone-950">{value}</p>
                  <p className="mt-2 text-sm leading-5 text-stone-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:col-span-5 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold leading-tight text-stone-950">{panelTitle}</h2>
            <p className="mt-3 text-base leading-7 text-stone-500">{panelDescription}</p>
          </div>

          {children}

          <p className="mt-14 text-center text-xs text-stone-400">© 2026 PinkLove. All rights reserved.</p>
        </div>
      </div>
    </section>
  );
}

function updateCustomerAuthUrl(mode: CustomerAuthMode) {
  const href = mode === "login" ? ROUTES.AUTH.LOGIN : ROUTES.AUTH.REGISTER;
  window.history.pushState({ authMode: mode }, "", href);
}

function CustomerAuthSwitchLink({
  children,
  mode,
  onSwitch,
}: {
  children: React.ReactNode;
  mode: CustomerAuthMode;
  onSwitch: (mode: CustomerAuthMode) => void;
}) {
  const href = mode === "login" ? ROUTES.AUTH.LOGIN : ROUTES.AUTH.REGISTER;

  return (
    <Link
      href={href}
      prefetch
      className="text-guest-primary hover:underline"
      onClick={(event) => {
        event.preventDefault();
        updateCustomerAuthUrl(mode);
        onSwitch(mode);
      }}
    >
      {children}
    </Link>
  );
}

function CountryFlagSvg({ code }: { code: PhoneCountryCode }) {
  return (
    <span
      className="block h-full w-full [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: PHONE_COUNTRY_FLAG_SVGS[code] }}
    />
  );
}

function PhoneRegionInput() {
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    setSelectedCountry(detectCurrentPhoneCountry());
  }, []);

  const countries = useMemo(() => {
    return PHONE_COUNTRIES
      .filter((country) =>
        normalizedQuery
          ? `${country.name} ${country.code} ${country.dialCode}`.toLowerCase().includes(normalizedQuery)
          : true
      )
      .toSorted((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [normalizedQuery]);

  return (
    <div className="relative">
      <input type="hidden" name="phoneCountry" value={selectedCountry.code} />
      <div className="flex h-11 overflow-hidden rounded border border-guest-border bg-white focus-within:border-guest-primary">
        <button
          type="button"
          className="inline-flex h-full shrink-0 items-center gap-2 border-r border-guest-border px-3 text-sm transition-colors hover:bg-guest-primary/8 focus-visible:bg-guest-primary/10 focus-visible:outline-none"
          aria-label="Chọn mã quốc gia"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="inline-flex h-3.5 w-5 overflow-hidden">
            <CountryFlagSvg code={selectedCountry.code as PhoneCountryCode} />
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
        </button>
        <span className="inline-flex h-full shrink-0 items-center px-3 text-sm text-stone-500">
          {selectedCountry.dialCode}
        </span>
        <input
          id="customer-register-phone"
          name="phone"
          type="tel"
          placeholder="Số điện thoại"
          autoComplete="tel-national"
          required
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 shadow-none outline-none placeholder:text-guest-placeholder"
        />
      </div>
      {isOpen ? (
        <div className="absolute left-0 top-14 z-50 w-full overflow-hidden rounded-lg border border-guest-border bg-white shadow-default">
          <div className="flex h-11 items-center gap-2 border-b border-guest-border px-3">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm quốc gia..."
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm shadow-none outline-none placeholder:text-guest-placeholder"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {countries.map((country) => (
              <button
                key={`${country.code}-${country.dialCode}`}
                type="button"
                className={[
                  "flex h-9 w-full items-center gap-3 px-3 text-left text-sm transition-colors",
                  country.code === selectedCountry.code ? "bg-guest-primary/10 text-stone-950" : "hover:bg-guest-primary/8",
                ].join(" ")}
                onClick={() => {
                  setSelectedCountry(country);
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                <span className="inline-flex h-3.5 w-5 shrink-0 overflow-hidden">
                  <CountryFlagSvg code={country.code} />
                </span>
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
                <span className="shrink-0 text-stone-400">{country.dialCode}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="h-4 w-4"
    >
      <path
        d="m492.668 211.489-208.84-.01c-9.222 0-16.697 7.474-16.697 16.696v66.715c0 9.22 7.475 16.696 16.696 16.696h117.606c-12.878 33.421-36.914 61.41-67.58 79.194L384 477.589c80.442-46.523 128-128.152 128-219.53 0-13.011-.959-22.312-2.877-32.785-1.458-7.957-8.366-13.785-16.455-13.785z"
        fill="#167ee6"
      />
      <path
        d="M256 411.826c-57.554 0-107.798-31.446-134.783-77.979l-86.806 50.034C78.586 460.443 161.34 512 256 512c46.437 0 90.254-12.503 128-34.292v-.119l-50.147-86.81c-22.938 13.304-49.482 21.047-77.853 21.047z"
        fill="#12b347"
      />
      <path
        d="M384 477.708v-.119l-50.147-86.81c-22.938 13.303-49.48 21.047-77.853 21.047V512c46.437 0 90.256-12.503 128-34.292z"
        fill="#0f993e"
      />
      <path
        d="M100.174 256c0-28.369 7.742-54.91 21.043-77.847l-86.806-50.034C12.502 165.746 0 209.444 0 256s12.502 90.254 34.411 127.881l86.806-50.034c-13.301-22.937-21.043-49.478-21.043-77.847z"
        fill="#ffd500"
      />
      <path
        d="M256 100.174c37.531 0 72.005 13.336 98.932 35.519 6.643 5.472 16.298 5.077 22.383-1.008l47.27-47.27c6.904-6.904 6.412-18.205-.963-24.603C378.507 23.673 319.807 0 256 0 161.34 0 78.586 51.557 34.411 128.119l86.806 50.034c26.985-46.533 77.229-77.979 134.783-77.979z"
        fill="#ff4b26"
      />
      <path
        d="M354.932 135.693c6.643 5.472 16.299 5.077 22.383-1.008l47.27-47.27c6.903-6.904 6.411-18.205-.963-24.603C378.507 23.672 319.807 0 256 0v100.174c37.53 0 72.005 13.336 98.932 35.519z"
        fill="#d93f21"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="h-4 w-4"
    >
      <path
        fill="#1877f2"
        d="M512 256c0 127.78-93.62 233.69-216 252.89V330h59.65L367 256h-71v-48.02c0-20.25 9.92-39.98 41.72-39.98H370v-63s-29.3-5-57.31-5c-58.47 0-96.69 35.44-96.69 99.6V256h-65v74h65v178.89C93.62 489.69 0 383.78 0 256 0 114.62 114.62 0 256 0s256 114.62 256 256z"
      />
      <path
        fill="#ffffff"
        d="M355.65 330 367 256h-71v-48.021c0-20.245 9.918-39.979 41.719-39.979H370v-63s-29.296-5-57.305-5C254.219 100 216 135.44 216 199.6V256h-65v74h65v178.889c13.034 2.045 26.392 3.111 40 3.111s26.966-1.066 40-3.111V330z"
      />
    </svg>
  );
}

function CustomerAuthView({
  initialMode,
  heading,
  subheading,
  sideImage,
}: AuthFormProps & { initialMode: CustomerAuthMode }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<CustomerAuthMode>(initialMode);
  const error = mode === initialMode ? getErrorMessage(searchParams.get("error")) : null;
  const returnTo = searchParams.get("returnTo");
  const isLogin = mode === "login";
  const activeHeading = mode === initialMode ? heading : undefined;
  const activeSubheading = mode === initialMode ? subheading : undefined;

  useEffect(() => {
    function handlePopState() {
      setMode(window.location.pathname === ROUTES.AUTH.REGISTER ? "register" : "login");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <CustomerAuthShell
      eyebrow="Thiệp cưới · Dịch vụ · Kế hoạch — Đồng hành bởi PinkLove"
      heading={activeHeading}
      subheading={
        activeSubheading ||
        (isLogin
          ? "Chào mừng trở lại! Đăng nhập để tiếp tục lưu ý tưởng, quản lý đơn hàng và chuẩn bị ngày cưới của bạn."
          : "Tạo tài khoản để lưu mẫu yêu thích, đặt dịch vụ và quản lý mọi chuẩn bị cưới trong cùng một nơi.")
      }
      panelTitle={isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}
      panelDescription={
        isLogin
          ? "Đăng nhập để tiếp tục vào tài khoản của bạn"
          : "Đăng ký để bắt đầu quản lý hành trình cưới của bạn"
      }
      sideImage={sideImage}
      visualAlt={isLogin ? "PinkLove customer login visual" : "PinkLove customer register visual"}
    >
      {isLogin ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Link href={ROUTES.API.AUTH.GOOGLE_LOGIN} className="block">
              <span className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-guest-border bg-white text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50">
                <GoogleIcon />
                <span className="ml-2">Google</span>
              </span>
            </Link>
            <button type="button" className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-guest-border bg-white text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60">
              <FacebookIcon />
              <span className="ml-2">Facebook</span>
            </button>
          </div>
          <div className="my-6 flex items-center gap-4 text-xs font-medium text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            <span>hoặc đăng nhập bằng tài khoản</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>
          <form
            action={ROUTES.API.AUTH.LOGIN}
            method="POST"
            className="space-y-4"
          >
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            <div className="space-y-2">
              <label htmlFor="customer-login-username" className="text-sm font-semibold text-stone-700">
                Tên đăng nhập
              </label>
              <input id="customer-login-username" name="username" placeholder="Tên đăng nhập" autoComplete="username" className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-login-password" className="text-sm font-semibold text-stone-700">
                Mật khẩu
              </label>
              <input id="customer-login-password" name="password" type="password" placeholder="Mật khẩu" autoComplete="current-password" className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-guest-primary text-sm font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60">
              Đăng nhập
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>
          {error ? <p className="mt-4 text-center text-sm text-destructive">{error}</p> : null}
          <p className="pt-5 text-center text-sm">
            Chưa có tài khoản?{" "}
            <CustomerAuthSwitchLink mode="register" onSwitch={setMode}>
              Tạo tài khoản
            </CustomerAuthSwitchLink>
          </p>
        </>
      ) : (
        <>
          <form
            action={ROUTES.API.AUTH.REGISTER}
            method="POST"
            className="space-y-3.5"
          >
            <div className="space-y-2">
              <label htmlFor="customer-register-username" className="text-sm font-semibold text-stone-700">
                Tên đăng nhập
              </label>
              <input id="customer-register-username" name="username" placeholder="Tên đăng nhập mới" autoComplete="username" required className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-register-phone" className="text-sm font-semibold text-stone-700">
                Số điện thoại
              </label>
              <PhoneRegionInput />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-register-email" className="text-sm font-semibold text-stone-700">
                Gmail
              </label>
              <input id="customer-register-email" name="email" type="email" placeholder="your@gmail.com" autoComplete="email" required className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-register-password" className="text-sm font-semibold text-stone-700">
                Mật khẩu
              </label>
              <input
                id="customer-register-password"
                name="password"
                type="password"
                placeholder={`Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
                autoComplete="new-password"
                required
                className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary"
              />
            </div>
            <label className="flex gap-3 rounded-lg border border-guest-border bg-white px-3 py-3 text-sm leading-5 text-stone-600">
              <input
                name="termsAccepted"
                type="checkbox"
                value="accepted"
                required
                className="mt-0.5 size-4 shrink-0 rounded border-guest-border accent-guest-primary"
              />
              <span>
                Tôi đã xem và đồng ý Điều khoản sử dụng & Chính sách bảo mật của LadiPage.
              </span>
            </label>
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-guest-primary text-sm font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60">
              Đăng ký tài khoản
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </form>
          {error ? <p className="mt-4 text-center text-sm text-destructive">{error}</p> : null}
          <p className="pt-5 text-center text-sm">
            Đã có tài khoản?{" "}
            <CustomerAuthSwitchLink mode="login" onSwitch={setMode}>
              Đăng nhập
            </CustomerAuthSwitchLink>
          </p>
        </>
      )}
    </CustomerAuthShell>
  );
}

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl text-primary">PinkLove Admin</h1>
          <p className="text-muted-foreground">Admin Portal Access</p>
        </div>

        <Card className="w-full border-primary/20">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <NativeForm
              action={ROUTES.API.ADMIN.AUTH.LOGIN}
              method="POST"
              className="space-y-3"
            >
              <Input name="username" placeholder="Tên đăng nhập" autoComplete="username" />
              <PasswordInput name="password" placeholder="Mật khẩu" autoComplete="current-password" />
              <Button type="submit" className="w-full" variant="default">
                Login to Dashboard
              </Button>
            </NativeForm>
            {error ? <p className="text-destructive text-center">{error}</p> : null}
            <div className="pt-2 text-center">
              <Link href={ROUTES.AUTH.LOGIN} className="text-muted-foreground hover:underline">
                Đăng nhập với tư cách Người dùng
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function LoginForm({ heading, subheading, sideImage }: AuthFormProps = {}) {
  return (
    <CustomerAuthView
      initialMode="login"
      heading={heading}
      subheading={subheading}
      sideImage={sideImage}
    />
  );
}

type ProviderLoginFormProps = {
  title?: string;
  description?: string;
  returnTo?: string;
  embedded?: boolean;
};

export function ProviderLoginForm({
  title = "Provider Portal",
  description = "Đăng nhập bằng tài khoản provider để quản lý các đơn được phân công.",
  returnTo,
  embedded = false,
}: ProviderLoginFormProps = {}) {
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));

  const loginCard = (
    <div className={embedded ? "w-full space-y-5" : "mx-auto w-full max-w-md space-y-5"}>
      <div className={`space-y-2 ${embedded ? "" : "text-center"}`}>
        <h1 className={`font-semibold tracking-tight ${embedded ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"}`}>{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className={`w-full rounded-lg ${embedded ? "border bg-background shadow-sm" : "border-0 md:border"}`}>
        <CardHeader>
          <CardTitle>Provider Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NativeForm action={ROUTES.API.PROVIDER.AUTH.LOGIN} method="POST" className="space-y-3">
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            <Input name="username" placeholder="Tên đăng nhập provider" autoComplete="username" />
            <PasswordInput name="password" placeholder="Mật khẩu" autoComplete="current-password" />
            <Button type="submit" className="w-full">
              Vào provider portal
            </Button>
          </NativeForm>
          {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
          <p className="pt-2 text-center text-sm text-muted-foreground">
            Nếu đây là tài khoản khách hàng thông thường, hãy dùng{" "}
            <Link href={ROUTES.AUTH.LOGIN} className="text-primary hover:underline">
              customer login
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (embedded) {
    return loginCard;
  }

  return (
    <Section>
      <SectionContainer>
        <div className="grid min-h-[calc(100vh-200px)] items-center gap-8 lg:grid-cols-2">
          {loginCard}

          <div className="relative hidden min-h-125 overflow-hidden rounded-lg bg-muted/30 p-8 lg:flex lg:items-center lg:justify-center">
            <div className="relative z-10 max-w-md space-y-4">
              <h2 className="text-3xl font-semibold">Workspace riêng cho đối tác</h2>
              <p className="text-muted-foreground">
                Theo dõi đơn được giao, cập nhật trạng thái và để lại ghi chú tiến độ theo cùng một timeline vận hành.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </Section>
  );
}

export function RegisterForm({ heading, subheading, sideImage }: AuthFormProps = {}) {
  return (
    <CustomerAuthView
      initialMode="register"
      heading={heading}
      subheading={subheading}
      sideImage={sideImage}
    />
  );
}
