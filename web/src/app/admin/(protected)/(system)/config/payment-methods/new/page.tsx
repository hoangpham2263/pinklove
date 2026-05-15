import { AdminBackButton } from"@/features/admin/components/admin-buttons";
import { PaymentMethodEditorForm } from"@/features/ecommerce/admin/payment-method-editor-form";
import { requireAdmin } from"@/lib/auth";
import { ROUTES } from"@/lib/routes";
import type { EcommercePaymentMethodSettings } from"@/lib/system-settings";

function parseInitialCategory(value: string | string[] | undefined): EcommercePaymentMethodSettings["category"] {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized ==="manual" || normalized ==="offline") {
    return normalized;
  }
  return"manual";
}

function getCategoryDescription(category: EcommercePaymentMethodSettings["category"]) {
  switch (category) {
    case"manual":
      return"Thêm phương thức chuyển khoản, VietQR hoặc thanh toán cần nhân sự đối soát.";
    case"offline":
      return"Thêm phương thức COD, tiền mặt, thanh toán tại studio hoặc thu trực tiếp khi bàn giao.";
    default:
      return"Thêm phương thức chuyển khoản, VietQR hoặc thanh toán cần nhân sự đối soát.";
  }
}

export default async function NewConfigPaymentMethodPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string | string[] }>;
}) {
  await requireAdmin();
  const params = searchParams ? await searchParams : undefined;
  const initialCategory = parseInitialCategory(params?.category);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex justify-start">
        <AdminBackButton href={ROUTES.ADMIN.CONFIG_PAYMENT_METHODS}>Payment Methods</AdminBackButton>
      </div>

      <div className="space-y-2">
        <h1>Thêm phương thức thanh toán</h1>
        <p className="text-muted-foreground">{getCategoryDescription(initialCategory)}</p>
      </div>

      <PaymentMethodEditorForm initialCategory={initialCategory} />
    </section>
  );
}
