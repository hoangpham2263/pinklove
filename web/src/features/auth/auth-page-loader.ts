import { notFound, redirect } from "next/navigation";
import type { AuthPageFields } from "@/features/auth/fields";
import { getCurrentUser } from "@/lib/auth";
import { getAccessiblePageBySlug } from "@/lib/managed-pages";
import { getPageFields } from "@/lib/page-fields";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { ROUTES } from "@/lib/routes";

export type LoadedAuthSystemPage = {
  heading?: string;
  subheading?: string;
  sideImage?: string;
};

export async function loadAuthPage(slug: "login" | "register"): Promise<LoadedAuthSystemPage> {
  const user = await getCurrentUser();

  if (user?.role === "user") {
    redirect(ROUTES.USER.DASHBOARD);
  }

  const page = await getAccessiblePageBySlug(slug, { allowAdminDraftAccess: true });
  if (!page) {
    notFound();
  }

  const customFields = getPageFields<AuthPageFields>(page);
  const sideImage = await resolveMediaUrl(customFields.sideImage);

  return {
    heading: customFields.heading,
    subheading: customFields.subheading,
    sideImage,
  };
}
