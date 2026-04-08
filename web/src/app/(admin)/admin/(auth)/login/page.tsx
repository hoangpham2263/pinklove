import { Suspense } from "react";
import { redirect } from"next/navigation";

import { AdminLoginForm } from"@/features/auth/components/login-forms";
import { getCurrentUser } from"@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminLoginPage() {
 const user = await getCurrentUser();
 if (user) {
 const target = user.role ==="admin" ?ROUTES.ADMIN.DASHBOARD :ROUTES.USER.DASHBOARD;
 redirect(target);
 }

 return (
  <Suspense fallback={null}>
   <AdminLoginForm />
  </Suspense>
 );
}
