import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type BuilderLandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: BuilderLandingPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("tu-tao-thiep", searchParams);
}

export default async function BuilderLandingPage({ searchParams }: BuilderLandingPageProps) {
  const page = await loadManagedPageForRoute("tu-tao-thiep", "/builder", searchParams);
  return renderManagedPage(page, searchParams);
}
