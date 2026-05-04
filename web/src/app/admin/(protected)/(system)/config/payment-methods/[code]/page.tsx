import Link from"next/link";
import { notFound } from"next/navigation";

import { Button } from"@/components/ui/button";
import { PaymentMethodEditorForm } from"@/features/ecommerce/admin/payment-method-editor-form";
import { requireAdmin } from"@/lib/auth";
import { ROUTES } from"@/lib/routes";
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
      <div className="flex justify-start">
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.CONFIG_PAYMENT_METHODS}>Payment Methods</Link>} />
      </div>

      <div className="space-y-2">
        <h1>Sửa phương thức thanh toán</h1>
        <p className="text-muted-foreground">
          Cấu hình nhóm chính, tên hiển thị, provider, kiểu xử lý và điều kiện xuất hiện tại checkout.
        </p>
      </div>

      <PaymentMethodEditorForm method={method} />
    </section>
  );
}
