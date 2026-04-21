import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PaymentMethodEditorForm } from "@/features/ecommerce/admin/payment-method-editor-form";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function NewConfigPaymentMethodPage() {
  await requireAdmin();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex justify-start">
        <Button variant="outline" render={<Link href={ROUTES.ADMIN.CONFIG_PAYMENT_METHODS}>Payment Methods</Link>} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Thêm phương thức thanh toán</h1>
        <p className="text-sm text-muted-foreground">
          Tạo phương thức checkout mới để gắn với manual, offline hoặc gateway thật.
        </p>
      </div>

      <PaymentMethodEditorForm />
    </section>
  );
}
