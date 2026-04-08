import { notFound, redirect } from "next/navigation";
import type { AuthPageFields } from "@/features/auth/fields";
import { getCurrentUser } from "@/lib/auth";
import { getCmsPageBySlug } from "@/lib/cms";
import { getFields } from "@/lib/cms-fields";
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

  const page = await getCmsPageBySlug(slug);
  if (!page || (page.status !== "published" && user?.role !== "admin")) {
    notFound();
  }

  const customFields = getFields<AuthPageFields>(page);
  const sideImage = await resolveMediaUrl(customFields.sideImage);

  return {
    heading: customFields.heading,
    subheading: customFields.subheading,
    sideImage,
  };
}
