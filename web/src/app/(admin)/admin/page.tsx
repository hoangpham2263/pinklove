import { redirect } from"next/navigation";
import { getCurrentUser } from"@/lib/auth";

export default async function AdminIndexPage() {
 const user = await getCurrentUser();
 if (!user || user.role !=="admin") {
 redirect("/admin/login");
 }
 redirect("/admin/dashboard");
}
