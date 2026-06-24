import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/login-forms";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
} from "@/features/pages/server/managed-page-renderer";
import { getPageFields } from "@/lib/page-fields";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: RegisterPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("register", searchParams);
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const page = await loadManagedPageForRoute("register", searchParams);
  const fields = getPageFields<{
    heading?: string;
    subheading?: string;
    sideImage?: string;
  }>(page);

  return (
    <RegisterForm
      heading={fields.heading}
      subheading={fields.subheading}
      sideImage={fields.sideImage}
    />
  );
}
