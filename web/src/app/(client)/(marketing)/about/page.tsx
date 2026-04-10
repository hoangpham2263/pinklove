import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type AboutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: AboutPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("about-us", searchParams);
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const page = await loadManagedPageForRoute("about-us", ROUTES.ABOUT, searchParams);
  return renderManagedPage(page);
}
