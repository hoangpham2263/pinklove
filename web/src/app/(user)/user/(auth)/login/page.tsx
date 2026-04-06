import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-forms";
import { getCurrentUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getCmsPageBySlug } from "@/lib/cms";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "user") {
    redirect(ROUTES.USER.DASHBOARD);
  }

  const page = await getCmsPageBySlug("login");
  const customFields = page?.customFields || {};

  return (
    <LoginForm 
      heading={customFields.heading}
      subheading={customFields.subheading}
      sideImage={customFields.sideImage}
      quote={customFields.quote}
      quoteAuthor={customFields.quoteAuthor}
    />
  ); 
}
