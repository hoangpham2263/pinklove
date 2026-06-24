import { ShieldCheck, TimerReset } from "lucide-react";

import { NativeForm } from "@/components/common/native-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { AuthRateLimitsTable } from "@/features/admin/components/settings/auth-rate-limits-table";
import { SettingsDataTableForm } from "@/features/admin/components/settings/settings-data-table-form";
import { getAuthCsrfConfig } from "@/lib/auth-csrf";
import { getTrustedProxyConfig, listAuthRateLimits } from "@/lib/auth-rate-limit";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { buildSecurityHeaders, getSecurityHeaderWarnings } from "@/lib/security-headers";
import { getSystemSettings } from "@/lib/system-settings";

const AUTH_RATE_LIMIT_SCOPE_OPTIONS = [
  "all",
  "login:ip",
  "login:email",
  "admin_login:ip",
  "admin_login:email",
  "provider_login:ip",
  "provider_login:email",
  "register:ip",
  "register:email",
  "register:phone",
] as const;

export default async function AdminSecurityConfigPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const rateLimitScope = String(params.rateLimitScope ?? "all");
  const rateLimitStatus = String(params.rateLimitStatus ?? "all") as "active" | "expired" | "all";
  const rateLimitRawKey = String(params.rateLimitRawKey ?? "");
  const settings = await getSystemSettings();
  const publicLoginIp = settings.security.authRateLimits.publicLoginIp;
  const publicLoginEmail = settings.security.authRateLimits.publicLoginEmail;
  const adminLoginIp = settings.security.authRateLimits.adminLoginIp;
  const adminLoginEmail = settings.security.authRateLimits.adminLoginEmail;
  const providerLoginIp = settings.security.authRateLimits.providerLoginIp;
  const providerLoginEmail = settings.security.authRateLimits.providerLoginEmail;
  const proxyConfig = getTrustedProxyConfig();
  const csrfConfig = getAuthCsrfConfig();
  const securityHeaders = settings.security.headers;
  const cleanup = settings.security.authRateLimitCleanup;
  const headerPreview = Array.from(buildSecurityHeaders(securityHeaders, { includeHsts: true }).entries());
  const headerWarnings = getSecurityHeaderWarnings(securityHeaders);
  const rateLimitRows = await listAuthRateLimits({
    scope: rateLimitScope,
    status: rateLimitStatus === "active" || rateLimitStatus === "expired" ? rateLimitStatus : "all",
    rawKey: rateLimitRawKey,
    limit: 100,
  });

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <AdminOverviewGrid>
        <AdminOverviewCard title="Public Login IP" value={`${publicLoginIp.limit}/${publicLoginIp.windowMinutes}m`} icon={ShieldCheck} />
        <AdminOverviewCard title="Public Login Email" value={`${publicLoginEmail.limit}/${publicLoginEmail.windowMinutes}m`} icon={TimerReset} />
        <AdminOverviewCard title="Admin Login IP" value={`${adminLoginIp.limit}/${adminLoginIp.windowMinutes}m`} icon={ShieldCheck} />
        <AdminOverviewCard title="Provider Login IP" value={`${providerLoginIp.limit}/${providerLoginIp.windowMinutes}m`} icon={TimerReset} />
        <AdminOverviewCard title="Trusted Proxy" value={proxyConfig.mode} icon={ShieldCheck} />
        <AdminOverviewCard title="Auth CSRF" value={csrfConfig.enabled ? "On" : "Off"} icon={ShieldCheck} />
        <AdminOverviewCard title="Security Headers" value={securityHeaders.enabled ? "On" : "Off"} icon={ShieldCheck} />
        <AdminOverviewCard title="Rate Limit Cleanup" value={cleanup.enabled ? "On" : "Off"} icon={TimerReset} />
      </AdminOverviewGrid>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Public Login Rate Limit</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <SettingsDataTableForm
            section="security"
            title="Bảo mật đăng nhập"
            saveMessage="Đã lưu cấu hình bảo mật đăng nhập."
            rows={[
              {
                id: "publicLoginIpLimit",
                label: "IP Attempt Limit",
                description: "Số lần login sai tối đa cho mỗi IP trong cửa sổ thời gian.",
                type: "text",
                value: String(publicLoginIp.limit),
              },
              {
                id: "publicLoginIpWindowMinutes",
                label: "IP Window Minutes",
                description: "Độ dài cửa sổ rate-limit theo phút cho mỗi IP.",
                type: "text",
                value: String(publicLoginIp.windowMinutes),
              },
              {
                id: "publicLoginEmailLimit",
                label: "Email Attempt Limit",
                description: "Số lần login sai tối đa cho mỗi email trong cửa sổ thời gian.",
                type: "text",
                value: String(publicLoginEmail.limit),
              },
              {
                id: "publicLoginEmailWindowMinutes",
                label: "Email Window Minutes",
                description: "Độ dài cửa sổ rate-limit theo phút cho mỗi email.",
                type: "text",
                value: String(publicLoginEmail.windowMinutes),
              },
              {
                id: "adminLoginIpLimit",
                label: "Admin IP Attempt Limit",
                description: "Số lần login admin sai tối đa cho mỗi IP. Mặc định chặt hơn public login.",
                type: "text",
                value: String(adminLoginIp.limit),
              },
              {
                id: "adminLoginIpWindowMinutes",
                label: "Admin IP Window Minutes",
                description: "Độ dài cửa sổ rate-limit admin theo phút cho mỗi IP.",
                type: "text",
                value: String(adminLoginIp.windowMinutes),
              },
              {
                id: "adminLoginEmailLimit",
                label: "Admin Email Attempt Limit",
                description: "Số lần login admin sai tối đa cho mỗi email.",
                type: "text",
                value: String(adminLoginEmail.limit),
              },
              {
                id: "adminLoginEmailWindowMinutes",
                label: "Admin Email Window Minutes",
                description: "Độ dài cửa sổ rate-limit admin theo phút cho mỗi email.",
                type: "text",
                value: String(adminLoginEmail.windowMinutes),
              },
              {
                id: "providerLoginIpLimit",
                label: "Provider IP Attempt Limit",
                description: "Số lần login provider sai tối đa cho mỗi IP. Mặc định chặt hơn public login.",
                type: "text",
                value: String(providerLoginIp.limit),
              },
              {
                id: "providerLoginIpWindowMinutes",
                label: "Provider IP Window Minutes",
                description: "Độ dài cửa sổ rate-limit provider theo phút cho mỗi IP.",
                type: "text",
                value: String(providerLoginIp.windowMinutes),
              },
              {
                id: "providerLoginEmailLimit",
                label: "Provider Email Attempt Limit",
                description: "Số lần login provider sai tối đa cho mỗi email.",
                type: "text",
                value: String(providerLoginEmail.limit),
              },
              {
                id: "providerLoginEmailWindowMinutes",
                label: "Provider Email Window Minutes",
                description: "Độ dài cửa sổ rate-limit provider theo phút cho mỗi email.",
                type: "text",
                value: String(providerLoginEmail.windowMinutes),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Trusted Proxy / IP Headers</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {proxyConfig.warning ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {proxyConfig.warning}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              App chỉ tin các IP header được bật bởi mode hiện tại. Hãy đảm bảo proxy/CDN đã strip header client gửi lên và set lại header tin cậy.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="font-medium">Mode</p>
              <p className="mt-1 text-muted-foreground">{proxyConfig.mode}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Trusted headers</p>
              <p className="mt-1 text-muted-foreground">
                {proxyConfig.trustedHeaders.length ? proxyConfig.trustedHeaders.join(", ") : "None"}
              </p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Cloudflare header</p>
              <p className="mt-1 text-muted-foreground">{proxyConfig.trustsCloudflareHeader ? "Trusted" : "Not trusted"}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Reverse proxy headers</p>
              <p className="mt-1 text-muted-foreground">{proxyConfig.trustsForwardedHeaders ? "Trusted" : "Not trusted"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Auth Rate Limit Cleanup</CardTitle>
          <TimerReset className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="font-medium">Status</p>
              <p className="mt-1 text-muted-foreground">{cleanup.enabled ? "Enabled" : "Disabled"}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Retention</p>
              <p className="mt-1 text-muted-foreground">{cleanup.retentionDays} days after expires_at</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Last Run</p>
              <p className="mt-1 text-muted-foreground">
                {cleanup.lastRunAt ? `${new Date(cleanup.lastRunAt).toLocaleString()} · ${cleanup.lastDeletedCount} deleted` : "Chưa chạy"}
              </p>
            </div>
          </div>

          <SettingsDataTableForm
            section="security_cleanup"
            title="Auth Rate Limit Cleanup"
            saveMessage="Đã lưu cấu hình cleanup auth rate-limit."
            rows={[
              {
                id: "authRateLimitCleanupEnabled",
                label: "Enable Cleanup",
                description: "Bật/tắt cleanup định kỳ cho auth_rate_limits.",
                type: "boolean",
                value: cleanup.enabled,
              },
              {
                id: "authRateLimitCleanupRetentionDays",
                label: "Retention Days",
                description: "Chỉ xóa record đã hết hạn lâu hơn số ngày này.",
                type: "text",
                value: String(cleanup.retentionDays),
              },
            ]}
          />

          <NativeForm action={ROUTES.API.ADMIN.CONFIG.AUTH_RATE_LIMIT_CLEANUP} method="POST">
            <AdminSubmitButton>Chạy cleanup thủ công</AdminSubmitButton>
          </NativeForm>
        </CardContent>
      </Card>

      <Card id="auth-rate-limits" className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Auth Rate Limits</CardTitle>
          <TimerReset className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-5">
          <AuthRateLimitsTable
            rows={rateLimitRows}
            scope={rateLimitScope}
            status={rateLimitStatus}
            rawKey={rateLimitRawKey}
            scopeOptions={AUTH_RATE_LIMIT_SCOPE_OPTIONS}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Auth CSRF Protection</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div
            className={`rounded-md border px-4 py-3 ${
              csrfConfig.enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {csrfConfig.enabled
              ? "CSRF protection đang bật cho login, register, admin login và provider login."
              : "CSRF protection đang tắt trong non-production bằng AUTH_CSRF_DISABLED=true. Production luôn bật."}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-4">
              <p className="font-medium">Status</p>
              <p className="mt-1 text-muted-foreground">{csrfConfig.enabled ? "Enabled" : "Disabled"}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Token TTL</p>
              <p className="mt-1 text-muted-foreground">{csrfConfig.tokenTtlMinutes} minutes</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-medium">Production</p>
              <p className="mt-1 text-muted-foreground">{csrfConfig.productionForced ? "Forced on" : "Env controlled"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium">Security Headers</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-5">
          {headerWarnings.length ? (
            <div className="space-y-2">
              {headerWarnings.map((warning) => (
                <div key={warning} className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {warning}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Security headers đang bật với cấu hình không có wildcard hoặc cảnh báo nguy hiểm rõ ràng.
            </div>
          )}

          <SettingsDataTableForm
            section="security_headers"
            title="Security Headers"
            saveMessage="Đã lưu cấu hình security headers."
            rows={[
              {
                id: "headersEnabled",
                label: "Enable Headers",
                description: "Bật/tắt toàn bộ security headers.",
                type: "boolean",
                value: securityHeaders.enabled,
              },
              {
                id: "cspEnabled",
                label: "Enable CSP",
                description: "Bật Content-Security-Policy.",
                type: "boolean",
                value: securityHeaders.contentSecurityPolicy.enabled,
              },
              {
                id: "cspReportOnly",
                label: "CSP Report Only",
                description: "Chỉ report CSP thay vì enforce.",
                type: "boolean",
                value: securityHeaders.contentSecurityPolicy.reportOnly,
              },
              {
                id: "cspDefaultSrc",
                label: "CSP default-src",
                description: "Nguồn mặc định khi directive riêng không khai báo.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.defaultSrc,
              },
              {
                id: "cspScriptSrc",
                label: "CSP script-src",
                description: "Nguồn script. Next.js hiện dùng unsafe-inline để tránh vỡ hydration.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.scriptSrc,
              },
              {
                id: "cspStyleSrc",
                label: "CSP style-src",
                description: "Nguồn style, gồm inline style của Next/UI.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.styleSrc,
              },
              {
                id: "cspImgSrc",
                label: "CSP img-src",
                description: "Nguồn ảnh, gồm uploads, data/blob và remote image.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.imgSrc,
              },
              {
                id: "cspConnectSrc",
                label: "CSP connect-src",
                description: "Nguồn fetch/SSE/API/payment/analytics.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.connectSrc,
              },
              {
                id: "cspFontSrc",
                label: "CSP font-src",
                description: "Nguồn font.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.fontSrc,
              },
              {
                id: "cspFrameSrc",
                label: "CSP frame-src",
                description: "Nguồn iframe, ví dụ payment gateway.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.frameSrc,
              },
              {
                id: "cspFrameAncestors",
                label: "CSP frame-ancestors",
                description: "Domain được phép nhúng site. Dùng 'none' để chống clickjacking.",
                type: "text",
                value: securityHeaders.contentSecurityPolicy.frameAncestors,
              },
              {
                id: "hstsEnabled",
                label: "Enable HSTS",
                description: "Bật Strict-Transport-Security ở production HTTPS.",
                type: "boolean",
                value: securityHeaders.strictTransportSecurity.enabled,
              },
              {
                id: "hstsMaxAge",
                label: "HSTS max-age",
                description: "Thời gian HSTS tính bằng giây.",
                type: "text",
                value: String(securityHeaders.strictTransportSecurity.maxAge),
              },
              {
                id: "hstsIncludeSubDomains",
                label: "HSTS includeSubDomains",
                description: "Chỉ bật khi mọi subdomain đều HTTPS.",
                type: "boolean",
                value: securityHeaders.strictTransportSecurity.includeSubDomains,
              },
              {
                id: "hstsPreload",
                label: "HSTS preload",
                description: "Chỉ bật khi domain sẵn sàng preload.",
                type: "boolean",
                value: securityHeaders.strictTransportSecurity.preload,
              },
              {
                id: "xFrameOptionsEnabled",
                label: "Enable X-Frame-Options",
                description: "Header chống clickjacking cho browser cũ.",
                type: "boolean",
                value: securityHeaders.xFrameOptions.enabled,
              },
              {
                id: "xFrameOptionsValue",
                label: "X-Frame-Options",
                description: "DENY hoặc SAMEORIGIN.",
                type: "select",
                value: securityHeaders.xFrameOptions.value,
                options: [
                  { label: "DENY", value: "DENY" },
                  { label: "SAMEORIGIN", value: "SAMEORIGIN" },
                ],
              },
              {
                id: "xContentTypeOptions",
                label: "X-Content-Type-Options",
                description: "Bật nosniff.",
                type: "boolean",
                value: securityHeaders.xContentTypeOptions,
              },
              {
                id: "referrerPolicyEnabled",
                label: "Enable Referrer-Policy",
                description: "Kiểm soát referrer khi chuyển trang.",
                type: "boolean",
                value: securityHeaders.referrerPolicy.enabled,
              },
              {
                id: "referrerPolicyValue",
                label: "Referrer-Policy",
                description: "Giá trị Referrer-Policy.",
                type: "text",
                value: securityHeaders.referrerPolicy.value,
              },
              {
                id: "permissionsPolicyEnabled",
                label: "Enable Permissions-Policy",
                description: "Tắt quyền browser không dùng.",
                type: "boolean",
                value: securityHeaders.permissionsPolicy.enabled,
              },
              {
                id: "permissionsPolicyValue",
                label: "Permissions-Policy",
                description: "Danh sách feature policy.",
                type: "text",
                value: securityHeaders.permissionsPolicy.value,
              },
            ]}
          />

          <div className="rounded-md border bg-background">
            <div className="border-b px-4 py-3 text-sm font-medium">Header Preview</div>
            <div className="divide-y text-sm">
              {headerPreview.length ? (
                headerPreview.map(([key, value]) => (
                  <div key={key} className="grid gap-2 px-4 py-3 md:grid-cols-[220px_minmax(0,1fr)]">
                    <code className="break-all text-muted-foreground">{key}</code>
                    <code className="break-all">{value}</code>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-muted-foreground">Không có header nào sẽ được trả về.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
