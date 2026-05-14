import Image from "next/image";
import { FileText, Globe2, ImageIcon, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
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

function getPreviewHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || value;
  }
}

export default async function AdminOpenGraphSettingsPage() {
  await requireAdmin();
  const [settings, siteUrl] = await Promise.all([getSystemSettings(), getCurrentSiteUrl()]);
  const previewTitle = settings.opengraph.defaultTitle;
  const previewDescription = settings.opengraph.defaultDescription;
  const previewImage = settings.opengraph.defaultImage || "Chưa cấu hình";
  const hasPreviewImage = Boolean(settings.opengraph.defaultImage) && isImageUrl(settings.opengraph.defaultImage);
  const previewHost = getPreviewHost(siteUrl);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Default Title" icon={FileText}>
          <p className="line-clamp-2">{previewTitle}</p>
        </AdminOverviewCard>
        <AdminOverviewCard title="Locale" value={settings.opengraph.locale} icon={Globe2} />
        <AdminOverviewCard title="Twitter Card" value={settings.opengraph.twitterCard} icon={Share2} />
        <AdminOverviewCard title="Default Image" icon={ImageIcon} contentClassName="space-y-3">
          <p className="break-all">{previewImage}</p>
          {hasPreviewImage ? (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <Image
                src={settings.opengraph.defaultImage}
                alt={previewTitle}
                width={1200}
                height={630}
                className="aspect-[1200/630] w-full object-cover"
              />
            </div>
          ) : null}
        </AdminOverviewCard>
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-3xl overflow-hidden rounded-lg border bg-background">
            {hasPreviewImage ? (
              <div className="border-b bg-muted">
                <Image
                  src={settings.opengraph.defaultImage}
                  alt={previewTitle}
                  width={1200}
                  height={630}
                  className="aspect-[1200/630] w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[1200/630] w-full items-center justify-center border-b bg-muted text-sm text-muted-foreground">
                Chưa cấu hình ảnh Open Graph
              </div>
            )}
            <div className="space-y-1 bg-muted/40 p-4">
              <p className="line-clamp-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{previewHost}</p>
              <p className="line-clamp-2 text-base font-medium leading-snug text-foreground">{previewTitle}</p>
              <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{previewDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            description: "Tiêu đề mặc định khi page chưa có OG title riêng.",
            type: "text",
            value: settings.opengraph.defaultTitle,
          },
          {
            id: "defaultDescription",
            label: "Default Description",
            description: "Mô tả mặc định khi page chưa có OG description riêng.",
            type: "textarea",
            value: settings.opengraph.defaultDescription,
          },
          {
            id: "defaultImage",
            label: "Default Image",
            description: "Đường dẫn ảnh mặc định cho social share. Có thể nhập URL tuyệt đối hoặc path nội bộ như `/uploads/og-default.jpg`.",
            type: "media",
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
    </section>
  );
}
