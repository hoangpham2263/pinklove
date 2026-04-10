import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getCurrentSiteUrl } from "@/lib/seo";
import { getSystemSettings } from "@/lib/system-settings";

const OG_LOCALE_OPTIONS = [
  { label: "Tiếng Việt (vi_VN)", value: "vi_VN" },
  { label: "English (US) (en_US)", value: "en_US" },
  { label: "English (UK) (en_GB)", value: "en_GB" },
  { label: "Tiếng Việt (vi)", value: "vi" },
  { label: "English (en)", value: "en" },
] as const;

const TWITTER_CARD_OPTIONS = [
  { label: "Summary", value: "summary" },
  { label: "Summary Large Image", value: "summary_large_image" },
] as const;

function isImageUrl(value: string) {
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value) || value.startsWith("data:image/");
}

export default async function AdminOpenGraphSettingsPage() {
  await requireAdmin();
  const [settings, siteUrl] = await Promise.all([getSystemSettings(), getCurrentSiteUrl()]);
  const previewTitle = settings.opengraph.defaultTitle || settings.opengraph.siteName;
  const previewDescription = settings.opengraph.defaultDescription;
  const previewImage = settings.opengraph.defaultImage || "Chưa cấu hình";
  const hasPreviewImage = Boolean(settings.opengraph.defaultImage) && isImageUrl(settings.opengraph.defaultImage);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Open Graph</h1>
            <p className="text-muted-foreground">Cấu hình metadata mặc định khi chia sẻ link qua Facebook, Zalo, Messenger và nền tảng social khác.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Site Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tracking-tight">{settings.opengraph.siteName}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Locale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tracking-tight">{settings.opengraph.locale}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Twitter Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{settings.opengraph.twitterCard}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle>Default Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all text-foreground">{previewImage}</p>
            {hasPreviewImage ? (
              <div className="overflow-hidden rounded-lg border bg-muted">
                <img
                  src={settings.opengraph.defaultImage}
                  alt={previewTitle}
                  className="aspect-[1200/630] w-full object-cover"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Preview fallback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview URL</p>
            <p className="mt-2 break-all text-foreground">{siteUrl}</p>
            <p className="mt-4 text-lg tracking-tight text-foreground">{previewTitle}</p>
            <p className="mt-2 text-muted-foreground">{previewDescription}</p>
            {hasPreviewImage ? (
              <div className="mt-4 overflow-hidden rounded-lg border bg-muted">
                <img
                  src={settings.opengraph.defaultImage}
                  alt={previewTitle}
                  className="aspect-[1200/630] w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Cấu hình Open Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="opengraph"
            title="Open Graph"
            saveMessage="Đã lưu cài đặt Open Graph."
            columnWidths={{
              label: "w-[20%]",
              description: "w-[40%]",
              value: "w-[40%]",
            }}
            rows={[
              {
                id: "siteName",
                label: "Site Name",
                description: "Tên website hiển thị trong Open Graph và metadata gốc.",
                type: "text",
                value: settings.opengraph.siteName,
              },
              {
                id: "locale",
                label: "Locale",
                description: "Locale cho nền tảng social biết ngôn ngữ/nội dung chính của site khi render preview.",
                type: "select",
                value: settings.opengraph.locale,
                options: [...OG_LOCALE_OPTIONS],
              },
              {
                id: "defaultTitle",
                label: "Default Title",
                description: "Tiêu đề fallback khi page chưa có OG title riêng.",
                type: "text",
                value: settings.opengraph.defaultTitle,
              },
              {
                id: "defaultDescription",
                label: "Default Description",
                description: "Mô tả fallback khi page chưa có OG description riêng.",
                type: "textarea",
                value: settings.opengraph.defaultDescription,
              },
              {
                id: "defaultImage",
                label: "Default Image",
                description: "Đường dẫn ảnh mặc định cho social share. Có thể nhập URL tuyệt đối hoặc path nội bộ như `/uploads/og-default.jpg`.",
                type: "text",
                value: settings.opengraph.defaultImage,
              },
              {
                id: "twitterCard",
                label: "Twitter Card",
                description: "Kiểu preview card cho Twitter/X khi có ảnh chia sẻ.",
                type: "select",
                value: settings.opengraph.twitterCard,
                options: [...TWITTER_CARD_OPTIONS],
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
