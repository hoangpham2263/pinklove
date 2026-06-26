import { NextResponse } from "next/server";
import { getAdminBackupFilePath, verifyAdminBackupPackage } from "@/lib/admin-backups";
import { runRestoreScript } from "@/lib/admin-backup-commands";
import { requireAdmin } from "@/lib/auth";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";
import { recordSecurityEvent } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();

  const body = (await request.json().catch(() => ({}))) as { name?: string; confirmation?: string };

  if (body.confirmation !== "RESTORE") {
    return NextResponse.json({ ok: false, message: "Thiếu xác nhận RESTORE." }, { status: 400 });
  }

  try {
    const backupName = String(body.name ?? "");
    const integrity = await verifyAdminBackupPackage(backupName);
    if (!integrity.ok) {
      return NextResponse.json({ ok: false, message: `Không thể restore: ${integrity.message}` }, { status: 400 });
    }

    const filePath = getAdminBackupFilePath(backupName);

    await runRestoreScript(filePath);
    await recordSecurityEvent({
      request,
      eventType: "admin_action",
      status: 200,
      userId: admin.id,
      metadata: { action: "backup_restore", backupName },
    });
    await recordSecurityAuditLog({
      request,
      adminUserId: admin.id,
      action: "backup.restore",
      targetType: "backup_package",
      targetId: backupName,
      before: null,
      after: { name: backupName, checksumVerified: true },
      reason: "Manual backup restore",
    });

    return NextResponse.json({ ok: true, message: "Đã restore backup package." });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Không thể restore backup: ${error.message}`
            : "Không thể restore backup. Hãy kiểm tra Docker và script restore.",
      },
      { status: 500 }
    );
  }
}
