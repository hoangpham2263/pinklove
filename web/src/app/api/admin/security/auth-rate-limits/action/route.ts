import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import {
  clearExpiredAuthRateLimits,
  deleteAuthRateLimit,
  deleteAuthRateLimitScope,
} from "@/lib/auth-rate-limit";
import { ROUTES } from "@/lib/routes";
import { recordFieldChanges } from "@/features/platform/server/field-change-logs";

export const runtime = "nodejs";

function redirectLocation() {
  return `${ROUTES.ADMIN.CONFIG_SECURITY}#auth-rate-limits`;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
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
