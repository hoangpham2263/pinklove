import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { hasAdminPermission } from "@/features/access/server/service";
import { getRequestIp } from "@/lib/auth-rate-limit";
import {
  createBlockedIp,
  extendBlockedIp,
  ipMatchesIpOrCidr,
  isValidIpOrCidr,
  revokeBlockedIp,
} from "@/lib/blocked-ips";
import { ROUTES } from "@/lib/routes";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";
import { recordSecurityEvent } from "@/lib/security-events";

export const runtime = "nodejs";

function redirectLocation() {
  return ROUTES.ADMIN.SECURITY_BLOCKED_IPS;
}

function parseDuration(value: string) {
  if (value === "custom") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 60;
  return Math.max(5, Math.min(30 * 24 * 60, Math.floor(parsed)));
}

function parseCustomDuration(formData: FormData) {
  const custom = Number(formData.get("customDurationMinutes") ?? "60");
  if (!Number.isFinite(custom)) return 60;
  return Math.max(5, Math.min(30 * 24 * 60, Math.floor(custom)));
}

function durationFromForm(formData: FormData) {
  const duration = parseDuration(String(formData.get("durationMinutes") ?? "60"));
  return duration ?? parseCustomDuration(formData);
}

function isSelfBlockCandidate(requestIp: string, ipOrCidr: string) {
  return requestIp !== "unknown" && ipMatchesIpOrCidr(requestIp, ipOrCidr);
}

async function assertSafeSelfBlock(request: Request, ipOrCidr: string, formData: FormData) {
  const requestIp = getRequestIp(request);
  const confirmed = String(formData.get("confirmSelfBlock") ?? "").trim().toUpperCase() === "BLOCK_MY_IP";

  if (isSelfBlockCandidate(requestIp, ipOrCidr) && !confirmed) {
    throw new Error("SELF_BLOCK_CONFIRMATION_REQUIRED");
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!(await hasAdminPermission(admin.id, "security.ip_blocks.manage"))) {
    return respondError(request, {
      status: 403,
      error: "FORBIDDEN",
      message: "Bạn cần quyền security.ip_blocks.manage.",
      location: redirectLocation(),
    });
  }
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "").trim();

  try {
    if (intent === "create") {
      const ipOrCidr = String(formData.get("ipOrCidr") ?? "").trim();
      const reason = String(formData.get("reason") ?? "").trim();

      if (!ipOrCidr || !isValidIpOrCidr(ipOrCidr)) {
        return respondError(request, {
          error: "invalid_ip",
          message: "IP hoặc CIDR không hợp lệ.",
          location: redirectLocation(),
        });
      }

      await assertSafeSelfBlock(request, ipOrCidr, formData);
      const row = await createBlockedIp({
        ipOrCidr,
        reason: reason || "Manual admin block",
        durationMinutes: durationFromForm(formData),
        createdBy: admin.id,
      });
      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: { action: "blocked_ip_create", blockId: row.id, ipOrCidr: row.ipOrCidr },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "blocked_ip.create",
        targetType: "blocked_ip",
        targetId: row.id,
        before: null,
        after: row,
        reason: row.reason,
      });

      return respondSuccess(request, {
        message: `Đã block ${row.ipOrCidr}.`,
        location: redirectLocation(),
      });
    }

    if (intent === "import") {
      const bulk = String(formData.get("bulkIpOrCidr") ?? "");
      const reason = String(formData.get("reason") ?? "").trim() || "Bulk admin block";
      const entries = bulk
        .split(/[\n,]+/g)
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (!entries.length) {
        return respondError(request, {
          error: "missing_entries",
          message: "Danh sách IP/CIDR trống.",
          location: redirectLocation(),
        });
      }

      const invalid = entries.find((entry) => !isValidIpOrCidr(entry));
      if (invalid) {
        return respondError(request, {
          error: "invalid_ip",
          message: `IP hoặc CIDR không hợp lệ: ${invalid}`,
          location: redirectLocation(),
        });
      }

      for (const entry of entries) {
        await assertSafeSelfBlock(request, entry, formData);
      }

      const durationMinutes = durationFromForm(formData);
      const created = [];
      for (const entry of entries) {
        created.push(await createBlockedIp({
          ipOrCidr: entry,
          reason,
          durationMinutes,
          createdBy: admin.id,
        }));
      }

      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: {
          action: "blocked_ip_import",
          count: created.length,
          ipOrCidrs: created.map((row) => row.ipOrCidr),
        },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "blocked_ip.import",
        targetType: "blocked_ip",
        targetId: "bulk_import",
        before: null,
        after: created,
        reason,
      });

      return respondSuccess(request, {
        message: `Đã import ${created.length} block.`,
        location: redirectLocation(),
      });
    }

    if (intent === "revoke") {
      const id = String(formData.get("id") ?? "").trim();
      const row = id ? await revokeBlockedIp({ id, revokedBy: admin.id }) : null;
      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: { action: "blocked_ip_revoke", blockId: id, ipOrCidr: row?.ipOrCidr },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "blocked_ip.revoke",
        targetType: "blocked_ip",
        targetId: id,
        before: null,
        after: row,
        reason: "Manual unblock/revoke",
      });

      return respondSuccess(request, {
        message: row ? `Đã unblock ${row.ipOrCidr}.` : "Block không còn active.",
        location: redirectLocation(),
      });
    }

    if (intent === "extend") {
      const id = String(formData.get("id") ?? "").trim();
      const durationMinutes = durationFromForm(formData);
      const row = id ? await extendBlockedIp({ id, durationMinutes }) : null;
      await recordSecurityEvent({
        request,
        eventType: "admin_action",
        status: 303,
        userId: admin.id,
        metadata: { action: "blocked_ip_extend", blockId: id, ipOrCidr: row?.ipOrCidr, durationMinutes },
      });
      await recordSecurityAuditLog({
        request,
        adminUserId: admin.id,
        action: "blocked_ip.extend",
        targetType: "blocked_ip",
        targetId: id,
        before: null,
        after: row,
        reason: `Extend block for ${durationMinutes} minutes`,
      });

      return respondSuccess(request, {
        message: row ? `Đã gia hạn ${row.ipOrCidr}.` : "Không tìm thấy block để gia hạn.",
        location: redirectLocation(),
      });
    }

    return respondError(request, {
      error: "invalid_intent",
      message: "Action không hợp lệ.",
      location: redirectLocation(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SELF_BLOCK_CONFIRMATION_REQUIRED") {
      return respondError(request, {
        error: "self_block_confirmation_required",
        message: "Block này khớp IP admin hiện tại. Nhập BLOCK_MY_IP vào ô xác nhận nếu thật sự muốn tiếp tục.",
        location: redirectLocation(),
      });
    }

    console.error("Failed to update blocked IPs:", error);
    return respondError(request, {
      status: 500,
      error: "blocked_ip_action_failed",
      message: "Không thể cập nhật blocked IPs.",
      location: redirectLocation(),
    });
  }
}
