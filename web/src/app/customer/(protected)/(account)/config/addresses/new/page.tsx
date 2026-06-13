import { AddressEditorForm } from "@/components/common/address-editor-form";
import { requireAppUser } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export default async function CustomerAddressNewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAppUser(ROUTES.AUTH.LOGIN);
  const query = (await searchParams) ?? {};
  const returnTo = getSafeReturnTo(query.returnTo, ROUTES.CUSTOMER.CONFIG_ADDRESSES);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Thêm địa chỉ</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tạo địa chỉ dùng cho checkout và các luồng giao nhận.</p>
      </div>
      <AddressEditorForm actionUrl={ROUTES.API.ACCOUNT.ADDRESSES} returnTo={returnTo} cancelHref={returnTo} />
    </section>
  );
}
