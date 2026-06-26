import { ShippingConnectionsTable } from "@/features/ecommerce/admin/shipping-connections-table";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminShippingPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <ShippingConnectionsTable connections={settings.ecommerce.shippingAccounts} />
    </section>
  );
}
