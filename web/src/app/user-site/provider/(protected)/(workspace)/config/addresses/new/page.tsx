import { AddressEditorForm } from "@/components/common/address-editor-form";
import { ProviderPage, ProviderPageHeader } from "@/features/provider-orders/components/provider-page";
import { requireProvider } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function ProviderAddressNewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireProvider(ROUTES.PROVIDER.LOGIN);
  const query = (await searchParams) ?? {};
  const returnTo = getSafeReturnTo(query.returnTo, ROUTES.PROVIDER.CONFIG_ADDRESSES);

  return (
    <ProviderPage>
      <ProviderPageHeader title="Thêm địa chỉ provider" description="Tạo địa chỉ dùng cho lấy hàng, hoàn hàng và giao nhận provider." />
      <AddressEditorForm actionUrl={ROUTES.API.ACCOUNT.ADDRESSES} returnTo={returnTo} cancelHref={returnTo} />
    </ProviderPage>
  );
}
