import { redirect } from"next/navigation";

import { LoginForm } from"@/features/auth/components/login-forms";
import { getCurrentUser } from"@/lib/auth";

export default async function LoginPage() { const user = await getCurrentUser();
 if (user) { const target = user.role ==="admin" ?"/admin/dashboard":"/user/dashboard";
 redirect(target); }

 return <LoginForm />; }
