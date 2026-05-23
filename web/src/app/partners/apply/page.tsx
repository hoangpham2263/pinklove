import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
} from "@/features/pages/server/managed-page-renderer";
import { ProviderApplicationSection } from "@/features/provider-applications/components/provider-application-section";
import { ROUTES } from "@/lib/routes";

type PartnerApplyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PartnerApplyPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("partners/apply", searchParams);
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PartnerApplyPage({ searchParams }: PartnerApplyPageProps) {
  const query = (await searchParams) ?? {};
  const page = await loadManagedPageForRoute("partners/apply", ROUTES.PARTNER.APPLY, searchParams);
  const submitted = getSingleParam(query.submitted) === "1";
  const error = getSingleParam(query.error);

  return <ProviderApplicationSection page={page} submitted={submitted} error={error} />;
}
