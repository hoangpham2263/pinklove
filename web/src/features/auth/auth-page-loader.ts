import { redirect } from "next/navigation";
import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export type LoadedAuthSystemPage = {
  heading?: string;
  subheading?: string;
  sideImage?: string;
};

export async function loadAuthPage(slug: "login" | "register"): Promise<LoadedAuthSystemPage> {
  void slug;
  const user = await getCurrentUser();

  if (user && !isAdminRole(user.role)) {
    redirect(ROUTES.CUSTOMER.DASHBOARD);
  }

  return {};
}
