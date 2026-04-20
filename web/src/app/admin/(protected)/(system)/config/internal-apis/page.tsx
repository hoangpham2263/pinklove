import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const INTERNAL_API_SECTIONS = [
  {
    title: "Import & Đồng bộ",
    icon: "settings" as const,
    items: [
      {
        title: "API import sản phẩm",
        description: "Quản lý endpoint, token và phạm vi import sản phẩm từ hệ thống nội bộ hoặc bên thứ ba.",
        href: ROUTES.ADMIN.CONFIG_INTERNAL_API_PRODUCTS,
      },
    ],
  },
] as const;

export default async function AdminInternalApisPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API nội bộ</h1>
          <p className="text-muted-foreground">Khu quản lý tập trung cho các API nội bộ dùng để import và đồng bộ dữ liệu.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Tổng API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">1</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">API đang bật</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.internalApis.productsImport.enabled ? 1 : 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">API đầu tiên</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Hiện tại đang cấu hình trước cho import sản phẩm.</p>
          </CardContent>
        </Card>
      </div>

      <ConfigSectionsHub sections={[...INTERNAL_API_SECTIONS]} />
    </section>
  );
}
