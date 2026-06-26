import { Gauge, ServerCog, ShieldAlert, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { requireAdminPermission } from "@/lib/auth";
import { getSecurityConfigurationWarnings } from "@/lib/security-settings-health";
import { getSystemSettings } from "@/lib/system-settings";

function countList(value: string) {
  return value
    .split(/[\n,]+/g)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

export default async function AdminEndpointProtectionPage() {
  await requireAdminPermission("security.view");
  const settings = await getSystemSettings();
  const endpointProtection = settings.security.endpointProtection;
  const productionWarnings = getSecurityConfigurationWarnings(settings.security).filter((warning) => warning.includes("endpoint"));
  const warnings = [
    !endpointProtection.enabled ? "Endpoint protection đang tắt, app chỉ dựa vào các guard riêng từng module." : null,
    endpointProtection.enabled && !endpointProtection.dryRun
      ? "Dry-run đang tắt: request vượt block limit sẽ bị trả 429 thật. Hãy theo dõi Security Logs để tránh false positive."
      : null,
    endpointProtection.warnLimit >= endpointProtection.blockLimit
      ? "Warn limit đang lớn hơn hoặc bằng block limit, admin sẽ ít có tín hiệu trước khi block thật."
      : null,
    endpointProtection.maxPageSize > 200 ? "Max page size đang cao, endpoint list/search có thể tạo tải DB lớn." : null,
    endpointProtection.slowThresholdMs > 5000 ? "Slow threshold cao hơn 5s, log endpoint chậm có thể bỏ sót vấn đề." : null,
  ].filter(Boolean) as string[];

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Endpoint Protection" value={endpointProtection.enabled ? (endpointProtection.dryRun ? "Dry-run" : "On") : "Off"} icon={ShieldAlert} />
        <AdminOverviewCard title="Rate Limit" value={endpointProtection.rateLimitEnabled ? `${endpointProtection.blockLimit}/${endpointProtection.windowMinutes}m` : "Off"} icon={Gauge} />
        <AdminOverviewCard title="Max Page Size" value={String(endpointProtection.maxPageSize)} icon={ServerCog} />
        <AdminOverviewCard title="Search Cache" value={`${endpointProtection.searchCacheTtlSeconds}s`} icon={ShieldCheck} />
        <AdminOverviewCard title="Bypass Rules" value={String(countList(endpointProtection.whitelistIps) + countList(endpointProtection.bypassUserIds))} icon={ShieldCheck} />
      </AdminOverviewGrid>

      {productionWarnings.length ? (
        <Card className="rounded-lg border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-950">Production Endpoint Warning</CardTitle>
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
          <CardTitle className="text-sm font-medium">Endpoint Protection Status</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {warnings.length ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="font-medium">Cần kiểm tra cấu hình endpoint protection</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              Rule đang ở trạng thái quan sát an toàn: warn/log trước, cache search, cap pagination và chỉ block khi tắt dry-run.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="font-medium">Protected endpoints</p>
              <p className="mt-1 text-muted-foreground">public:search, media:list, media:upload. Các endpoint nặng sau có thể dùng cùng helper.</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Slow endpoint log</p>
              <p className="mt-1 text-muted-foreground">Request chậm hơn {endpointProtection.slowThresholdMs}ms sẽ ghi Security Logs với event endpoint_slow.</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">False positive control</p>
              <p className="mt-1 text-muted-foreground">Whitelist IP và bypass user id dùng cho admin nội bộ, tester, uptime monitor hoặc crawler hợp lệ.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Endpoint Protection Rules</CardTitle>
          <ServerCog className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="endpoint_protection"
            resetSection="endpoint_protection_reset"
            title="Endpoint protection"
            saveMessage="Đã lưu cấu hình endpoint protection."
            rows={[
              {
                id: "endpointProtectionEnabled",
                label: "Enable Protection",
                description: "Bật guard chung cho endpoint/page nặng đã tích hợp.",
                type: "boolean",
                value: endpointProtection.enabled,
              },
              {
                id: "endpointProtectionDryRun",
                label: "Dry-run / Warn-only",
                description: "Chỉ log cảnh báo, không block thật. Nên bật mặc định để quan sát false positive.",
                type: "boolean",
                value: endpointProtection.dryRun,
              },
              {
                id: "endpointRateLimitEnabled",
                label: "Rate Limit Enabled",
                description: "Đếm request theo IP + path + endpoint key trong Security Logs.",
                type: "boolean",
                value: endpointProtection.rateLimitEnabled,
              },
              {
                id: "endpointWindowMinutes",
                label: "Window Minutes",
                description: "Cửa sổ gom request tần suất cao.",
                type: "text",
                value: String(endpointProtection.windowMinutes),
              },
              {
                id: "endpointWarnLimit",
                label: "Warn Limit",
                description: "Vượt ngưỡng này sẽ ghi cảnh báo để admin quan sát.",
                type: "text",
                value: String(endpointProtection.warnLimit),
              },
              {
                id: "endpointBlockLimit",
                label: "Block Limit",
                description: "Vượt ngưỡng này mới block thật nếu dry-run đang tắt.",
                type: "text",
                value: String(endpointProtection.blockLimit),
              },
              {
                id: "endpointBlockDurationMinutes",
                label: "Block Duration Minutes",
                description: "Thời lượng khuyến nghị để chặn tạm khi endpoint bị spam.",
                type: "text",
                value: String(endpointProtection.blockDurationMinutes),
              },
              {
                id: "endpointMaxPageSize",
                label: "Max Page Size",
                description: "Giới hạn page size cho endpoint list/search để tránh query quá lớn.",
                type: "text",
                value: String(endpointProtection.maxPageSize),
              },
              {
                id: "endpointMaxSearchResultsPerGroup",
                label: "Max Search Results",
                description: "Số kết quả tối đa mỗi nhóm trên trang search public.",
                type: "text",
                value: String(endpointProtection.maxSearchResultsPerGroup),
              },
              {
                id: "endpointSlowThresholdMs",
                label: "Slow Threshold MS",
                description: "Request lâu hơn ngưỡng này sẽ ghi event endpoint_slow.",
                type: "text",
                value: String(endpointProtection.slowThresholdMs),
              },
              {
                id: "searchCacheTtlSeconds",
                label: "Search Cache TTL",
                description: "TTL cache kết quả search public theo query, tính bằng giây.",
                type: "text",
                value: String(endpointProtection.searchCacheTtlSeconds),
              },
              {
                id: "publicDataCacheTtlSeconds",
                label: "Public Data Cache TTL",
                description: "TTL chuẩn cho public data/cache helper dùng chung, tính bằng giây.",
                type: "text",
                value: String(endpointProtection.publicDataCacheTtlSeconds),
              },
              {
                id: "endpointWhitelistIps",
                label: "Whitelist IPs",
                description: "IP nội bộ, uptime monitor, payment gateway hoặc crawler hợp lệ; phân tách bằng dấu phẩy hoặc xuống dòng.",
                type: "textarea",
                value: endpointProtection.whitelistIps,
              },
              {
                id: "endpointBypassUserIds",
                label: "Bypass User IDs",
                description: "User id được bypass tạm thời khi cần hỗ trợ tester/người quen.",
                type: "textarea",
                value: endpointProtection.bypassUserIds,
              },
            ]}
            columnWidths={{ label: "w-56", description: "w-[42%]", value: "min-w-72" }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
