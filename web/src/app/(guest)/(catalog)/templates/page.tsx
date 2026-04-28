import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: TemplatesPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("mau-thiep", searchParams);
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const page = await loadManagedPageForRoute("mau-thiep", "/templates", searchParams);
  return renderManagedPage(page);
}
