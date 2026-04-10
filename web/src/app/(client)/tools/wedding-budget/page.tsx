import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type WeddingBudgetPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: WeddingBudgetPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("tools/wedding-budget", searchParams);
}

export default async function WeddingBudgetPage({ searchParams }: WeddingBudgetPageProps) {
  const page = await loadManagedPageForRoute("tools/wedding-budget", ROUTES.TOOLS_PAGES.WEDDING_BUDGET, searchParams);
  return renderManagedPage(page);
}
