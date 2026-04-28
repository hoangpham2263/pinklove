import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type AboutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: AboutPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("gioi-thieu", searchParams);
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const page = await loadManagedPageForRoute("gioi-thieu", "/about", searchParams);
  return renderManagedPage(page);
}
