import { notFound } from "next/navigation";

import { AddressEditorForm } from "@/components/common/address-editor-form";
import { getUserAddressById } from "@/features/account/server/address-service";
import { ProviderPage, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function ProviderAddressEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const address = await getUserAddressById(provider.id, id);

  if (!address) {
    notFound();
  }

  const returnTo = getSafeReturnTo(query.returnTo, ROUTES.PROVIDER.CONFIG_ADDRESSES);

  return (
    <ProviderPage>
      <ProviderSectionCard title="Sửa địa chỉ provider">
        <AddressEditorForm
          actionUrl={ROUTES.API.ACCOUNT.ADDRESSES}
          returnTo={returnTo}
          cancelHref={returnTo}
          address={address}
        />
      </ProviderSectionCard>
    </ProviderPage>
  );
}
