"use client";

import { NativeForm } from "@/components/common/native-form";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CalendarCheck, Check, ChevronDown, HeartHandshake, ReceiptText, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
import {
  formatPhoneNumberAsYouType,
  normalizePhoneNumber,
} from "@/features/auth/phone-number";

export type AuthFormProps = {
  heading?: string;
  subheading?: string;
  sideImage?: string;
  loginCsrfToken?: string;
  registerCsrfToken?: string;
};

type CustomerAuthShellProps = AuthFormProps & {
  children: React.ReactNode;
  eyebrow: string;
  panelTitle: string;
  panelDescription: string;
  visualAlt: string;
};

type CustomerAuthMode = "login" | "register";
type AuthCsrfScope = "login" | "register" | "admin_login" | "provider_login";

function useAuthCsrfToken(scope: AuthCsrfScope, initialToken = "") {
  const [token, setToken] = useState(initialToken);
  const [ready, setReady] = useState(Boolean(initialToken));

  useEffect(() => {
    let cancelled = false;

    async function loadToken() {
      setReady(Boolean(initialToken));

      try {
        const response = await fetch(`${ROUTES.API.AUTH.CSRF}?scope=${encodeURIComponent(scope)}`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = (await response.json()) as { token?: string };
        if (!cancelled && response.ok) {
          setToken(payload.token ?? "");
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setReady(false);
        }
      }
    }

    loadToken();

    return () => {
      cancelled = true;
    };
  }, [initialToken, scope]);

  return { token, ready };
}

function getErrorMessage(error: string | null): string | null {
  if (!error) return null;

  if (error === "missing_fields") return "Vui lòng nhập đầy đủ email và mật khẩu.";
  if (
    error === "invalid_credentials" ||
    error === "not_admin" ||
    error === "use_admin_login" ||
    error === "not_user"
  ) {
    return "Email hoặc mật khẩu không chính xác.";
  }
  if (error === "google_not_configured") return "Đăng nhập Google chưa được cấu hình.";
  if (error === "google_callback_invalid") return "Phản hồi từ Google không hợp lệ.";
  if (error === "google_state_invalid") return "Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.";
  if (error === "google_login_failed") return "Đăng nhập Google thất bại. Vui lòng thử lại.";
  if (error === "weak_password") return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  if (error === "invalid_email") return "Vui lòng nhập địa chỉ email hợp lệ.";
  if (error === "invalid_phone") return "Vui lòng nhập số điện thoại hợp lệ.";
  if (error === "terms_required") return "Vui lòng đồng ý điều khoản sử dụng và chính sách bảo mật.";
  if (error === "account_exists" || error === "email_taken" || error === "phone_taken") {
    return "Không thể tạo tài khoản mới với thông tin này. Vui lòng đăng nhập nếu bạn đã có tài khoản.";
  }
  if (error === "rate_limited") return "Bạn đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.";
  if (error === "register_failed") return "Không thể tạo tài khoản. Vui lòng thử lại.";
  return "Xác thực không thành công.";
}

function getStatusMessage(status: string | null): string | null {
  if (status === "password_reset") return "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.";
  return null;
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
    <section data-guest-auth className="grid min-h-screen grid-cols-12 overflow-x-hidden bg-white lg:h-screen lg:overflow-hidden">
      <div className="guest-soft-top-bg contact-wave-bg relative isolate col-span-12 flex lg:min-h-screen flex-col justify-between overflow-hidden px-4 py-10 sm:px-7.5 lg:col-span-7 lg:h-screen lg:px-15">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(circle at 18% 3%, color-mix(in srgb, var(--color-guest-primary) 10%, transparent) 0%, transparent 26rem), radial-gradient(circle at 82% 4%, color-mix(in srgb, var(--color-guest-primary) 7%, transparent) 0%, transparent 24rem), linear-gradient(180deg, color-mix(in srgb, var(--color-guest-primary) 8%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 4%, white) 32vh, color-mix(in srgb, var(--color-guest-primary) 6%, white) 56vh, color-mix(in srgb, var(--color-guest-primary) 9%, white) 100%)",
          }}
        />
        <GuestMarketingPageDecor ambientGlowDensity="compact" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-3">
            {sideImage ? (
              <Image
                src={sideImage}
                alt={visualAlt}
                width={216}
                height={56}
                className="h-9 lg:h-10 2xl:h-11 w-auto object-contain"
                priority
              />
            ) : (
              <svg className="h-9 lg:h-10 2xl:h-11 w-auto" width="216" height="56" viewBox="0 0 216 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.6674 0.977212C27.403 -0.850478 34.5786 -0.0968353 40.7875 3.09049C46.9964 6.27784 51.791 11.6692 54.2318 18.2077C56.6727 24.7462 56.5833 31.9609 53.9818 38.4372C51.3803 44.9134 46.454 50.1843 40.1684 53.2174C33.8827 56.2506 26.6908 56.8271 20.0024 54.8337L20.0063 54.8219H20.0004V28.0006C20.0004 23.5824 23.5821 20.0006 28.0004 20.0006C32.4185 20.0009 36.0004 23.5825 36.0004 28.0006C36.0002 32.4186 32.4183 36.0004 28.0004 36.0006V45.359C30.5918 45.3589 33.1722 44.78 35.5443 43.6354C39.4414 41.7549 42.4959 38.4865 44.1088 34.4714C45.7217 30.4562 45.7772 25.9831 44.2641 21.9294C42.7508 17.8755 39.7777 14.5325 35.9281 12.5563C32.0786 10.5802 27.6296 10.1126 23.4535 11.2458C19.2775 12.379 15.6755 15.0314 13.3529 18.6823C11.4658 21.6488 10.534 25.101 10.6498 28.5778V49.9743C5.24647 45.708 1.6004 39.5995 0.416419 32.8112C-0.782687 25.9357 0.629301 18.8601 4.3754 12.9714C8.12151 7.08267 13.9317 2.80496 20.6674 0.977212Z" fill="url(#paint0_linear_113_1711)" />
              <path d="M66.592 41V14.36H77.104C79.24 14.36 81.016 14.792 82.432 15.656C83.848 16.496 84.904 17.6 85.6 18.968C86.32 20.312 86.68 21.716 86.68 23.18C86.68 24.644 86.32 26.06 85.6 27.428C84.904 28.772 83.848 29.876 82.432 30.74C81.016 31.604 79.24 32.036 77.104 32.036H71.488V41H66.592ZM77.068 18.608H71.488V27.788H77.068C78.124 27.788 79 27.572 79.696 27.14C80.392 26.684 80.908 26.108 81.244 25.412C81.604 24.692 81.784 23.96 81.784 23.216C81.784 22.448 81.604 21.716 81.244 21.02C80.908 20.324 80.392 19.748 79.696 19.292C79 18.836 78.124 18.608 77.068 18.608ZM93.1237 18.968C92.2837 18.968 91.5877 18.692 91.0357 18.14C90.5077 17.588 90.2437 16.928 90.2437 16.16C90.2437 15.392 90.5077 14.732 91.0357 14.18C91.5877 13.628 92.2837 13.352 93.1237 13.352C93.9637 13.352 94.6597 13.628 95.2117 14.18C95.7637 14.732 96.0397 15.392 96.0397 16.16C96.0397 16.928 95.7637 17.588 95.2117 18.14C94.6597 18.692 93.9637 18.968 93.1237 18.968ZM90.7477 41V21.92H95.5357V41H90.7477ZM100.509 41V21.92H105.297V24.656H105.513C105.705 24.32 106.005 23.912 106.413 23.432C106.821 22.928 107.385 22.496 108.105 22.136C108.825 21.752 109.737 21.56 110.841 21.56C112.305 21.56 113.505 21.896 114.441 22.568C115.401 23.216 116.109 24.08 116.565 25.16C117.045 26.24 117.285 27.404 117.285 28.652V41H112.497V29.3C112.497 28.268 112.209 27.38 111.633 26.636C111.057 25.892 110.193 25.52 109.041 25.52C108.153 25.52 107.433 25.748 106.881 26.204C106.329 26.636 105.921 27.2 105.657 27.896C105.417 28.592 105.297 29.324 105.297 30.092V41H100.509ZM122.104 41V13.64H126.892V29.48L133.624 21.92H139.276L131.356 30.632L139.528 41H133.804L126.892 32.216V41H122.104ZM143.127 41L143.163 13.64H147.915V41H143.127ZM162.115 41.36C160.027 41.36 158.251 40.892 156.787 39.956C155.323 39.02 154.207 37.808 153.439 36.32C152.695 34.808 152.323 33.188 152.323 31.46C152.323 29.732 152.695 28.124 153.439 26.636C154.207 25.124 155.323 23.9 156.787 22.964C158.251 22.028 160.027 21.56 162.115 21.56C164.227 21.56 166.003 22.028 167.443 22.964C168.907 23.9 170.011 25.124 170.755 26.636C171.523 28.124 171.907 29.732 171.907 31.46C171.907 33.188 171.523 34.808 170.755 36.32C170.011 37.808 168.907 39.02 167.443 39.956C166.003 40.892 164.227 41.36 162.115 41.36ZM162.115 37.364C163.195 37.364 164.095 37.088 164.815 36.536C165.559 35.984 166.123 35.264 166.507 34.376C166.891 33.464 167.083 32.492 167.083 31.46C167.083 30.404 166.891 29.432 166.507 28.544C166.123 27.656 165.559 26.936 164.815 26.384C164.095 25.832 163.195 25.556 162.115 25.556C161.059 25.556 160.159 25.832 159.415 26.384C158.671 26.936 158.107 27.656 157.723 28.544C157.339 29.432 157.147 30.404 157.147 31.46C157.147 32.492 157.339 33.464 157.723 34.376C158.107 35.264 158.671 35.984 159.415 36.536C160.159 37.088 161.059 37.364 162.115 37.364ZM181.048 41L173.956 21.92H178.816L183.604 35.528L188.32 21.92H193.18L186.052 41H181.048ZM204.718 41.36C203.086 41.36 201.67 41.084 200.47 40.532C199.294 39.956 198.31 39.2 197.518 38.264C196.75 37.304 196.174 36.236 195.79 35.06C195.406 33.884 195.214 32.684 195.214 31.46C195.214 30.236 195.394 29.048 195.754 27.896C196.138 26.72 196.702 25.652 197.446 24.692C198.214 23.732 199.186 22.976 200.362 22.424C201.538 21.848 202.93 21.56 204.538 21.56C206.266 21.56 207.79 21.944 209.11 22.712C210.43 23.48 211.462 24.608 212.206 26.096C212.95 27.56 213.322 29.384 213.322 31.568V32.792H200.038C200.11 34.088 200.554 35.216 201.37 36.176C202.186 37.112 203.302 37.58 204.718 37.58C205.534 37.58 206.206 37.448 206.734 37.184C207.262 36.92 207.67 36.62 207.958 36.284C208.246 35.924 208.45 35.624 208.57 35.384C208.69 35.12 208.75 34.988 208.75 34.988H213.178C213.178 34.988 213.118 35.204 212.998 35.636C212.878 36.044 212.65 36.572 212.314 37.22C212.002 37.844 211.534 38.48 210.91 39.128C210.286 39.752 209.47 40.28 208.462 40.712C207.454 41.144 206.206 41.36 204.718 41.36ZM200.038 29.66H208.714C208.642 28.172 208.198 27.068 207.382 26.348C206.566 25.628 205.606 25.268 204.502 25.268C203.278 25.268 202.258 25.664 201.442 26.456C200.626 27.224 200.158 28.292 200.038 29.66Z" fill="black" />
              <defs>
                <linearGradient id="paint0_linear_113_1711" x1="10.0004" y1="5.49952" x2="45.5005" y2="51.4991" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#E81C90" />
                  <stop offset="1" stopColor="#FF7A76" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              </svg>
            )}
            <span className="h-6 w-px bg-stone-300"></span>
            <span className="text-base 2xl:text-lg text-stone-500">Platform</span>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex-1 flex flex-col justify-center">
          <p className="w-fit inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/50 px-4 lg:px-6 py-2 text-sm text-guest-primary shadow-default">
            <Sparkles className="h-4 w-4" />{eyebrow}
          </p>

          <h1 className="mt-5 text-2xl lg:text-4xl 2xl:text-5xl font-extrabold leading-snug">{heading ? (heading) : (<>#1 Nền tảng toàn diện cho{" "}<span className="bg-[linear-gradient(90deg,#E81C90_0%,#FF7A76_100%)] bg-clip-text text-transparent">Lên kế hoạch & Mời cưới</span></>)}</h1>
          <p className="mt-4 lg:mt-6 text-sm lg:text-base 2xl:text-lg text-stone-500">{subheading}</p>

          <div className="hidden mt-7.5 2xl:mt-10 lg:grid grid-cols-2 gap-3 lg:gap-x-6 lg:gap-y-4">
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
                <span className="size-10 2xl:size-12.5 shrink-0 inline-flex items-center justify-center rounded-md border border-white/50 bg-white/50 text-guest-primary shadow-default">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-base 2xl:text-lg font-semibold">{title}</p>
                  <p className="mt-1 text-sm 2xl:text-base leading-5 text-stone-500">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7.5 2xl:mt-10 hidden lg:block">
            <p className="text-xs 2xl:text-base font-medium uppercase tracking-widest text-stone-500">PinkLove trong những con số</p>
            <div className="mt-4 2xl:mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                ["10.000", "+", "khách hàng tin dùng"],
                ["2.500", "+", "thiệp cưới đã tạo"],
                ["500", "+", "dịch vụ cưới kết nối"],
                ["10", "×", "tốc độ cập nhật"],
              ].map(([value, suffix, label]) => (
                <div key={label} className="min-w-0">
                  <p className="text-2xl 2xl:text-3xl font-semibold">
                    {value}<span className="text-guest-primary">{suffix}</span>
                  </p>
                  <p className="mt-2 text-sm lg:text-base text-stone-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 flex lg:min-h-screen items-center justify-center bg-white px-4 py-7.5 sm:px-7.5 lg:col-span-5 lg:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-xl lg:text-2xl 2xl:text-3xl font-semibold">{panelTitle}</h2>
          <p className="mt-2 lg:mt-3 2xl:mt-4 text-sm 2xl:text-base text-stone-500">{panelDescription}</p>
          {children}
        </div>
      </div>
    </section>
  );
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
    <a
      href={href}
      className="text-guest-primary hover:underline"
      onClick={(event) => {
        event.preventDefault();
        onSwitch(mode);
      }}
    >
      {children}
    </a>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSelectedCountry(detectCurrentPhoneCountry());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || containerRef.current?.contains(target)) return;

      setIsOpen(false);
      setQuery("");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

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
    <div ref={containerRef} className="relative">
      <input type="hidden" name="phoneCountry" value={selectedCountry.code} />
      <div className="flex h-11 overflow-hidden rounded border border-guest-border bg-white focus-within:border-guest-primary">
        <button
          type="button"
          className={[
            "inline-flex h-full shrink-0 items-center gap-2 border-r border-guest-border px-3 text-sm transition-colors hover:bg-guest-primary/8 focus-visible:bg-guest-primary/10 focus-visible:outline-none",
            isOpen ? "bg-guest-primary/8" : "",
          ].join(" ")}
          aria-label="Chọn mã quốc gia"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="inline-flex h-3.5 w-5 overflow-hidden">
            <CountryFlagSvg code={selectedCountry.code as PhoneCountryCode} />
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
        </button>
        <span
          className={[
            "inline-flex h-full shrink-0 items-center px-3 text-sm transition-colors",
            phone.length > 0 ? "text-guest-text" : "text-guest-placeholder",
          ].join(" ")}
        >
          {selectedCountry.dialCode}
        </span>
        <input
          id="customer-register-phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(event) => {
            setPhone(formatPhoneNumberAsYouType(event.target.value, selectedCountry.code));
          }}
          onBlur={() => {
            const normalized = normalizePhoneNumber(
              phone,
              selectedCountry.code,
              selectedCountry.dialCode
            );
            if (normalized) setPhone(normalized.national);
          }}
          placeholder="Số điện thoại"
          inputMode="tel"
          autoComplete="tel-national"
          required
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 shadow-none outline-none placeholder:text-guest-placeholder"
        />
      </div>
      {isOpen ? (
        <div className="absolute left-0 top-14 z-50 w-full overflow-hidden rounded-lg border border-guest-border bg-white shadow-default">
          <div className="flex h-11 items-center gap-2 border-b border-guest-border px-3">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm quốc gia..."
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm shadow-none outline-none placeholder:text-guest-placeholder"
            />
          </div>
          <div className="max-h-50 overflow-y-auto py-1">
            {countries.map((country) => (
              <button
                key={`${country.code}-${country.dialCode}`}
                type="button"
                className={[
                  "flex h-9 w-full items-center gap-3 px-3 text-left text-sm transition-colors",
                  country.code === selectedCountry.code ? "bg-guest-primary/10" : "hover:bg-guest-primary/8",
                ].join(" ")}
                onClick={() => {
                  setSelectedCountry(country);
                  setPhone((current) => formatPhoneNumberAsYouType(current, country.code));
                  setIsOpen(false);
                  setQuery("");
                }}
              >
                <span className="inline-flex h-3.5 w-5 shrink-0 overflow-hidden">
                  <CountryFlagSvg code={country.code} />
                </span>
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
                <span className="shrink-0 text-stone-500">{country.dialCode}</span>
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
  loginCsrfToken,
  registerCsrfToken,
}: AuthFormProps & { initialMode: CustomerAuthMode }) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<CustomerAuthMode>(initialMode);
  const error = mode === initialMode ? getErrorMessage(searchParams.get("error")) : null;
  const status = mode === initialMode ? getStatusMessage(searchParams.get("status")) : null;
  const returnTo = searchParams.get("returnTo");
  const isLogin = mode === "login";
  const activeHeading = mode === initialMode ? heading : undefined;
  const activeSubheading = mode === initialMode ? subheading : undefined;
  const loginCsrf = useAuthCsrfToken("login", loginCsrfToken);
  const registerCsrf = useAuthCsrfToken("register", registerCsrfToken);

  function switchMode(nextMode: CustomerAuthMode) {
    setMode(nextMode);

    const url = new URL(window.location.href);
    url.pathname = nextMode === "login" ? ROUTES.AUTH.LOGIN : ROUTES.AUTH.REGISTER;
    url.searchParams.delete("error");
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    function handlePopState() {
      setMode(window.location.pathname === ROUTES.AUTH.REGISTER ? "register" : "login");
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    if (formData.get("termsAccepted") === "accepted") return;

    event.preventDefault();
    toast.error("Vui lòng đồng ý Điều khoản sử dụng và Chính sách bảo mật.");
  }

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
      visualAlt="PinkLove"
    >
      {isLogin ? (
        <>
          <div className="mt-4 lg:mt-5 2xl:mt-6 grid grid-cols-2 gap-3 lg:gap-4">
            <Link href={ROUTES.API.AUTH.GOOGLE_LOGIN} className="block">
              <span className="inline-flex h-11 w-full items-center justify-center rounded border border-guest-border bg-white text-sm 2xl:text-base font-medium transition hover:border-guest-primary hover:bg-guest-primary/8 hover:text-guest-primary">
                <GoogleIcon />
                <span className="ml-2">Google</span>
              </span>
            </Link>
            <button type="button" className="inline-flex h-11 w-full items-center justify-center rounded border border-guest-border bg-white text-sm 2xl:text-base font-medium transition hover:border-guest-primary hover:bg-guest-primary/8 hover:text-guest-primary disabled:cursor-not-allowed disabled:opacity-60">
              <FacebookIcon />
              <span className="ml-2">Facebook</span>
            </button>
          </div>
          <div className="my-5 2xl:my-7.5 flex items-center gap-4 text-xs 2xl:text-sm font-medium text-stone-500">
            <span className="h-px flex-1 bg-stone-200" />
            <span>hoặc đăng nhập bằng tài khoản</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>
          <NativeForm
            action={ROUTES.API.AUTH.LOGIN}
            method="POST"
            className="space-y-3.5 2xl:space-y-4"
          >
            <input type="hidden" name="csrfToken" value={loginCsrf.token} />
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            <div className="space-y-2">
              <label htmlFor="customer-login-email" className="text-sm 2xl:text-base font-medium">
                Email
              </label>
              <input id="customer-login-email" name="email" type="email" placeholder="your@example.com" autoComplete="email" required className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="customer-login-password" className="text-sm 2xl:text-base font-medium">
                  Mật khẩu
                </label>
                <Link href={ROUTES.AUTH.FORGOT_PASSWORD} className="text-xs font-medium text-guest-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <PasswordInput
                id="customer-login-password"
                name="password"
                placeholder="Mật khẩu"
                autoComplete="current-password"
                required
                className="h-11 rounded border-guest-border bg-white px-4 shadow-none placeholder:text-guest-placeholder focus-visible:border-guest-primary focus-visible:ring-0"
              />
            </div>
            <button type="submit" disabled={!loginCsrf.ready} className="inline-flex h-11 w-full items-center justify-center rounded bg-guest-primary text-sm 2xl:text-base font-medium text-white shadow-default transition hover:bg-guest-primary/80 disabled:cursor-not-allowed disabled:opacity-60">
              Đăng nhập
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </NativeForm>
          {status ? <p className="mt-4 text-center text-sm text-emerald-700">{status}</p> : null}
          {error ? <p className="mt-4 text-center text-sm text-destructive">{error}</p> : null}
          <p className="mt-5 2xl:mt-7.5 text-center text-sm 2xl:text-base">
            Chưa có tài khoản?{" "}
            <CustomerAuthSwitchLink mode="register" onSwitch={switchMode}>
              Tạo tài khoản
            </CustomerAuthSwitchLink>
          </p>
          <p className="mt-14 text-center text-xs text-stone-500">
            © 2026 Pinklove. All rights reserved.
          </p>
        </>
      ) : (
        <>
          <NativeForm
            action={ROUTES.API.AUTH.REGISTER}
            method="POST"
            className="mt-7.5 2xl:mt-10 space-y-3.5 2xl:space-y-4"
            onSubmit={handleRegisterSubmit}
          >
            <input type="hidden" name="csrfToken" value={registerCsrf.token} />
            <div className="space-y-2">
              <label htmlFor="customer-register-accountName" className="text-sm 2xl:text-base font-medium">Tên tài khoản</label>
              <input id="customer-register-accountName" name="accountName" placeholder="Tên hiển thị của bạn" autoComplete="nickname" required className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-register-email" className="text-sm 2xl:text-base font-medium">Email</label>
              <input id="customer-register-email" name="email" type="email" placeholder="your@example.com" autoComplete="email" required className="h-11 w-full rounded border border-guest-border bg-white px-4 shadow-none outline-none placeholder:text-guest-placeholder focus:border-guest-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-register-phone" className="text-sm 2xl:text-base font-medium">Số điện thoại</label>
              <PhoneRegionInput />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-register-password" className="text-sm 2xl:text-base font-medium">Mật khẩu</label>
              <PasswordInput
                id="customer-register-password"
                name="password"
                placeholder={`Mật khẩu tối thiểu ${MIN_PASSWORD_LENGTH} ký tự`}
                autoComplete="new-password"
                required
                allowGenerate
                className="h-11 rounded border-guest-border bg-white px-4 shadow-none placeholder:text-guest-placeholder focus-visible:border-guest-primary focus-visible:ring-0"
              />
            </div>
            <label className="flex gap-3 text-xs 2xl:text-sm leading-5 text-stone-500">
              <span className="relative mt-0.5 2xl:mt-1 size-4 shrink-0">
                <input
                  name="termsAccepted"
                  type="checkbox"
                  value="accepted"
                  className="peer size-4 appearance-none rounded border border-guest-border bg-white transition-colors checked:border-guest-primary checked:bg-guest-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guest-primary/30"
                />
                <Check className="pointer-events-none absolute left-0.5 top-0.5 hidden size-3 stroke-[3] text-white peer-checked:block" />
              </span>
              <span>
                Đồng ý với{" "}
                <button type="button" className="inline p-0 font-medium text-guest-primary hover:underline">
                  Điều khoản sử dụng
                </button>{" "}
                &{" "}
                <button type="button" className="inline p-0 font-medium text-guest-primary hover:underline">
                  Chính sách bảo mật
                </button>{" "}
                của PinkLove.
              </span>
            </label>
            <button
              type="submit"
              disabled={!registerCsrf.ready}
              className="inline-flex h-11 w-full items-center justify-center rounded bg-guest-primary text-sm 2xl:text-base font-medium text-white shadow-default transition hover:bg-guest-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Đăng ký tài khoản
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </NativeForm>
          {error ? <p className="mt-4 text-center text-sm text-destructive">{error}</p> : null}
          <p className="mt-5 2xl:mt-7.5 text-center text-sm 2xl:text-base">
            Đã có tài khoản?{" "}
            <CustomerAuthSwitchLink mode="login" onSwitch={switchMode}>
              Đăng nhập
            </CustomerAuthSwitchLink>
          </p>
        </>
      )}
    </CustomerAuthShell>
  );
}

export function AdminLoginForm({ csrfToken }: { csrfToken?: string } = {}) {
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));
  const csrf = useAuthCsrfToken("admin_login", csrfToken);

  return (
    <section className="container px-4 mx-auto flex w-full flex-1 items-center justify-center p-6 md:p-10">
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
              <input type="hidden" name="csrfToken" value={csrf.token} />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                className="rounded"
              />
              <PasswordInput
                name="password"
                placeholder="Mật khẩu"
                autoComplete="current-password"
                className="rounded"
              />
              <Button type="submit" disabled={!csrf.ready} className="h-10 w-full rounded" variant="default">
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

export function LoginForm({
  heading,
  subheading,
  sideImage,
  loginCsrfToken,
  registerCsrfToken,
}: AuthFormProps = {}) {
  return (
    <CustomerAuthView
      initialMode="login"
      heading={heading}
      subheading={subheading}
      sideImage={sideImage}
      loginCsrfToken={loginCsrfToken}
      registerCsrfToken={registerCsrfToken}
    />
  );
}

type ProviderLoginFormProps = {
  title?: string;
  description?: string;
  returnTo?: string;
  embedded?: boolean;
  csrfToken?: string;
};

export function ProviderLoginForm({
  title = "Provider Portal",
  description = "Đăng nhập bằng tài khoản provider để quản lý các đơn được phân công.",
  returnTo,
  embedded = false,
  csrfToken,
}: ProviderLoginFormProps = {}) {
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));
  const csrf = useAuthCsrfToken("provider_login", csrfToken);

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
            <input type="hidden" name="csrfToken" value={csrf.token} />
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            <Input name="email" type="email" placeholder="Email provider" autoComplete="email" required />
            <PasswordInput name="password" placeholder="Mật khẩu" autoComplete="current-password" />
            <Button type="submit" disabled={!csrf.ready} className="w-full">
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

export function RegisterForm({
  heading,
  subheading,
  sideImage,
  loginCsrfToken,
  registerCsrfToken,
}: AuthFormProps = {}) {
  return (
    <CustomerAuthView
      initialMode="register"
      heading={heading}
      subheading={subheading}
      sideImage={sideImage}
      loginCsrfToken={loginCsrfToken}
      registerCsrfToken={registerCsrfToken}
    />
  );
}
