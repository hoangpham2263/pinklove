import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { ROUTES } from "@/lib/routes";
import type { SeoRedirectRule } from "@/lib/system-settings";
import {
  getSeoRedirectRuleById,
  getSeoRedirectRuleBySourcePath,
  isValidSeoRedirectTarget,
  normalizeSeoRedirectSource,
  normalizeSeoRedirectTarget,
  saveSeoRedirectRule,
} from "@/lib/seo-redirects";

export const runtime = "nodejs";

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();
  const sourcePath = normalizeSeoRedirectSource(String(formData.get("sourcePath") ?? ""));
  const targetPath = normalizeSeoRedirectTarget(String(formData.get("targetPath") ?? ""));
  const statusCode = Number(formData.get("statusCode")) === 302 ? 302 : 301;
  const label = String(formData.get("label") ?? "").trim();

  if (!sourcePath || /^https?:\/\//i.test(sourcePath)) {
    return respondError(request, {
      status: 400,
      error: "INVALID_SOURCE_PATH",
      message: "Source path phải là internal path, ví dụ /duong-dan-cu.",
    });
  }

  if (!targetPath || !isValidSeoRedirectTarget(targetPath)) {
    return respondError(request, {
      status: 400,
      error: "INVALID_TARGET_PATH",
      message: "Target path phải bắt đầu bằng / hoặc là URL http(s).",
    });
  }

  if (sourcePath === targetPath) {
    return respondError(request, {
      status: 400,
      error: "REDIRECT_LOOP",
      message: "Source và target không được giống nhau.",
    });
  }

  const now = new Date().toISOString();
  const existingRule = id ? await getSeoRedirectRuleById(id) : null;
  const existingSourceRule = await getSeoRedirectRuleBySourcePath(sourcePath);

  if (existingSourceRule && existingSourceRule.id !== existingRule?.id) {
    return respondError(request, {
      status: 409,
      error: "DUPLICATE_SOURCE_PATH",
      message: "Source path này đã có redirect.",
    });
  }

  const nextRule: SeoRedirectRule = {
    id: existingRule?.id ?? crypto.randomUUID(),
    sourcePath,
    targetPath,
    statusCode,
    enabled: isChecked(formData, "enabled"),
    label,
    createdAt: existingRule?.createdAt ?? now,
    updatedAt: now,
  };

  await saveSeoRedirectRule(nextRule);

  return respondSuccess(request, {
    message: existingRule ? "Đã cập nhật redirect." : "Đã thêm redirect.",
    location: ROUTES.ADMIN.CONFIG_SEO_REDIRECTS,
  });
}
