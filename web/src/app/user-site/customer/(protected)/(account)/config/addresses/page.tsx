import { PageToast } from "@/components/common/page-toast";
import { AddressBookManager } from "@/components/common/address-book-manager";
import { listUserAddresses } from "@/features/account/server/address-service";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function CustomerAddressConfigPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const query = (await searchParams) ?? {};
  const addresses = await listUserAddresses(user.id);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {query.addressesSaved ? (
        <PageToast message="Đã cập nhật cấu hình địa chỉ." variant="success" cleanupKeys={["addressesSaved"]} />
      ) : null}
      {query.addressError ? <PageToast message="Không thể lưu địa chỉ. Vui lòng kiểm tra các trường bắt buộc." variant="error" /> : null}

      <AddressBookManager
        addresses={addresses}
        actionUrl={ROUTES.API.ACCOUNT.ADDRESSES}
        returnTo={ROUTES.CUSTOMER.CONFIG_ADDRESSES}
        createHref={ROUTES.CUSTOMER.CONFIG_ADDRESS_NEW}
        getViewHref={ROUTES.CUSTOMER.CONFIG_ADDRESS}
        getEditHref={ROUTES.CUSTOMER.CONFIG_ADDRESS_EDIT}
        title="Cấu hình địa chỉ"
        description="Danh sách địa chỉ đã lưu. Thêm, xem và sửa địa chỉ ở trang riêng để dùng chung cho checkout và các luồng cần giao nhận."
      />
    </section>
  );
}
