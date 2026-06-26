import { NextResponse } from "next/server";

import { verifyAdminBackupPackage } from "@/lib/admin-backups";
import { requireAdmin } from "@/lib/auth";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";
import { recordSecurityEvent } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const backupName = String(body.name ?? "");

  try {
    const result = await verifyAdminBackupPackage(backupName);
    await recordSecurityEvent({
      request,
      eventType: "admin_action",
      status: result.ok ? 200 : 400,
      userId: admin.id,
      metadata: { action: "backup_integrity_check", backupName, ok: result.ok },
    });
    await recordSecurityAuditLog({
      request,
      adminUserId: admin.id,
      action: "backup.integrity_check",
      targetType: "backup_package",
      targetId: backupName,
      before: null,
      after: { ok: result.ok, message: result.message },
      reason: "Manual backup integrity check",
    });

    return NextResponse.json({
      ok: result.ok,
      message: result.message,
    }, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Không thể kiểm tra backup package." },
      { status: 400 }
    );
  }
}
