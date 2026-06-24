import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
} from "@/features/pages/server/managed-page-renderer";
import { AffiliateApplicationSection } from "@/features/affiliate-applications/components/affiliate-application-section";

type AffiliateApplyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: AffiliateApplyPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("affiliates", searchParams);
}

export default async function AffiliateApplyPage({ searchParams }: AffiliateApplyPageProps) {
  const page = await loadManagedPageForRoute("affiliates", searchParams);

  return <AffiliateApplicationSection page={page} />;
}
