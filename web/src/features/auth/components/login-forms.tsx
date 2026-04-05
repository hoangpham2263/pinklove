"use client";

import { NativeForm } from"@/components/common/native-form";
import { useState } from"react";
import Link from"next/link";
import Image from"next/image";
import { useSearchParams } from"next/navigation";

import { Button } from"@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import { Section, SectionContainer } from"@/components/common/section";

function getErrorMessage(error: string | null): string | null {
 if (!error) return null;

 if (error ==="missing_fields") return"Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
 if (
 error ==="invalid_credentials" ||
 error ==="not_admin" ||
 error ==="use_admin_login" ||
 error ==="not_user"
 ) {
 return"Tên đăng nhập hoặc mật khẩu không chính xác.";
 }
 if (error ==="google_not_configured") return"Đăng nhập Google chưa được cấu hình.";
 if (error ==="google_callback_invalid") return"Phản hồi từ Google không hợp lệ.";
 if (error ==="google_state_invalid") return"Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.";
 if (error ==="google_login_failed") return"Đăng nhập Google thất bại. Vui lòng thử lại.";
 if (error ==="weak_password") return"Mật khẩu phải có ít nhất 6 ký tự.";
 if (error ==="username_taken") return"Tên đăng nhập đã tồn tại.";
 if (error ==="register_failed") return"Không thể tạo tài khoản. Vui lòng thử tên khác.";
 return"Xác thực không thành công.";
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

  <Card className="w-full border-primary/20 shadow-md">
   <CardHeader>
   <CardTitle>Admin Login</CardTitle>
   </CardHeader>
   <CardContent className="space-y-3">
   <NativeForm
    action="/api/admin/auth/login"
    method="POST"
    className="space-y-3"
   >
    <Input name="username" placeholder="Tên đăng nhập" autoComplete="username" />
    <div className="flex items-center gap-2">
    <Input
     name="password"
     type={showLoginPassword ?"text" :"password"}
     placeholder="Mật khẩu"
     autoComplete="current-password"
    />
    <Button
     type="button"
     variant="outline"
     onClick={() => setShowLoginPassword((prev) => !prev)}
    >
     {showLoginPassword ?"Hide" :"Show"}
    </Button>
    </div>
    <Button type="submit" className="w-full" variant="default">
    Login to Dashboard
    </Button>
   </NativeForm>
   {error ? <p className="text-destructive text-center">{error}</p> : null}
   <div className="pt-2 text-center">
    <Link href="/user/login" className="text-muted-foreground hover:underline">
    Đăng nhập với tư cách Người dùng
    </Link>
   </div>
   </CardContent>
  </Card>
  </div>
 </section>
 );
}

export function LoginForm() {
 const searchParams = useSearchParams();
 const error = getErrorMessage(searchParams.get("error"));
 const [showLoginPassword, setShowLoginPassword] = useState(false);

 return (
 <Section>
  <SectionContainer>
  <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
   <div className="w-full max-w-md mx-auto space-y-5">
   <div className="space-y-2 text-center">
    <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">PinkLove</h1>
    <p className="text-muted-foreground">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
   </div>

   <Card className="w-full shadow-none border-0 md:border md:shadow-sm">
    <CardHeader>
    <CardTitle>Login</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
    <NativeForm
     action="/api/auth/login"
     method="POST"
     className="space-y-3"
    >
     <Input name="username" placeholder="Tên đăng nhập" autoComplete="username" />
     <div className="flex items-center gap-2">
     <Input
      name="password"
      type={showLoginPassword ?"text":"password"}
      placeholder="Mật khẩu"
      autoComplete="current-password"
     />
     <Button
      type="button"
      variant="outline"
      onClick={() => setShowLoginPassword((prev) => !prev)}
     >
      {showLoginPassword ?"Hide":"Show"}
     </Button>
     </div>
     <Button type="submit" className="w-full">
     Login
     </Button>
    </NativeForm>
    <a href="/api/auth/google/login" className="block">
     <Button type="button" variant="outline" className="w-full">
     Tiếp tục với Google
     </Button>
    </a>
    {error ? <p className="text-destructive">{error}</p> : null}
    <p className="text-center pt-2">
     No account?{""}
     <Link href="/user/register" className="text-primary hover:underline">
     Register
     </Link>
    </p>
    </CardContent>
   </Card>
   </div>
   <div className="relative hidden w-full h-[600px] lg:block rounded-2xl overflow-hidden bg-muted">
   <Image 
    src="/uploads/2026/04/1775232741605-aaf9bf4e-7119-4298-9180-75374e653e23.jpg" 
    alt="Login background" 
    fill 
    className="object-cover" 
    priority
   />
   </div>
  </div>
  </SectionContainer>
 </Section>
 );
}

export function RegisterForm() {
 const searchParams = useSearchParams();
 const error = getErrorMessage(searchParams.get("error"));
 const [showRegisterPassword, setShowRegisterPassword] = useState(false);

 return (
 <Section>
  <SectionContainer>
  <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
   <div className="w-full max-w-md mx-auto space-y-5">
   <div className="space-y-2 text-center">
    <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">PinkLove</h1>
    <p className="text-muted-foreground">
    Chào mừng bạn đến với PinkLove! Tạo tài khoản để bắt đầu.
    </p>
   </div>

   <Card className="w-full shadow-none border-0 md:border md:shadow-sm">
    <CardHeader>
    <CardTitle>Tạo tài khoản của bạn</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
    <NativeForm
     action="/api/auth/register"
     method="POST"
     className="space-y-3"
    >
     <Input name="username" placeholder="Tên đăng nhập mới" autoComplete="username" />
     <div className="flex items-center gap-2">
     <Input
      name="password"
      type={showRegisterPassword ?"text":"password"}
      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
      autoComplete="new-password"
     />
     <Button
      type="button"
      variant="outline"
      onClick={() => setShowRegisterPassword((prev) => !prev)}
     >
      {showRegisterPassword ?"Hide":"Show"}
     </Button>
     </div>
     <Button type="submit" className="w-full">Đăng ký tài khoản</Button>
    </NativeForm>
    {error ? <p className="text-destructive">{error}</p> : null}
    <p className="text-center pt-2">
     Already have account?{""}
     <Link href="/user/login" className="text-primary hover:underline">
     Login
     </Link>
    </p>
    </CardContent>
   </Card>
   </div>
   <div className="relative hidden w-full h-[600px] lg:block rounded-2xl overflow-hidden bg-muted">
   <Image 
    src="/uploads/2026/04/1775224982311-2aed8cb0-10ef-4a77-a87e-68b0bf661ee1.jpg" 
    alt="Register background" 
    fill 
    className="object-cover" 
    priority
   />
   </div>
  </div>
  </SectionContainer>
 </Section>
 );
}
