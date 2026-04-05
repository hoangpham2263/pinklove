import { redirect } from"next/navigation";

import { AdminLoginForm } from"@/features/auth/components/login-forms";
import { getCurrentUser } from"@/lib/auth";

export default async function AdminLoginPage() {
 const user = await getCurrentUser();
 if (user) {
 const target = user.role ==="admin" ?"/admin/dashboard" :"/user/dashboard";
 redirect(target);
 }

 return <AdminLoginForm />;
}
