import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type ToolsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("cong-cu", searchParams);
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const page = await loadManagedPageForRoute("cong-cu", "/tools", searchParams);
  return renderManagedPage(page);
}
