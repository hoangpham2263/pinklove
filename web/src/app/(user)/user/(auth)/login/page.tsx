import type { Metadata } from "next";
import { Suspense } from "react";
import { PageStructuredData } from "@/components/common/page-structured-data";
import { LoginForm } from "@/features/auth/components/login-forms";
import { loadAuthPage } from "@/features/auth/auth-page-loader";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata, getCmsPageBySlug, getPublishedCmsPageBySlug } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getCurrentUser())?.role === "admin"
    ? await getCmsPageBySlug("login")
    : await getPublishedCmsPageBySlug("login");

  return page ? await buildPageMetadata(page) : {};
}

export default async function LoginPage() {
  const [page, authPage] = await Promise.all([
    getCmsPageBySlug("login"),
    loadAuthPage("login"),
  ]);

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
