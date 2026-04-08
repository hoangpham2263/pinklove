import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { RegisterForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";
import { buildPageMetadata, getAccessibleCmsPageBySlug } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAccessibleCmsPageBySlug("register", {
    allowAdminDraftAccess: true,
  });

  return page ? await buildPageMetadata(page) : {};
}

export default async function RegisterPage() {
  const [page, authPage] = await Promise.all([
    getAccessibleCmsPageBySlug("register", { allowAdminDraftAccess: true }),
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
