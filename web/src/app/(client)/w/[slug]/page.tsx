import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPublicWeddingSiteBySlug } from "@/features/sites/server/service";
import { renderWeddingSite } from "@/features/sites/templates";

type WeddingSitePublicPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WeddingSitePublicPage({ params, searchParams }: WeddingSitePublicPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const site = await getPublicWeddingSiteBySlug(slug);
  if (!site) {
    notFound();
  }

  if (site.status !== "published") {
    const user = await getCurrentUser();
    const preview = query.preview === "1";
    if (!preview || (!user || (user.id !== site.userId && user.role !== "admin"))) {
      notFound();
    }
  }

  return renderWeddingSite(site);
}
