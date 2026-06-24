import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản PinkLove để quản lý thiệp cưới, đơn hàng và kế hoạch cưới.",
};

export default async function LoginPage() {
  const authPage = await loadAuthPage("login");

  return (
    <LoginForm
      heading={authPage.heading}
      subheading={authPage.subheading}
      sideImage={authPage.sideImage}
    />
  );
}
