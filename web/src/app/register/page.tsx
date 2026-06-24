import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản PinkLove để lưu mẫu yêu thích, đặt dịch vụ và quản lý hành trình cưới.",
};

export default async function RegisterPage() {
  const authPage = await loadAuthPage("register");

  return (
    <RegisterForm
      heading={authPage.heading}
      subheading={authPage.subheading}
      sideImage={authPage.sideImage}
    />
  );
}
