import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-forms";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
} from "@/features/pages/server/managed-page-renderer";
import { getPageFields } from "@/lib/page-fields";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: LoginPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("login", searchParams);
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const page = await loadManagedPageForRoute("login", searchParams);
  const fields = getPageFields<{
    heading?: string;
    subheading?: string;
    sideImage?: string;
  }>(page);

  return (
    <LoginForm
      heading={fields.heading}
      subheading={fields.subheading}
      sideImage={fields.sideImage}
    />
  );
}
