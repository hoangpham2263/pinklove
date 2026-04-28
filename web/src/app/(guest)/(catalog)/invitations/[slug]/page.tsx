import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { getPublicInvitationBySlug } from "@/features/invitations/server/service";
import { renderInvitationSite } from "@/features/invitations/templates/renderers";
import { getInvitationPath } from "@/lib/public-paths";

type InvitationSitePublicPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvitationSitePublicPage({ params, searchParams }: InvitationSitePublicPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const site = await getPublicInvitationBySlug(slug);
  if (!site) {
    notFound();
  }

  const targetPath = getInvitationPath(site);
  if (targetPath !== `/invitations/${site.slug}`) {
    redirect(targetPath);
  }

  if (site.status !== "published") {
    const user = await getCurrentUser();
    const preview = query.preview === "1";
    if (!preview || (!user || (user.id !== site.userId && !isAdminRole(user.role)))) {
      notFound();
    }
  }

  return await renderInvitationSite(site);
}
