import Image from "next/image";
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
  const brandLogo = settings.branding.brandLogo || "Chưa cấu hình";
  const hasBrandLogo = Boolean(settings.branding.brandLogo) && canPreviewImage(settings.branding.brandLogo);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
            <p className="text-muted-foreground">Quản lý tên site và logo hiển thị trong header, sidebar và các shell của hệ thống.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Site Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tracking-tight">{settings.branding.siteName}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Brand Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all text-foreground">{brandLogo}</p>
            {hasBrandLogo ? (
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted p-3">
                <Image
                  src={settings.branding.brandLogo}
                  alt={settings.branding.siteName}
                  width={120}
                  height={80}
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Cấu hình branding</CardTitle>
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
    </section>
  );
}
