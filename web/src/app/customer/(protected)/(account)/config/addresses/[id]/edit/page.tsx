import { notFound } from "next/navigation";

import { AddressEditorForm } from "@/components/common/address-editor-form";
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
      <div>
        <h1 className="text-2xl font-semibold">Sửa địa chỉ</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cập nhật thông tin người nhận, khu vực và thiết lập mặc định.</p>
      </div>
      <AddressEditorForm
        actionUrl={ROUTES.API.ACCOUNT.ADDRESSES}
        returnTo={returnTo}
        cancelHref={returnTo}
        address={address}
      />
    </section>
  );
}
