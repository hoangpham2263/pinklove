import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type ContactPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ContactPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("contact", searchParams);
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const page = await loadManagedPageForRoute("contact", ROUTES.CONTACT, searchParams);
  return renderManagedPage(page);
}
