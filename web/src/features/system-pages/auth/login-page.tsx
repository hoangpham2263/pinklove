import { LoginForm } from "@/features/auth/components/login-forms";
import { loadAuthSystemPage } from "./page-loader";

export async function LoginSystemPage() {
  const page = await loadAuthSystemPage("login");

  return (
    <LoginForm
      heading={page.heading}
      subheading={page.subheading}
      sideImage={page.sideImage}
    />
  );
}
