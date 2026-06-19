import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type BlogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("blog", searchParams);
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const page = await loadManagedPageForRoute("blog", searchParams);
  return renderManagedPage(page);
}
