import { notFound } from "next/navigation";
import { ShippingConnectionEditorForm } from "@/features/ecommerce/admin/shipping-connection-editor-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

type AdminShippingConnectionEditPageProps = {
  params: Promise<{ code: string }>;
};

export default async function AdminShippingConnectionEditPage({ params }: AdminShippingConnectionEditPageProps) {
  await requireAdmin();
  const { code } = await params;
  const settings = await getSystemSettings();
  const connection = settings.ecommerce.shippingAccounts.find((item) => item.code === decodeURIComponent(code));

  if (!connection) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <ShippingConnectionEditorForm connection={connection} />
    </section>
  );
}
