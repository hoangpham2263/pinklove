import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { AddressDetails } from "@/components/common/address-editor-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerLinkButton } from "@/features/customer/ui/customer-buttons";
import { getUserAddressById } from "@/features/account/server/address-service";
import { requireAppUser } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function CustomerAddressDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const address = await getUserAddressById(user.id, id);

  if (!address) {
    notFound();
  }

  const returnTo = getSafeReturnTo(query.returnTo, ROUTES.CUSTOMER.CONFIG_ADDRESSES);
  const encodedReturnTo = encodeURIComponent(returnTo);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <CardTitle>Chi tiết địa chỉ</CardTitle>
          <div className="flex flex-wrap gap-2">
            <CustomerLinkButton href={returnTo}>Quay lại</CustomerLinkButton>
            <CustomerLinkButton href={`${ROUTES.CUSTOMER.CONFIG_ADDRESS_EDIT(address.id)}?returnTo=${encodedReturnTo}`} className="gap-2">
              <Pencil className="h-4 w-4" />
              Sửa địa chỉ
            </CustomerLinkButton>
          </div>
        </CardHeader>
        <CardContent>
          <AddressDetails address={address} />
        </CardContent>
      </Card>
    </section>
  );
}
