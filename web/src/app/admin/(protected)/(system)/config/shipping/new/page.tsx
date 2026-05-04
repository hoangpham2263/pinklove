import { ShippingConnectionEditorForm } from "@/features/ecommerce/admin/shipping-connection-editor-form";
import { requireAdmin } from "@/lib/auth";

export default async function AdminShippingConnectionCreatePage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <ShippingConnectionEditorForm />
    </section>
  );
}
