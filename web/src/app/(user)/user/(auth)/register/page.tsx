import { redirect } from"next/navigation";

import { RegisterForm } from"@/features/auth/components/login-forms";
import { getCurrentUser } from"@/lib/auth";

export default async function RegisterPage() { const user = await getCurrentUser();
 if (user) { const target = user.role ==="admin" ?"/admin/dashboard":"/user/dashboard";
 redirect(target); }

 return <RegisterForm />; }
