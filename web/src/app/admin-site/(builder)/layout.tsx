import { requireAdmin } from "@/lib/auth";

export default async function AdminBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <div className="min-h-screen bg-background">{children}</div>;
}
