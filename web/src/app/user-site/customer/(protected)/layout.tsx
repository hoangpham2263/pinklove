import { CustomerShellLayout } from "@/features/customer/components/customer-shell-layout";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, settings] = await Promise.all([requireAppUser(ROUTES.AUTH.LOGIN), getSystemSettings()]);

  return <CustomerShellLayout user={user} settings={settings}>{children}</CustomerShellLayout>;
}
