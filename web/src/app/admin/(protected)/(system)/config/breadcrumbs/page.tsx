import { CheckCircle2, Code2, Eye, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { getSystemSettings } from "@/lib/system-settings";

const BREADCRUMB_SEPARATOR_OPTIONS = [
  { label: "Slash (/)", value: "/" },
  { label: "Chevron (>)", value: ">" },
  { label: "Dot (·)", value: "·" },
  { label: "Pipe (|)", value: "|" },
  { label: "Arrow (→)", value: "→" },
];

export default async function AdminBreadcrumbSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Managed Pages" value={settings.breadcrumb.enabled ? "On" : "Off"} icon={CheckCircle2} />
        <AdminOverviewCard title="Admin Layout" value={settings.breadcrumb.adminEnabled ? "On" : "Off"} icon={Eye} />
        <AdminOverviewCard title="Customer Layout" value={settings.breadcrumb.customerEnabled ? "On" : "Off"} icon={Code2} />
        <AdminOverviewCard title="Partner Layout" value={settings.breadcrumb.partnerEnabled ? "On" : "Off"} icon={Home} />
      </AdminOverviewGrid>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-7">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Managed Pages</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="breadcrumb"
                title="Managed Pages"
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
                    description: "Separator mặc định cho managed pages.",
                    type: "select",
                    value: settings.breadcrumb.separator,
                    options: BREADCRUMB_SEPARATOR_OPTIONS,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Admin Layout</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="breadcrumb"
                title="Admin Layout"
                saveMessage="Đã lưu cài đặt admin breadcrumb."
                rows={[
                  {
                    id: "adminEnabled",
                    label: "Admin Breadcrumbs",
                    description: "Bật breadcrumb trong admin layout.",
                    type: "boolean",
                    value: settings.breadcrumb.adminEnabled,
                  },
                  {
                    id: "adminSeparator",
                    label: "Admin Separator",
                    description: "Separator riêng cho admin layout.",
                    type: "select",
                    value: settings.breadcrumb.adminSeparator,
                    options: BREADCRUMB_SEPARATOR_OPTIONS,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Customer Layout</CardTitle>
              <Code2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="breadcrumb"
                title="Customer Layout"
                saveMessage="Đã lưu cài đặt customer breadcrumb."
                rows={[
                  {
                    id: "customerEnabled",
                    label: "Customer Breadcrumbs",
                    description: "Bật breadcrumb trong customer layout.",
                    type: "boolean",
                    value: settings.breadcrumb.customerEnabled,
                  },
                  {
                    id: "customerSeparator",
                    label: "Customer Separator",
                    description: "Separator riêng cho customer layout.",
                    type: "select",
                    value: settings.breadcrumb.customerSeparator,
                    options: BREADCRUMB_SEPARATOR_OPTIONS,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium">Partner Layout</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <SettingsDataTableForm
                section="breadcrumb"
                title="Partner Layout"
                saveMessage="Đã lưu cài đặt partner breadcrumb."
                rows={[
                  {
                    id: "partnerEnabled",
                    label: "Partner Breadcrumbs",
                    description: "Bật breadcrumb trong partner layout.",
                    type: "boolean",
                    value: settings.breadcrumb.partnerEnabled,
                  },
                  {
                    id: "partnerSeparator",
                    label: "Partner Separator",
                    description: "Separator riêng cho partner layout.",
                    type: "select",
                    value: settings.breadcrumb.partnerSeparator,
                    options: BREADCRUMB_SEPARATOR_OPTIONS,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-12 rounded-lg xl:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-sm font-medium">Breadcrumb Preview</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="mb-2 text-sm font-medium">Managed Pages</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{settings.breadcrumb.homeLabel}</span>
                  <span>{settings.breadcrumb.separator}</span>
                  <span>Configuration</span>
                  <span>{settings.breadcrumb.separator}</span>
                  <span>Breadcrumbs</span>
                </div>
              </div>

              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="mb-2 text-sm font-medium">Admin Layout</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span>Admin</span>
                  <span>{settings.breadcrumb.adminSeparator}</span>
                  <span>Config</span>
                  <span>{settings.breadcrumb.adminSeparator}</span>
                  <span>Breadcrumbs</span>
                </div>
              </div>

              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="mb-2 text-sm font-medium">Customer Layout</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span>Customer</span>
                  <span>{settings.breadcrumb.customerSeparator}</span>
                  <span>Configs</span>
                  <span>{settings.breadcrumb.customerSeparator}</span>
                  <span>Profile</span>
                </div>
              </div>

              <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                <p className="mb-2 text-sm font-medium">Partner Layout</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span>Partner</span>
                  <span>{settings.breadcrumb.partnerSeparator}</span>
                  <span>Configs</span>
                  <span>{settings.breadcrumb.partnerSeparator}</span>
                  <span>Offerings</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
