import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type WeddingBudgetPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: WeddingBudgetPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("cong-cu/du-toan-cuoi", searchParams);
}

export default async function WeddingBudgetPage({ searchParams }: WeddingBudgetPageProps) {
  const page = await loadManagedPageForRoute("cong-cu/du-toan-cuoi", "/tools/wedding-budget", searchParams);
  return renderManagedPage(page);
}
