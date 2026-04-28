import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type ContactPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ContactPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("lien-he", searchParams);
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const page = await loadManagedPageForRoute("lien-he", "/contact", searchParams);
  return renderManagedPage(page);
}
