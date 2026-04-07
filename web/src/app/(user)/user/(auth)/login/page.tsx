import { LoginForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/page-loader";

export default async function LoginPage() {
  const page = await loadAuthPage("login");

  return (
    <LoginForm
      heading={page.heading}
      subheading={page.subheading}
      sideImage={page.sideImage}
    />
  );
}
