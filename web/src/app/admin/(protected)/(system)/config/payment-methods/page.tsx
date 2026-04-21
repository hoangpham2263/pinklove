import { PaymentMethodsTable } from "@/features/ecommerce/admin/payment-methods-table";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminConfigPaymentMethodsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
      </div>

      <PaymentMethodsTable methods={settings.ecommerce.paymentMethods} />
    </section>
  );
}
