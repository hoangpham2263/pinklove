import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  return generateManagedPageMetadata("home", searchParams);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const page = await loadManagedPageForRoute("home", searchParams);
  return renderManagedPage(page);
}
