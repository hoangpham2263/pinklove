import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { LoginForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAccessibleCmsPageBySlug("login", {
    allowAdminDraftAccess: true,
  });

  return page ? await buildPageMetadata(page) : {};
}

export default async function LoginPage() {
  const [page, authPage] = await Promise.all([
    getAccessibleCmsPageBySlug("login", { allowAdminDraftAccess: true }),
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
