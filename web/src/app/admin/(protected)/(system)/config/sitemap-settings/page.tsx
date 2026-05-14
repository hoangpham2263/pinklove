import { CheckCircle2, FileCode2, ListChecks, SearchCheck } from "lucide-react";
import { AdminInlineLinkButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { buildRobotsContent } from "@/lib/robots";
import { ROUTES } from "@/lib/routes";
import { getCurrentSiteUrl } from "@/lib/seo";
import { getSitemapProviderSummaries } from "@/lib/sitemap";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function AdminSitemapSettingsPage() {
  await requireAdmin();

  const siteUrl = await getCurrentSiteUrl();
  const [settings, providers] = await Promise.all([getSystemSettings(), getSitemapProviderSummaries()]);
  const robotsContent = buildRobotsContent(siteUrl, settings);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Sitemap XML" value={settings.sitemap.enabled ? "On" : "Off"} icon={CheckCircle2} />
        <AdminOverviewCard title="Content Groups" value={providers.length} icon={ListChecks} />
        <AdminOverviewCard title="Robots Sitemap" value={settings.indexing.includeSitemapInRobots ? "On" : "Off"} icon={FileCode2} />
        <AdminOverviewCard title="Site Indexing" value={settings.indexing.siteIndexingEnabled ? "On" : "Off"} icon={SearchCheck} />
      </AdminOverviewGrid>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-7">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Sitemap Runtime</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="sitemap"
                title="Sitemap Runtime"
                saveMessage="Đã lưu cài đặt sitemap."
                rows={[
                  {
                    id: "enabled",
                    label: "Enable Sitemap",
                    description: "Bật hoặc tắt toàn bộ sitemap.xml.",
                    type: "boolean",
                    value: settings.sitemap.enabled,
                  },
                  {
                    id: "autoDiscovery",
                    label: "Auto Discovery",
                    description: "Tự quét static public pages từ source app.",
                    type: "boolean",
                    value: settings.sitemap.autoDiscovery,
                  },
                  {
                    id: "includeDiscoveredRoutes",
                    label: "Static Public Pages",
                    description: "Đưa public static pages vào sitemap-pages.xml.",
                    type: "boolean",
                    value: settings.sitemap.includeDiscoveredRoutes,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Sitemap Content</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="sitemap"
                title="Sitemap Content"
                saveMessage="Đã lưu nhóm nội dung sitemap."
                rows={[
                  {
                    id: "includeManagedPages",
                    label: "Pages",
                    description: "Bao gồm managed pages đã sync vào admin.",
                    type: "boolean",
                    value: settings.sitemap.includeManagedPages,
                  },
                  {
                    id: "includeBlogCategories",
                    label: "Blog Categories",
                    description: "Bao gồm category pages của blog.",
                    type: "boolean",
                    value: settings.sitemap.includeBlogCategories,
                  },
                  {
                    id: "includeBlogPosts",
                    label: "Blog Posts",
                    description: "Bao gồm blog posts đã publish.",
                    type: "boolean",
                    value: settings.sitemap.includeBlogPosts,
                  },
                  {
                    id: "includeProducts",
                    label: "Products",
                    description: "Bao gồm template và builder products.",
                    type: "boolean",
                    value: settings.sitemap.includeProducts,
                  },
                  {
                    id: "includePublicSites",
                    label: "Public Sites",
                    description: "Bao gồm các public sites đã publish.",
                    type: "boolean",
                    value: settings.sitemap.includePublicSites,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Robots Settings</CardTitle>
              <SearchCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="indexing"
                title="Robots Settings"
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
        </div>

        <Card className="col-span-12 rounded-lg xl:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Runtime Preview</CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdminInlineLinkButton href={ROUTES.ADMIN.CONFIG_SITEMAP_INDEX}>
                Sitemap
              </AdminInlineLinkButton>
              <AdminInlineLinkButton href={ROUTES.ROBOTS_TXT} target="_blank">
                Mở robots.txt
              </AdminInlineLinkButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-dashed bg-muted/30 p-4">
              <div className="break-all">
                <span>URL:</span> {siteUrl}/robots.txt
              </div>
            </div>

            <pre className="max-h-[560px] overflow-auto rounded-xl border border-dashed bg-muted/30 p-4 text-xs leading-5">
              {robotsContent}
            </pre>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
