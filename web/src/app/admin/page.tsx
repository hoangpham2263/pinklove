import { redirect } from"next/navigation";
import { getCurrentUser, isAdminRole } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminIndexPage() {
 const user = await getCurrentUser();
 if (!user || !isAdminRole(user.role)) {
 redirect(ROUTES.ADMIN.LOGIN);
 }
 redirect(ROUTES.ADMIN.DASHBOARD);
}
