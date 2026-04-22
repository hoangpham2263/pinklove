import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerBuilderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAppUser(ROUTES.AUTH.LOGIN);

  return <div className="min-h-screen bg-background">{children}</div>;
}

