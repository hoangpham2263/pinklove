import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderConfigSectionsHub } from "@/features/provider-orders/components/provider-config-sections-hub";
import { requireProvider } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

const CONFIG_SECTIONS = [
  {
    title: "Provider",
    icon: "settings" as const,
    items: [
      {
        title: "Tài khoản provider",
        description: "Thông tin cửa hàng, email vận hành và dữ liệu định danh của provider.",
        href: ROUTES.PROVIDER.CONFIG_ACCOUNT,
      },
    ],
  },
  {
    title: "Địa chỉ provider",
    icon: "globe" as const,
    items: [
      {
        title: "Địa chỉ",
        description: "Quản lý địa chỉ dùng chung cho giao nhận, lấy hàng và hoàn hàng.",
        href: ROUTES.PROVIDER.CONFIG_ADDRESSES,
      },
    ],
  },
] as const;

export default async function ProviderConfigPage() {
  await requireProvider(ROUTES.PROVIDER.LOGIN);
  const totalItems = CONFIG_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">Trung tâm cấu hình tài khoản, vận hành và địa chỉ của provider.</p>
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
            <CardTitle className="text-base font-medium">Provider Account</CardTitle>
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
            <p className="text-2xl font-semibold">Provider</p>
            <p className="text-muted-foreground">Không gian đối tác</p>
          </CardContent>
        </Card>
      </div>

      <ProviderConfigSectionsHub sections={[...CONFIG_SECTIONS]} />
    </section>
  );
}
