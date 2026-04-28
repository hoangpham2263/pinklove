import type { Metadata } from "next";
import {
  generateManagedPageMetadata,
  loadManagedPageForRoute,
  renderManagedPage,
} from "@/features/pages/server/managed-page-renderer";

type QrBuilderPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: QrBuilderPageProps): Promise<Metadata> {
  return generateManagedPageMetadata("cong-cu/tao-ma-qr", searchParams);
}

export default async function QrBuilderPage({ searchParams }: QrBuilderPageProps) {
  const page = await loadManagedPageForRoute("cong-cu/tao-ma-qr", "/tools/qr-builder", searchParams);
  return renderManagedPage(page);
}
