import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: TemplatesPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("templates", searchParams);
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const page = await loadManagedPageForRoute("templates", ROUTES.TEMPLATES, searchParams);
  return renderManagedPage(page);
}
