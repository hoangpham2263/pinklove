import { notFound } from"next/navigation";

import { PaymentMethodEditorForm } from"@/features/ecommerce/admin/payment-method-editor-form";
import { requireAdmin } from"@/lib/auth";
import { getSystemSettings } from"@/lib/system-settings";

export default async function EditConfigPaymentMethodPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireAdmin();
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);
  const settings = await getSystemSettings();
  const method = settings.ecommerce.paymentMethods.find((item) => item.code === decodedCode);

  if (!method) {
    notFound();
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <PaymentMethodEditorForm method={method} />
    </section>
  );
}
