import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { AddressDetails } from "@/components/common/address-editor-form";
import { Button } from "@/components/ui/button";
import { getUserAddressById } from "@/features/account/server/address-service";
import { ProviderPage, ProviderSectionCard } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function ProviderAddressDetailPage({
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
  const encodedReturnTo = encodeURIComponent(returnTo);

  return (
    <ProviderPage>
      <ProviderSectionCard
        title="Chi tiết địa chỉ provider"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link href={returnTo}>Quay lại</Link>} />
            <Button
              className="gap-2"
              render={
                <Link href={`${ROUTES.PROVIDER.CONFIG_ADDRESS_EDIT(address.id)}?returnTo=${encodedReturnTo}`}>
                  <Pencil className="h-4 w-4" />
                  Sửa địa chỉ
                </Link>
              }
            />
          </div>
        }
      >
        <AddressDetails address={address} />
      </ProviderSectionCard>
    </ProviderPage>
  );
}
