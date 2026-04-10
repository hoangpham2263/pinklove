import { notFound } from "next/navigation";
import { CustomerOrderDetail } from "@/features/ecommerce/components/customer-order-detail";
import { getOrderByIdForUser } from "@/features/ecommerce/server/service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderByIdForUser(user.id, id), getSystemSettings()]);

  if (!order) {
    notFound();
  }

  return <CustomerOrderDetail order={order} currencyFormat={settings.ecommerce} />;
}
