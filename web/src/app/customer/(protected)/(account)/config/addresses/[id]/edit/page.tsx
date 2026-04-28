import { notFound } from "next/navigation";

import { AddressEditorForm } from "@/components/common/address-editor-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserAddressById } from "@/features/account/server/address-service";
import { requireAppUser } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function CustomerAddressEditPage({
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

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card>
        <CardHeader>
          <CardTitle>Sửa địa chỉ</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressEditorForm
            actionUrl={ROUTES.API.ACCOUNT.ADDRESSES}
            returnTo={returnTo}
            cancelHref={returnTo}
            address={address}
          />
        </CardContent>
      </Card>
    </section>
  );
}
