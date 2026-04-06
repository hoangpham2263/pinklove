import { RegisterForm } from "@/features/auth/components/login-forms";
import { loadAuthSystemPage } from "./page-loader";

export async function RegisterSystemPage() {
  const page = await loadAuthSystemPage("register");

  return (
    <RegisterForm
      heading={page.heading}
      subheading={page.subheading}
      sideImage={page.sideImage}
    />
  );
}
