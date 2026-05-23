"use client";

import { NativeForm } from "@/components/common/native-form";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Section, SectionContainer } from "@/components/common/section";
import { ROUTES } from "@/lib/routes";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";

export type AuthFormProps = {
  heading?: string;
  subheading?: string;
  sideImage?: string;
};

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
  if (error === "username_taken") return "Tên đăng nhập đã tồn tại.";
  if (error === "register_failed") return "Không thể tạo tài khoản. Vui lòng thử tên khác.";
  return "Xác thực không thành công.";
}

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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
              <div className="flex items-center gap-2">
                <Input
                  name="password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  {showLoginPassword ? "Hide" : "Show"}
                </Button>
              </div>
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
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));
  const returnTo = searchParams.get("returnTo");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  return (
    <Section>
      <SectionContainer>
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md mx-auto space-y-5">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{heading || "PinkLove"}</h1>
              <p className="text-muted-foreground">{subheading || "Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục."}</p>
            </div>

            <Card className="w-full border-0 md:border">
              <CardHeader>
                <CardTitle>Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <NativeForm
                  action={ROUTES.API.AUTH.LOGIN}
                  method="POST"
                  className="space-y-3"
                >
                  {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                  <Input name="username" placeholder="Tên đăng nhập" autoComplete="username" />
                  <div className="flex items-center gap-2">
                    <Input
                      name="password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                    >
                      {showLoginPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </NativeForm>
                <Link href={ROUTES.API.AUTH.GOOGLE_LOGIN} className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Tiếp tục với Google
                  </Button>
                </Link>
                {error ? <p className="text-destructive text-sm text-center">{error}</p> : null}
                <p className="text-center pt-2 text-sm text-muted-foreground">
                  No account?{" "}
                  <Link href={ROUTES.AUTH.REGISTER} className="text-primary hover:underline">
                    Register
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-muted/30 rounded-2xl h-full relative overflow-hidden min-h-125">
            {sideImage && (
              <Image 
                src={sideImage} 
                alt="Login visual" 
                fill 
                className="object-cover"
                priority
              />
            )}
            {!sideImage && (
              <div className="relative z-10 text-center max-w-sm">
                <div className="w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </Section>
  );
}

type PartnerLoginFormProps = {
  title?: string;
  description?: string;
  returnTo?: string;
  portalSlug?: string;
  embedded?: boolean;
};

export function PartnerLoginForm({
  title = "Partner Portal",
  description = "Đăng nhập bằng tài khoản provider để quản lý các đơn được phân công.",
  returnTo,
  portalSlug,
  embedded = false,
}: PartnerLoginFormProps = {}) {
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const loginCard = (
    <div className={embedded ? "w-full space-y-5" : "mx-auto w-full max-w-md space-y-5"}>
      <div className={`space-y-2 ${embedded ? "" : "text-center"}`}>
        <h1 className={`font-semibold tracking-tight ${embedded ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"}`}>{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className={`w-full ${embedded ? "border-zinc-200/80 bg-white/95 shadow-sm" : "border-0 md:border"}`}>
        <CardHeader>
          <CardTitle>Provider Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NativeForm action={ROUTES.API.PARTNER.AUTH.LOGIN} method="POST" className="space-y-3">
            {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
            {portalSlug ? <input type="hidden" name="portalSlug" value={portalSlug} /> : null}
            <Input name="username" placeholder="Tên đăng nhập provider" autoComplete="username" />
            <div className="flex items-center gap-2">
              <Input
                name="password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                autoComplete="current-password"
              />
              <Button type="button" variant="outline" onClick={() => setShowLoginPassword((prev) => !prev)}>
                {showLoginPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <Button type="submit" className="w-full">
              Vào partner portal
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

          <div className="relative hidden min-h-125 overflow-hidden rounded-2xl bg-muted/30 p-8 lg:flex lg:items-center lg:justify-center">
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
  const searchParams = useSearchParams();
  const error = getErrorMessage(searchParams.get("error"));
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  return (
    <Section>
      <SectionContainer>
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md mx-auto space-y-5">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{heading || "PinkLove"}</h1>
              <p className="text-muted-foreground">
                {subheading || "Chào mừng bạn đến với PinkLove! Tạo tài khoản để bắt đầu."}
              </p>
            </div>

            <Card className="w-full border-0 md:border">
              <CardHeader>
                <CardTitle>Tạo tài khoản của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <NativeForm
                  action={ROUTES.API.AUTH.REGISTER}
                  method="POST"
                  className="space-y-3"
                >
                  <Input name="username" placeholder="Tên đăng nhập mới" autoComplete="username" />
                  <div className="flex items-center gap-2">
                    <Input
                      name="password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder={`Mật khẩu (tối thiểu ${MIN_PASSWORD_LENGTH} ký tự)`}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                    >
                      {showRegisterPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full">Đăng ký tài khoản</Button>
                </NativeForm>
                {error ? <p className="text-destructive text-sm text-center">{error}</p> : null}
                <p className="text-center pt-2 text-sm text-muted-foreground">
                  Already have account?{" "}
                  <Link href={ROUTES.AUTH.LOGIN} className="text-primary hover:underline">
                    Login
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-muted/30 rounded-2xl h-full relative overflow-hidden min-h-125">
            {sideImage && (
              <Image 
                src={sideImage} 
                alt="Register visual" 
                fill 
                className="object-cover"
                priority
              />
            )}
            {!sideImage && (
              <div className="relative z-10 text-center max-w-sm">
                <div className="w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </SectionContainer>
    </Section>
  );
}
