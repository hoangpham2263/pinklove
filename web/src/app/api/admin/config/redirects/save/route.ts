import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import {
  getSeoRedirectRuleById,
  getSeoRedirectRuleBySourcePath,
  isValidSeoRedirectTarget,
  normalizeSeoRedirectSource,
  normalizeSeoRedirectTarget,
  saveSeoRedirectRule,
  wouldCreateSeoRedirectCycle,
} from "@/lib/seo-redirects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();
  const sourcePath = normalizeSeoRedirectSource(String(formData.get("sourcePath") ?? ""));
  const targetPath = normalizeSeoRedirectTarget(String(formData.get("targetPath") ?? ""));
  const statusCode = Number(formData.get("statusCode")) === 302 ? 302 : 301;

  if (!sourcePath || sourcePath === "/" || !targetPath || !isValidSeoRedirectTarget(targetPath)) {
    return respondError(request, { status: 400, error: "INVALID_REDIRECT", message: "Source hoặc target không hợp lệ." });
  }
  if (sourcePath === targetPath) {
    return respondError(request, { status: 400, error: "REDIRECT_LOOP", message: "Source và target không được giống nhau." });
  }

  const existing = id ? await getSeoRedirectRuleById(id) : null;
  const duplicate = await getSeoRedirectRuleBySourcePath(sourcePath);
  if (duplicate && duplicate.id !== existing?.id) {
    return respondError(request, { status: 409, error: "DUPLICATE_SOURCE", message: "Source path đã tồn tại." });
  }
  if (await wouldCreateSeoRedirectCycle(sourcePath, targetPath)) {
    return respondError(request, { status: 400, error: "REDIRECT_CYCLE", message: "Redirect này tạo vòng lặp." });
  }

  const now = new Date().toISOString();
  await saveSeoRedirectRule({
    id: existing?.id ?? crypto.randomUUID(),
    sourcePath,
    targetPath,
    statusCode,
    enabled: formData.get("enabled") === "on",
    label: String(formData.get("label") ?? "").trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  return respondSuccess(request, { location: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS, message: "Đã lưu redirect." });
}
