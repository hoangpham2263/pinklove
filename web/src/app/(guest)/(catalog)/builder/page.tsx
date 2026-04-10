import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type BuilderLandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: BuilderLandingPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("builder", searchParams);
}

export default async function BuilderLandingPage({ searchParams }: BuilderLandingPageProps) {
  const page = await loadManagedPageForRoute("builder", ROUTES.BUILDER, searchParams);
  return renderManagedPage(page);
}
