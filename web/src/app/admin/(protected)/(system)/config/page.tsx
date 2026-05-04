import { CheckCircle2, FileCode2, ListChecks, SearchCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigSectionsHub } from "@/features/admin/components/settings/config-sections-hub";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

const CONFIG_SECTIONS = [
  {
    title: "Brand & UI",
    icon: "settings" as const,
    items: [
      {
        title: "Branding",
        description: "Quản lý tên site, logo và các icon nhận diện hiển thị trên toàn website.",
        href: ROUTES.ADMIN.CONFIG_BRANDING,
      },
      {
        title: "Thông báo",
        description: "Quản lý thông báo toàn site hiển thị dùng chung cho người dùng.",
        href: ROUTES.ADMIN.NOTIFICATIONS,
      },
      {
        title: "Email",
        description: "Cấu hình sender, SMTP transport và card gửi demo cho email dùng chung toàn hệ thống.",
        href: ROUTES.ADMIN.CONFIG_EMAIL,
      },
    ],
  },
  {
    title: "SEO",
    icon: "link" as const,
    items: [
      {
        title: "Breadcrumbs",
        description: "Thiết lập breadcrumb UI và breadcrumb schema cho toàn website.",
        href: ROUTES.ADMIN.CONFIG_BREADCRUMBS,
      },
      {
        title: "Open Graph",
        description: "Quản lý metadata social preview và ảnh mặc định khi share link.",
        href: ROUTES.ADMIN.CONFIG_OPENGRAPH,
      },
      {
        title: "Sitemap & Robots",
        description: "Quản lý sitemap.xml, robots.txt và các nhóm nội dung public được index.",
        href: ROUTES.ADMIN.CONFIG_SITEMAP,
      },
    ],
  },
  {
    title: "SEO Docs",
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
  {
    title: "Ecommerce",
    icon: "settings" as const,
    items: [
      {
        title: "Ecommerce",
        description: "Cấu hình checkout, tiền tệ và vận chuyển dùng chung cho đơn hàng.",
        href: ROUTES.ADMIN.CONFIG_ECOMMERCE,
      },
      {
        title: "Payment Methods",
        description: "Quản lý phương thức thanh toán, provider, hướng dẫn và thông tin nhận thanh toán.",
        href: ROUTES.ADMIN.CONFIG_PAYMENT_METHODS,
      },
    ],
  },
  {
    title: "Nâng cao",
    icon: "globe" as const,
    items: [
      {
        title: "API nội bộ",
        description: "Trung tâm quản lý các API nội bộ dùng để import, đồng bộ và mở rộng kết nối dữ liệu hệ thống.",
        href: ROUTES.ADMIN.CONFIG_INTERNAL_APIS,
      },
      {
        title: "Đăng nhập bên thứ 3",
        description: "Cấu hình OAuth và các nhà cung cấp đăng nhập ngoài như Google.",
        href: ROUTES.ADMIN.CONFIG_THIRD_PARTY,
      },
      {
        title: "Hooks",
        description: "Thống kê toàn bộ hook point hiện có của website để nối đồng bộ với hệ thống ngoài.",
        href: ROUTES.ADMIN.HOOKS,
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
    settings.email.enabled,
    settings.branding.siteName.trim().length > 0,
    settings.favicon.siteFavicon.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Tổng mục cấu hình</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{CONFIG_SECTIONS.reduce((sum, section) => sum + section.items.length, 0)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Cấu hình đang bật</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{enabledCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Sitemap XML</CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{settings.sitemap.enabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Cho phép index</CardTitle>
            <SearchCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{settings.indexing.siteIndexingEnabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
      </div>

      <ConfigSectionsHub sections={[...CONFIG_SECTIONS]} />
    </section>
  );
}
