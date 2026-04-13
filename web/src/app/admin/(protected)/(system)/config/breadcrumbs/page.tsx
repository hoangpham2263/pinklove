import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminBreadcrumbSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Breadcrumbs</h1>
            <p className="text-muted-foreground">Cài đặt breadcrumb UI và structured data dùng chung.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Breadcrumbs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.breadcrumb.enabled ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Show On Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.breadcrumb.showOnPage ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">JSON-LD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.breadcrumb.includeStructuredData ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Home Label</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.breadcrumb.homeLabel}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Breadcrumb Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="breadcrumb"
            title="Breadcrumbs"
            saveMessage="Đã lưu cài đặt breadcrumb."
            rows={[
              {
                id: "enabled",
                label: "Enable Breadcrumbs",
                description: "Bật breadcrumb cho managed pages.",
                type: "boolean",
                value: settings.breadcrumb.enabled,
              },
              {
                id: "showOnPage",
                label: "Show On Page",
                description: "Hiển thị breadcrumb UI trên trang.",
                type: "boolean",
                value: settings.breadcrumb.showOnPage,
              },
              {
                id: "includeStructuredData",
                label: "Structured Data",
                description: "Render breadcrumb JSON-LD cho search engines.",
                type: "boolean",
                value: settings.breadcrumb.includeStructuredData,
              },
              {
                id: "homeLabel",
                label: "Home Label",
                description: "Tên hiển thị cho mục trang chủ.",
                type: "text",
                value: settings.breadcrumb.homeLabel,
              },
              {
                id: "separator",
                label: "Separator",
                description: "Ký tự ngăn cách giữa các breadcrumb item.",
                type: "text",
                value: settings.breadcrumb.separator,
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
