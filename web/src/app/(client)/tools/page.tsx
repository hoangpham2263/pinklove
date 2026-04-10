import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type ToolsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("tools", searchParams);
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const page = await loadManagedPageForRoute("tools", ROUTES.TOOLS, searchParams);
  return renderManagedPage(page);
}
