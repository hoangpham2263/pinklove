import { BadgePercent, ListChecks, MapPin, UserCircle2 } from "lucide-react";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
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
        title: "Cài đặt",
        description: "Các tùy chọn hệ thống dành cho tài khoản user.",
        href: ROUTES.CUSTOMER.CONFIG_SETTINGS,
      },
      {
        title: "Tiếp thị liên kết",
        description: "Theo dõi trạng thái affiliate, link giới thiệu và khu vực tăng trưởng của tài khoản.",
        href: ROUTES.CUSTOMER.AFFILIATE,
      },
    ],
  },
  {
    title: "Địa chỉ",
    icon: "globe" as const,
    items: [
      {
        title: "Sổ địa chỉ",
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
      <AdminOverviewGrid>
        <AdminOverviewCard title="Tổng mục cấu hình" value={totalItems} icon={ListChecks} />
        <AdminOverviewCard title="Hồ sơ" value={displayName} description="Thông tin tài khoản cá nhân" icon={UserCircle2} />
        <AdminOverviewCard title="Sổ địa chỉ" value={addresses.length} description="Địa chỉ dùng cho checkout" icon={MapPin} />
        <AdminOverviewCard title="Affiliate" value="User" description="Khu vực tăng trưởng tài khoản" icon={BadgePercent} />
      </AdminOverviewGrid>

      <ConfigSectionsHub sections={[...CONFIG_SECTIONS]} scopeLabel="Quản lý tập trung cho cấu hình tài khoản user" />
    </section>
  );
}
