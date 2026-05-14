import { CheckCircle2, FileCode2, Globe2, ListChecks } from "lucide-react";
import { AdminInlineLinkButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSitemapTable } from "@/features/admin/components/settings/admin-sitemap-table";
import { requireAdmin } from "@/lib/auth";
import { getCurrentSiteUrl } from "@/lib/seo";
import { ROUTES } from "@/lib/routes";
import { getSitemapItemsByKey, getSitemapProviderSummaries } from "@/lib/sitemap";
import { getSystemSettings } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function AdminSitemapIndexPage() {
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
  const enabledGroups = providerRows.filter((provider) => provider.enabled).length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Domain Runtime</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="break-all">{siteUrl}</p>
          </CardContent>
        </Card>
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Sitemap XML</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{settings.sitemap.enabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Enabled Groups</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{enabledGroups}</p>
          </CardContent>
        </Card>
        <Card className="col-span-12 rounded-lg md:col-span-6 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Indexed URLs</CardTitle>
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p>{totalUrls}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Sitemap Index</CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdminInlineLinkButton href={ROUTES.ADMIN.CONFIG_SITEMAP_SETTINGS}>
                Settings
              </AdminInlineLinkButton>
              <AdminInlineLinkButton href={ROUTES.SITEMAP_XML} target="_blank">
                Mở sitemap.xml
              </AdminInlineLinkButton>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/30 p-3">
              <span>URL:</span> {siteUrl}/sitemap.xml
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
      </div>
    </section>
  );
}
