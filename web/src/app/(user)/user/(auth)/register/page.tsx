import { redirect } from "next/navigation";

import { RegisterForm } from "@/features/auth/components/login-forms";
import { getCurrentUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getCmsPageBySlug } from "@/lib/cms";

export default async function RegisterPage() { 
  const user = await getCurrentUser();
  if (user) { 
    const target = user.role === "admin" ? ROUTES.ADMIN.DASHBOARD : ROUTES.USER.DASHBOARD;
    redirect(target); 
  }

  const page = await getCmsPageBySlug("register");
  const customFields = page?.customFields || {};

  return (
    <RegisterForm 
      heading={customFields.heading}
      subheading={customFields.subheading}
      sideImage={customFields.sideImage}
      quote={customFields.quote}
      quoteAuthor={customFields.quoteAuthor}
    />
  ); 
}