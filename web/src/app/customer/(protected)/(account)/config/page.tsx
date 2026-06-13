import { BadgePercent, ListChecks, MapPin, UserCircle2 } from "lucide-react";
import { CustomerConfigSectionsHub } from "@/features/customer/ui/customer-config-sections-hub";
import { CustomerOverviewCard, CustomerOverviewGrid } from "@/features/customer/ui/customer-overview-card";
import { listUserAddresses } from "@/features/account/server/address-service";
import { getUserProfile, requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const CONFIG_SECTIONS = [
  {
    title: "Tài khoản",
    icon: "settings" as const,
    items: [
      {
        title: "Hồ sơ",
        description: "Thông tin cá nhân, tên hiển thị và số điện thoại dùng trong tài khoản.",
        href: ROUTES.CUSTOMER.CONFIG_PROFILE,
      },
      {
        title: "Tiếp thị liên kết",
        description: "Khu đối tác Affiliate để theo dõi trạng thái, link giới thiệu và hoa hồng.",
        href: ROUTES.CUSTOMER.AFFILIATE,
      },
    ],
  },
  {
    title: "Địa chỉ",
    icon: "globe" as const,
    items: [
      {
        title: "Địa chỉ",
        description: "Quản lý địa chỉ dùng chung cho checkout và các luồng giao nhận.",
        href: ROUTES.CUSTOMER.CONFIG_ADDRESSES,
      },
    ],
  },
] as const;

export default async function CustomerConfigPage() {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);
  const [profile, addresses] = await Promise.all([getUserProfile(user.id), listUserAddresses(user.id)]);
  const totalItems = CONFIG_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
  const displayName = profile.displayName || profile.fullName || user.username;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <CustomerOverviewGrid>
        <CustomerOverviewCard title="Tổng mục cấu hình" value={totalItems} icon={ListChecks} />
        <CustomerOverviewCard title="Hồ sơ" value={displayName} description="Thông tin tài khoản cá nhân" icon={UserCircle2} />
        <CustomerOverviewCard title="Địa chỉ" value={addresses.length} description="Địa chỉ dùng cho checkout" icon={MapPin} />
        <CustomerOverviewCard title="Affiliate" value="Đối tác" description="Link giới thiệu và hoa hồng" icon={BadgePercent} />
      </CustomerOverviewGrid>

      <CustomerConfigSectionsHub sections={[...CONFIG_SECTIONS]} scopeLabel="Quản lý tập trung cho tài khoản khách hàng" />
    </section>
  );
}
