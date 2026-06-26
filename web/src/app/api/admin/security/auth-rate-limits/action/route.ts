import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { hasAdminPermission } from "@/features/access/server/service";
import {
  clearExpiredAuthRateLimits,
  deleteAuthRateLimit,
  deleteAuthRateLimitScope,
} from "@/lib/auth-rate-limit";
import { ROUTES } from "@/lib/routes";
import { recordFieldChanges } from "@/features/platform/server/field-change-logs";
import { recordSecurityEvent } from "@/lib/security-events";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";

export const runtime = "nodejs";

function redirectLocation() {
  return `${ROUTES.ADMIN.SECURITY_SETTINGS}#auth-rate-limits`;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!(await hasAdminPermission(admin.id, "security.rate_limits.manage"))) {
    return respondError(request, {
      status: 403,
      error: "FORBIDDEN",
      message: "Bạn cần quyền security.rate_limits.manage.",
      location: redirectLocation(),
    });
  }
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "").trim();
  const scope = String(formData.get("scope") ?? "").trim();
  const rateKey = String(formData.get("rateKey") ?? "").trim();

  try {
    if (intent === "unlock_row") {
      if (!scope || !rateKey) {
        return respondError(request, {
          error: "missing_fields",
          message: "Thiếu scope hoặc rate key.",
          location: redirectLocation(),
        });
      }

      const deleted = await deleteAuthRateLimit(scope, rateKey);
      await recordFieldChanges([
        {
          targetType: "auth_rate_limit",
          targetId: `${scope}:${rateKey}`,
          fieldKey: "unlock_row",
          oldValue: deleted,
          newValue: null,
          actorId: admin.id,
          metadata: { action: "unlock_row", scope, rateKeyShort: `${rateKey.slice(0, 12)}...${rateKey.slice(-8)}` },
        },
      ]);
      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: { action: "auth_rate_limit_unlock_row", scope, deletedCount: deleted.length },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "auth_rate_limit.unlock_row",
        targetType: "auth_rate_limit",
        targetId: `${scope}:${rateKey}`,
        before: deleted,
        after: null,
        reason: "Manual unlock rate-limit row",
      });

      return respondSuccess(request, {
        message: `Đã mở khóa ${deleted.length} rate-limit record.`,
        location: redirectLocation(),
      });
    }

    if (intent === "unlock_scope") {
      if (!scope || scope === "all") {
        return respondError(request, {
          error: "missing_scope",
          message: "Vui lòng chọn scope cụ thể.",
          location: redirectLocation(),
        });
      }

      const deleted = await deleteAuthRateLimitScope(scope);
      await recordFieldChanges([
        {
          targetType: "auth_rate_limit",
          targetId: scope,
          fieldKey: "unlock_scope",
          oldValue: { deletedCount: deleted.length },
          newValue: null,
          actorId: admin.id,
          metadata: { action: "unlock_scope", scope },
        },
      ]);
      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: { action: "auth_rate_limit_unlock_scope", scope, deletedCount: deleted.length },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "auth_rate_limit.unlock_scope",
        targetType: "auth_rate_limit_scope",
        targetId: scope,
        before: { deletedCount: deleted.length },
        after: null,
        reason: "Manual unlock rate-limit scope",
      });

      return respondSuccess(request, {
        message: `Đã mở khóa ${deleted.length} record trong scope ${scope}.`,
        location: redirectLocation(),
      });
    }

    if (intent === "clear_expired") {
      const deleted = await clearExpiredAuthRateLimits();
      await recordFieldChanges([
        {
          targetType: "auth_rate_limit",
          targetId: "expired",
          fieldKey: "clear_expired",
          oldValue: { deletedCount: deleted.length },
          newValue: null,
          actorId: admin.id,
          metadata: { action: "clear_expired" },
        },
      ]);
      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: { action: "auth_rate_limit_clear_expired", deletedCount: deleted.length },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "auth_rate_limit.clear_expired",
        targetType: "auth_rate_limit",
        targetId: "expired",
        before: { deletedCount: deleted.length },
        after: null,
        reason: "Manual clear expired auth rate-limits",
      });

      return respondSuccess(request, {
        message: `Đã xóa ${deleted.length} record hết hạn.`,
        location: redirectLocation(),
      });
    }

    return respondError(request, {
      error: "invalid_intent",
      message: "Action không hợp lệ.",
      location: redirectLocation(),
    });
  } catch (error) {
    console.error("Failed to run auth rate-limit action:", error);
    return respondError(request, {
      status: 500,
      error: "action_failed",
      message: "Không thể cập nhật auth rate limits.",
      location: redirectLocation(),
    });
  }
}
