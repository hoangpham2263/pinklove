import { RegisterForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/page-loader";

export default async function RegisterPage() {
  const page = await loadAuthPage("register");

  return (
    <RegisterForm
      heading={page.heading}
      subheading={page.subheading}
      sideImage={page.sideImage}
    />
  );
}
