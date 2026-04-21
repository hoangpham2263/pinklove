import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

function canPreviewImage(value: string) {
  return /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i.test(value) || value.startsWith("data:image/");
}

export default async function AdminBrandingSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const hasBrandLogo = Boolean(settings.branding.brandLogo) && canPreviewImage(settings.branding.brandLogo);
  const hasFaviconPreview = Boolean(settings.favicon.siteFavicon) && canPreviewImage(settings.favicon.siteFavicon);
  const hasAppleTouchIconPreview =
    Boolean(settings.favicon.appleTouchIcon) && canPreviewImage(settings.favicon.appleTouchIcon);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
            <p className="text-muted-foreground">Quản lý tên site, logo và các icon nhận diện hiển thị trên toàn hệ thống.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Site Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.branding.siteName}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Brand Logo</CardTitle>
          </CardHeader>
          <CardContent>
            {hasBrandLogo ? (
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted p-3">
                <img
                  src={settings.branding.brandLogo}
                  alt={settings.branding.siteName}
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : <p className="text-muted-foreground">Chưa cấu hình</p>}
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Browser Favicon</CardTitle>
          </CardHeader>
          <CardContent>
            {hasFaviconPreview ? (
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted p-3">
                <img
                  src={settings.favicon.siteFavicon}
                  alt="Favicon preview"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : <p className="text-muted-foreground">Chưa cấu hình</p>}
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Apple Touch Icon</CardTitle>
          </CardHeader>
          <CardContent>
            {hasAppleTouchIconPreview ? (
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted p-3">
                <img
                  src={settings.favicon.appleTouchIcon}
                  alt="Apple touch icon preview"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : <p className="text-muted-foreground">Chưa cấu hình</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Brand Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="branding"
            title="Branding"
            saveMessage="Đã lưu cài đặt branding."
            columnWidths={{
              label: "w-[20%]",
              description: "w-[40%]",
              value: "w-[40%]",
            }}
            rows={[
              {
                id: "siteName",
                label: "Site Name",
                description: "Tên thương hiệu hiển thị trong UI, title template và các shell của website.",
                type: "text",
                value: settings.branding.siteName,
              },
              {
                id: "brandLogo",
                label: "Brand Logo",
                description: "Logo hiển thị trong header hoặc sidebar. Đây không phải favicon và cũng không phải ảnh social share mặc định.",
                type: "media",
                value: settings.branding.brandLogo,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Favicon & App Icons</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="favicon"
            title="Favicon"
            saveMessage="Đã lưu cài đặt favicon."
            columnWidths={{
              label: "w-[20%]",
              description: "w-[40%]",
              value: "w-[40%]",
            }}
            rows={[
              {
                id: "siteFavicon",
                label: "Browser Favicon",
                description: "Icon mặc định cho tab trình duyệt và shortcut. Nên dùng `.ico`, `.png` hoặc `.svg` vuông.",
                type: "media",
                value: settings.favicon.siteFavicon,
              },
              {
                id: "appleTouchIcon",
                label: "Apple Touch Icon",
                description: "Icon riêng cho iPhone/iPad khi lưu ra màn hình chính. Nên dùng ảnh vuông kích thước lớn như 180x180.",
                type: "media",
                value: settings.favicon.appleTouchIcon,
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
