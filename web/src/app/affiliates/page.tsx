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

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AffiliateApplyPage({ searchParams }: AffiliateApplyPageProps) {
  const query = (await searchParams) ?? {};
  const page = await loadManagedPageForRoute("affiliates", searchParams);
  const submitted = getSingleParam(query.submitted) === "1";
  const error = getSingleParam(query.error);

  return <AffiliateApplicationSection page={page} submitted={submitted} error={error} />;
}
