import { redirect } from"next/navigation";
import { getCurrentUser } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminIndexPage() {
 const user = await getCurrentUser();
 if (!user || user.role !=="admin") {
 redirect(ROUTES.ADMIN.LOGIN);
 }
 redirect(ROUTES.ADMIN.DASHBOARD);
}
