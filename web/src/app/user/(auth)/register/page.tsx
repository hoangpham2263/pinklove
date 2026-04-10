import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { RegisterForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";
import { buildManagedPageMetadata, getAccessiblePageBySlug } from "@/lib/managed-pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAccessiblePageBySlug("register", {
    allowAdminDraftAccess: true,
  });

  return page ? await buildManagedPageMetadata(page) : {};
}

export default async function RegisterPage() {
  const [page, authPage] = await Promise.all([
    getAccessiblePageBySlug("register", { allowAdminDraftAccess: true }),
    loadAuthPage("register"),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <PageStructuredData page={page} />
      <RegisterForm
        heading={authPage.heading}
        subheading={authPage.subheading}
        sideImage={authPage.sideImage}
      />
    </Suspense>
  );
}
