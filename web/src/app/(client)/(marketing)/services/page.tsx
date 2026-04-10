import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type ServicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ServicesPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("services", searchParams);
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const page = await loadManagedPageForRoute("services", ROUTES.SERVICES, searchParams);
  return renderManagedPage(page);
}
