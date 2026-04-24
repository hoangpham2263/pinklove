import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { LoginForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";
import { buildManagedPageMetadata, getAccessiblePageBySlug } from "@/lib/managed-pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAccessiblePageBySlug("login", {
    allowAdminDraftAccess: true,
  });

  return page ? await buildManagedPageMetadata(page) : {};
}

export default async function LoginPage() {
  const [page, authPage] = await Promise.all([
    getAccessiblePageBySlug("login", { allowAdminDraftAccess: true }),
    loadAuthPage("login"),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <PageStructuredData page={page} />
      <LoginForm
        heading={authPage.heading}
        subheading={authPage.subheading}
        sideImage={authPage.sideImage}
      />
    </Suspense>
  );
}
