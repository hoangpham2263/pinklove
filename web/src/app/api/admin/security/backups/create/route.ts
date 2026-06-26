import { NextResponse } from "next/server";
import path from "path";
import { cleanupExpiredAdminBackups } from "@/lib/admin-backups";
import { runBackupScript } from "@/lib/admin-backup-commands";
import { requireAdmin } from "@/lib/auth";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";
import { recordSecurityEvent } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();

  try {
    const backupPath = await runBackupScript();
    const cleanup = await cleanupExpiredAdminBackups();
    const backupName = path.basename(backupPath);

    await recordSecurityEvent({
      request,
      eventType: "admin_action",
      status: 200,
      userId: admin.id,
      metadata: { action: "backup_create", backupName, deletedByRetention: cleanup.deleted.length },
    });
    await recordSecurityAuditLog({
      request,
      adminUserId: admin.id,
      action: "backup.create",
      targetType: "backup_package",
      targetId: backupName,
      before: null,
      after: { name: backupName, deletedByRetention: cleanup.deleted.length },
      reason: "Manual backup create",
    });

    return NextResponse.json({ ok: true, message: "Đã tạo backup mới." });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Không thể tạo backup: ${error.message}`
            : "Không thể tạo backup. Hãy kiểm tra Docker và script backup.",
      },
      { status: 500 }
    );
  }
}
