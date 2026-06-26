import { FileWarning, ShieldAlert, ShieldCheck, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdminPermission } from "@/lib/auth";
import { getSecurityConfigurationWarnings } from "@/lib/security-settings-health";
import { getSystemSettings } from "@/lib/system-settings";

function countAllowedTypes(value: string) {
  return value
    .split(/[,\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

export default async function AdminUploadSecurityPage() {
  await requireAdminPermission("security.view");
  const settings = await getSystemSettings();
  const uploadSecurity = settings.security.uploadSecurity;
  const productionWarnings = getSecurityConfigurationWarnings(settings.security).filter((warning) => warning.includes("upload"));
  const warnings = [
    !uploadSecurity.enabled ? "Upload security đang tắt, file upload sẽ không được kiểm tra rule tập trung." : null,
    !uploadSecurity.requireMagicBytes ? "Magic bytes đang tắt, server chỉ kiểm tra MIME/extension nên dễ bị giả mạo hơn." : null,
    !uploadSecurity.blockSvg ? "SVG đang được cấu hình là không block, nhưng app chưa có sanitizer SVG an toàn." : null,
    !uploadSecurity.blockHtml ? "HTML upload đang được cấu hình là không block, có rủi ro XSS nếu file được serve trực tiếp." : null,
    uploadSecurity.maxFileSizeMb > uploadSecurity.maxTotalUploadSizeMb
      ? "Max file size đang lớn hơn max total upload size, người dùng có thể bị chặn khó hiểu."
      : null,
  ].filter(Boolean) as string[];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Upload Security" value={uploadSecurity.enabled ? "On" : "Off"} icon={Upload} />
        <AdminOverviewCard title="Allowed Types" value={String(countAllowedTypes(uploadSecurity.allowedMimeTypes))} icon={ShieldCheck} />
        <AdminOverviewCard title="Max File" value={`${uploadSecurity.maxFileSizeMb}MB`} icon={FileWarning} />
        <AdminOverviewCard title="Magic Bytes" value={uploadSecurity.requireMagicBytes ? "On" : "Off"} icon={ShieldCheck} />
        <AdminOverviewCard title="SVG / HTML" value={uploadSecurity.blockSvg && uploadSecurity.blockHtml ? "Blocked" : "Review"} icon={ShieldAlert} />
      </AdminOverviewGrid>

      {productionWarnings.length ? (
        <Card className="rounded-lg border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-950">Production Upload Warning</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            <ul className="list-disc space-y-1 pl-5">
              {productionWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Upload Rule Status</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {warnings.length ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="font-medium">Cần kiểm tra cấu hình upload</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              Rule upload đang bật, có kiểm tra MIME/magic bytes và chặn nhóm file script/HTML/SVG nguy hiểm.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="font-medium">Files per upload</p>
              <p className="mt-1 text-muted-foreground">{uploadSecurity.maxFilesPerUpload} file</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Total upload size</p>
              <p className="mt-1 text-muted-foreground">{uploadSecurity.maxTotalUploadSizeMb}MB</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Serve mode</p>
              <p className="mt-1 text-muted-foreground">Uploads được lưu dưới public/uploads và serve như static file; app không execute code từ thư mục upload.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Upload Security Rules</CardTitle>
          <Upload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="upload_security"
            resetSection="upload_security_reset"
            title="Upload security"
            saveMessage="Đã lưu cấu hình upload security."
            rows={[
              {
                id: "uploadSecurityEnabled",
                label: "Enable Upload Security",
                description: "Bật rule tập trung cho media/avatar/sản phẩm/bài viết/wedding media dùng media library.",
                type: "boolean",
                value: uploadSecurity.enabled,
              },
              {
                id: "allowedMimeTypes",
                label: "Allowed MIME Types",
                description: "Danh sách MIME được phép, phân tách bằng dấu phẩy hoặc xuống dòng.",
                type: "textarea",
                value: uploadSecurity.allowedMimeTypes,
              },
              {
                id: "maxFileSizeMb",
                label: "Max File Size MB",
                description: "Dung lượng tối đa cho từng file.",
                type: "text",
                value: String(uploadSecurity.maxFileSizeMb),
              },
              {
                id: "maxFilesPerUpload",
                label: "Max Files Per Upload",
                description: "Số file tối đa trong một lần upload.",
                type: "text",
                value: String(uploadSecurity.maxFilesPerUpload),
              },
              {
                id: "maxTotalUploadSizeMb",
                label: "Max Total Upload Size MB",
                description: "Tổng dung lượng tối đa của một batch upload.",
                type: "text",
                value: String(uploadSecurity.maxTotalUploadSizeMb),
              },
              {
                id: "blockSvg",
                label: "Block SVG",
                description: "Chặn SVG vì có thể chứa script/XML nguy hiểm nếu chưa sanitize kỹ.",
                type: "boolean",
                value: uploadSecurity.blockSvg,
              },
              {
                id: "blockHtml",
                label: "Block HTML",
                description: "Chặn HTML/XHTML/script upload để giảm rủi ro XSS khi serve static.",
                type: "boolean",
                value: uploadSecurity.blockHtml,
              },
              {
                id: "requireMagicBytes",
                label: "Require Magic Bytes",
                description: "Kiểm tra chữ ký đầu file server-side, không chỉ tin extension/MIME client gửi lên.",
                type: "boolean",
                value: uploadSecurity.requireMagicBytes,
              },
            ]}
            columnWidths={{ label: "w-56", description: "w-[42%]", value: "min-w-72" }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
