import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSitemapTable } from "@/features/admin/components/settings/admin-sitemap-table";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { buildRobotsContent } from "@/lib/robots";
import { getCurrentSiteUrl } from "@/lib/seo";
import { ROUTES } from "@/lib/routes";
import {
  getSitemapItemsByKey,
  getSitemapProviderSummaries,
} from "@/lib/sitemap";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

function getSitemapSettingsRows(settings: Awaited<ReturnType<typeof getSystemSettings>>) {
  return [
    {
      id: "enabled",
      label: "Enable Sitemap",
      description: "Bật hoặc tắt toàn bộ sitemap.xml.",
      type: "boolean" as const,
      value: settings.sitemap.enabled,
    },
    {
      id: "autoDiscovery",
      label: "Auto Discovery",
      description: "Tự quét static public pages từ source app để nhập chung vào sitemap-pages.xml.",
      type: "boolean" as const,
      value: settings.sitemap.autoDiscovery,
    },
    {
      id: "includeDiscoveredRoutes",
      label: "Static Public Pages",
      description: "Đưa các public static pages từ source app vào cùng sitemap-pages.xml.",
      type: "boolean" as const,
      value: settings.sitemap.includeDiscoveredRoutes,
    },
    {
      id: "includeManagedPages",
      label: "Pages",
      description: "Bao gồm managed pages đã sync từ code vào admin.",
      type: "boolean" as const,
      value: settings.sitemap.includeManagedPages,
    },
    {
      id: "includeBlogCategories",
      label: "Blog Categories",
      description: "Bao gồm category pages của blog.",
      type: "boolean" as const,
      value: settings.sitemap.includeBlogCategories,
    },
    {
      id: "includeBlogPosts",
      label: "Blog Posts",
      description: "Bao gồm các blog posts đã publish.",
      type: "boolean" as const,
      value: settings.sitemap.includeBlogPosts,
    },
    {
      id: "includeProducts",
      label: "Products",
      description: "Bao gồm template và builder products.",
      type: "boolean" as const,
      value: settings.sitemap.includeProducts,
    },
    {
      id: "includePublicSites",
      label: "Public Sites",
      description: "Bao gồm các public sites đã publish.",
      type: "boolean" as const,
      value: settings.sitemap.includePublicSites,
    },
  ];
}

export default async function AdminSitemapSettingsPage() {
  await requireAdmin();

  const siteUrl = await getCurrentSiteUrl();
  const [settings, providers] = await Promise.all([getSystemSettings(), getSitemapProviderSummaries()]);

  const providerRows = await Promise.all(
    providers.map(async (provider) => {
      const items = provider.enabled ? await getSitemapItemsByKey(provider.key, siteUrl) : [];

      return {
        ...provider,
        count: items.length,
        items: items.map((item) => ({
          loc: item.loc,
          lastmod: item.lastmod,
        })),
      };
    })
  );

  const totalUrls = providerRows.reduce((sum, provider) => sum + provider.count, 0);
  const robotsContent = buildRobotsContent(siteUrl, settings);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sitemap</h1>
            <p className="text-muted-foreground">Quản lý cấu hình và xem realtime sitemap.xml theo domain, settings và dữ liệu đang publish.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={ROUTES.SITEMAP_XML} target="_blank" className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            Mở sitemap.xml
          </Link>
          <Link href={ROUTES.ROBOTS_TXT} target="_blank" className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            Mở robots.txt
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Domain Runtime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-foreground">{siteUrl}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Sitemap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tracking-tight">{settings.sitemap.enabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Enabled Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tracking-tight">{providerRows.filter((provider) => provider.enabled).length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Indexed URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tracking-tight">{totalUrls}</p>
          </CardContent>
        </Card>
      </div>

      <Card id="sitemap-settings" className="rounded-lg">
        <CardHeader>
          <CardTitle>Cấu hình sitemap</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="sitemap"
            title="Sitemap"
            saveMessage="Đã lưu cài đặt sitemap."
            rows={getSitemapSettingsRows(settings)}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Sitemap Index</CardTitle>
            <p className="mt-1 text-muted-foreground">Nguồn thực tế cho /sitemap.xml trên domain hiện tại.</p>
          </div>
          <Link href="#sitemap-settings" className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            Sửa cài đặt
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-3">
            <span className="text-foreground">URL:</span> {siteUrl}/sitemap.xml
          </div>

          <AdminSitemapTable
            rows={providerRows.map((provider) => ({
              key: provider.key,
              label: provider.label,
              routePath: provider.routePath,
              sitemapUrl: `${siteUrl}${provider.routePath}`,
              enabled: provider.enabled,
              count: provider.count,
              items: provider.items,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Robots.txt</CardTitle>
          <p className="text-muted-foreground">Preview runtime và chỉnh thêm rules thủ công cho robots.txt.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/30 p-3">
            <span className="text-foreground">URL:</span> {siteUrl}/robots.txt
          </div>

          <pre className="overflow-x-auto rounded-lg bg-muted/30 p-4 text-xs leading-5">
            {robotsContent}
          </pre>

          <SettingsDataTableForm
            section="indexing"
            title="Robots"
            saveMessage="Đã lưu cài đặt robots.txt."
            rows={[
              {
                id: "siteIndexingEnabled",
                label: "Site Indexing",
                description: "Cho phép index website ở mức toàn site.",
                type: "boolean",
                value: settings.indexing.siteIndexingEnabled,
              },
              {
                id: "includeSitemapInRobots",
                label: "Sitemap In Robots",
                description: "Hiển thị dòng sitemap trong robots.txt.",
                type: "boolean",
                value: settings.indexing.includeSitemapInRobots,
              },
              {
                id: "disallowAdmin",
                label: "Disallow /admin",
                description: "Chặn crawler truy cập khu admin.",
                type: "boolean",
                value: settings.indexing.disallowAdmin,
              },
              {
                id: "disallowUser",
                label: "Disallow /customer",
                description: "Chặn crawler truy cập khu customer.",
                type: "boolean",
                value: settings.indexing.disallowUser,
              },
              {
                id: "disallowApi",
                label: "Disallow /api",
                description: "Chặn crawler truy cập các route API public.",
                type: "boolean",
                value: settings.indexing.disallowApi,
              },
              {
                id: "customRobotsRules",
                label: "Custom Robots Rules",
                description: "Nhập thêm các rule robots.txt thủ công.",
                type: "textarea",
                value: settings.indexing.customRobotsRules,
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
