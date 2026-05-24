import { AddressEditorForm } from "@/components/common/address-editor-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <Card>
        <CardHeader>
          <CardTitle>Thêm địa chỉ provider</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressEditorForm actionUrl={ROUTES.API.ACCOUNT.ADDRESSES} returnTo={returnTo} cancelHref={returnTo} />
        </CardContent>
      </Card>
    </section>
  );
}
