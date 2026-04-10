import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";
import { ROUTES } from "@/lib/routes";

type QrBuilderPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: QrBuilderPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("tools/qr-builder", searchParams);
}

export default async function QrBuilderPage({ searchParams }: QrBuilderPageProps) {
  const page = await loadManagedPageForRoute("tools/qr-builder", ROUTES.TOOLS_PAGES.QR_BUILDER, searchParams);
  return renderManagedPage(page);
}
