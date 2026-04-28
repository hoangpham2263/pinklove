import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { requireAppUser } from "@/lib/auth";
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
  await requireAppUser(ROUTES.AUTH.LOGIN);
  const totalItems = CONFIG_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">Trung tâm cấu hình hồ sơ, địa chỉ và tùy chọn tài khoản user.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">Ready</p>
            <p className="text-muted-foreground">Quản lý trong Configs</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Address Book</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">On</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">User</p>
            <p className="text-muted-foreground">Tài khoản cá nhân</p>
          </CardContent>
        </Card>
      </div>

      <ConfigSectionsHub sections={[...CONFIG_SECTIONS]} />
    </section>
  );
}
