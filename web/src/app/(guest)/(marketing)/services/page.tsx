import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type ServicesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ServicesPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("dich-vu", searchParams);
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const page = await loadManagedPageForRoute("dich-vu", "/services", searchParams);
  return renderManagedPage(page);
}
