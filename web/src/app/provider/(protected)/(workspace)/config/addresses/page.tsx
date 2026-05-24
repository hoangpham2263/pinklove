import { PageToast } from "@/components/common/page-toast";
import { AddressBookManager } from "@/components/common/address-book-manager";
import { listUserAddresses } from "@/features/account/server/address-service";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function ProviderConfigAddressesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const provider = await requireProvider(ROUTES.PROVIDER.LOGIN);
  const query = (await searchParams) ?? {};
  const addresses = await listUserAddresses(provider.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.addressesSaved ? (
        <PageToast message="Đã cập nhật cấu hình địa chỉ provider." variant="success" cleanupKeys={["addressesSaved"]} />
      ) : null}
      {query.addressError ? <PageToast message="Không thể lưu địa chỉ. Vui lòng kiểm tra các trường bắt buộc." variant="error" /> : null}

      <AddressBookManager
        addresses={addresses}
        actionUrl={ROUTES.API.ACCOUNT.ADDRESSES}
        returnTo={ROUTES.PROVIDER.CONFIG_ADDRESSES}
        createHref={ROUTES.PROVIDER.CONFIG_ADDRESS_NEW}
        getViewHref={ROUTES.PROVIDER.CONFIG_ADDRESS}
        getEditHref={ROUTES.PROVIDER.CONFIG_ADDRESS_EDIT}
        title="Địa chỉ provider"
        description="Danh sách địa chỉ dùng chung cho giao nhận, lấy hàng, hoàn hàng và các luồng cần địa chỉ của provider."
      />
    </section>
  );
}
