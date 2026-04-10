import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const CONFIG_SECTIONS = [
  {
    title: "Cấu hình chung",
    icon: "settings" as const,
    items: [
      {
        title: "Kết nối thương mại",
        description: "Kết nối sàn thương mại điện tử, catalog và các kênh bán hàng để mở rộng sau.",
        href: ROUTES.ADMIN.CONFIG_COMMERCE,
      },
    ],
  },
  {
    title: "SEO & Đường dẫn",
    icon: "link" as const,
    items: [
      {
        title: "Permalinks",
        description: "Quản lý chuẩn URL hệ thống cho managed pages và redirect từ URL cũ sang URL mới.",
        href: ROUTES.ADMIN.CONFIG_PERMALINKS,
      },
      {
        title: "Breadcrumbs",
        description: "Thiết lập breadcrumb UI và breadcrumb schema giống cách làm SEO plugin.",
        href: ROUTES.ADMIN.CONFIG_BREADCRUMBS,
      },
    ],
  },
  {
    title: "Indexing & Sitemap",
    icon: "globe" as const,
    items: [
      {
        title: "Sitemap & Robots",
        description: "Quản lý sitemap.xml, robots.txt và các nhóm nội dung public được index.",
        href: ROUTES.ADMIN.CONFIG_SITEMAP,
      },
    ],
  },
  {
    title: "Tài liệu SEO",
    icon: "docs" as const,
    items: [
      {
        title: "Page SEO",
        description: "Hướng dẫn nhập title, description, canonical, OG image và metadata cho từng page.",
        href: ROUTES.ADMIN.SEO_PAGES,
      },
      {
        title: "SEO Schema",
        description: "Tài liệu về structured data, breadcrumb schema và cách map dữ liệu theo page type.",
        href: ROUTES.ADMIN.SEO_SCHEMA,
      },
      {
        title: "SEO Rules",
        description: "Quy tắc vận hành nội dung SEO để hạn chế trùng intent và giữ index ổn định.",
        href: ROUTES.ADMIN.SEO_RULES,
      },
    ],
  },
] as const;

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const enabledCount = [
    settings.breadcrumb.enabled,
    settings.sitemap.enabled,
    settings.permalink.legacyRedirects,
  ].filter(Boolean).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cấu hình</h1>
          <p className="text-sm text-muted-foreground">Trung tâm cấu hình, indexing và tài liệu SEO dùng chung cho toàn hệ thống.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tổng mục</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{CONFIG_SECTIONS.reduce((sum, section) => sum + section.items.length, 0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Đang bật</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{enabledCount}</p>
            <p className="text-sm text-muted-foreground">Theo cấu hình hiện tại</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sitemap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{settings.sitemap.enabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Site Indexing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{settings.indexing.siteIndexingEnabled ? "On" : "Off"}</p>
            <p className="text-sm text-muted-foreground">Quản lý trong Sitemap</p>
          </CardContent>
        </Card>
      </div>

      <ConfigSectionsHub sections={[...CONFIG_SECTIONS]} />
    </section>
  );
}
