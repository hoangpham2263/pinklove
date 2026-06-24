import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
} from "@/features/pages/server/managed-page-renderer";
import { ProviderApplicationSection } from "@/features/provider-applications/components/provider-application-section";

type ProviderApplyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ProviderApplyPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("providers", searchParams);
}

export default async function ProviderApplyPage({ searchParams }: ProviderApplyPageProps) {
  const page = await loadManagedPageForRoute("providers", searchParams);

  return <ProviderApplicationSection page={page} />;
}
