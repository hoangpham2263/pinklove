import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdmin } from "@/lib/auth";
import { ALLOWED_BLOG_POST_PATTERNS, getBlogCategoryPath, getBlogPostPath, getBuilderProductPath, getInvitationPath, getTemplateProductPath, sanitizePermalinkConfig } from "@/lib/public-paths";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings } from "@/lib/system-settings";

export default async function AdminPermalinkSettingsPage() {
  await requireAdmin();
  const settings = await getSystemSettings();
  const permalinkConfig = sanitizePermalinkConfig(settings.permalink);

  const previewSamples = [
    { label: "Blog Post", value: getBlogPostPath({ slug: "bai-mau", createdAt: "2026-04-09T00:00:00.000Z" }, permalinkConfig) },
    { label: "Blog Category", value: getBlogCategoryPath("tin-tuc", permalinkConfig) },
    { label: "Template", value: getTemplateProductPath("sample-template", permalinkConfig) },
    { label: "Builder", value: getBuilderProductPath("sample-builder", permalinkConfig) },
    { label: "Invitation", value: getInvitationPath("thiep-cuoi-mau", permalinkConfig) },
  ];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN.CONFIG} className="inline-flex h-8 items-center justify-center rounded-lg border px-3 hover:bg-accent">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Permalinks</h1>
            <p className="text-muted-foreground">Cài đặt URL dùng chung cho managed pages.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Legacy Redirects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.permalink.legacyRedirects ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Leading Slash</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.permalink.enforceLeadingSlash ? "On" : "Off"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Trailing Slash</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{settings.permalink.stripTrailingSlash ? "Off" : "On"}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Blog Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-foreground">{permalinkConfig.blogPostPattern}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Preview URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {previewSamples.map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 break-all font-mono">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Permalink Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="permalink"
            title="Permalinks"
            saveMessage="Đã lưu cài đặt permalink."
            rows={[
              {
                id: "legacyRedirects",
                label: "Legacy Redirects",
                description: "Redirect URL cũ sang permalink mới để giữ SEO và bookmark.",
                type: "boolean",
                value: settings.permalink.legacyRedirects,
              },
              {
                id: "enforceLeadingSlash",
                label: "Leading Slash",
                description: "Luôn chuẩn hóa permalink bắt đầu bằng dấu `/`.",
                type: "boolean",
                value: settings.permalink.enforceLeadingSlash,
              },
              {
                id: "stripTrailingSlash",
                label: "Strip Trailing Slash",
                description: "Bỏ dấu `/` cuối URL để giữ format đồng nhất.",
                type: "boolean",
                value: settings.permalink.stripTrailingSlash,
              },
              {
                id: "blogPostPattern",
                label: "Blog Post Pattern",
                description: `Chỉ hỗ trợ các pattern an toàn: ${ALLOWED_BLOG_POST_PATTERNS.join(", ")}`,
                type: "text",
                value: settings.permalink.blogPostPattern,
              },
              {
                id: "blogCategoryBase",
                label: "Blog Category Base",
                description: "Base cho category blog, ví dụ `blog` hoặc `danh-muc`.",
                type: "text",
                value: settings.permalink.blogCategoryBase,
              },
              {
                id: "templateBase",
                label: "Template Base",
                description: "Base public cho coded template products.",
                type: "text",
                value: settings.permalink.templateBase,
              },
              {
                id: "builderBase",
                label: "Builder Base",
                description: "Base public cho builder starter products.",
                type: "text",
                value: settings.permalink.builderBase,
              },
              {
                id: "invitationBase",
                label: "Invitation Base",
                description: "Base public cho invitation sites đã publish.",
                type: "text",
                value: settings.permalink.invitationBase,
              },
            ]}
          />
        </CardContent>
      </Card>
    </section>
  );
}
