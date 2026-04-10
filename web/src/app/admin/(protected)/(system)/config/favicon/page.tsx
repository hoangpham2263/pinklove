import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

function canPreviewIcon(value: string) {
  return /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i.test(value) || value.startsWith("data:image/");
}

export default async function AdminFaviconSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const favicon = settings.favicon.siteFavicon || "Chưa cấu hình";
  const appleTouchIcon = settings.favicon.appleTouchIcon || "Chưa cấu hình";
  const hasFaviconPreview = Boolean(settings.favicon.siteFavicon) && canPreviewIcon(settings.favicon.siteFavicon);
  const hasAppleTouchIconPreview =
    Boolean(settings.favicon.appleTouchIcon) && canPreviewIcon(settings.favicon.appleTouchIcon);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Favicon</h1>
            <p className="text-muted-foreground">Cấu hình icon hiển thị ở tab trình duyệt, shortcut và Apple touch icon cho toàn site.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Browser Favicon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all text-foreground">{favicon}</p>
            {hasFaviconPreview ? (
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted p-3">
                <Image
                  src={settings.favicon.siteFavicon}
                  alt="Favicon preview"
                  width={64}
                  height={64}
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Apple Touch Icon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all text-foreground">{appleTouchIcon}</p>
            {hasAppleTouchIconPreview ? (
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted p-3">
                <Image
                  src={settings.favicon.appleTouchIcon}
                  alt="Apple touch icon preview"
                  width={96}
                  height={96}
                  className="max-h-full w-auto object-contain"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Cấu hình favicon</CardTitle>
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
