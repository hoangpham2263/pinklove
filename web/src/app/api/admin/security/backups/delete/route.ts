import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getAdminBackupFilePath } from "@/lib/admin-backups";
import { requireAdmin } from "@/lib/auth";
import { recordSecurityAuditLog } from "@/lib/security-audit-logs";
import { recordSecurityEvent } from "@/lib/security-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();

  const body = (await request.json().catch(() => ({}))) as { name?: string };

  try {
    const backupName = String(body.name ?? "");
    const filePath = getAdminBackupFilePath(backupName);

    await fs.unlink(filePath);
    await fs.unlink(`${filePath}.sha256`).catch(() => undefined);
    await recordSecurityEvent({
      request,
      eventType: "admin_action",
      status: 200,
      userId: admin.id,
      metadata: { action: "backup_delete", backupName },
    });
    await recordSecurityAuditLog({
      request,
      adminUserId: admin.id,
      action: "backup.delete",
      targetType: "backup_package",
      targetId: backupName,
      before: { name: backupName },
      after: null,
      reason: "Manual backup delete",
    });

    return NextResponse.json({ ok: true, message: "Đã xóa backup package." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Không thể xóa backup package." },
      { status: 400 }
    );
  }
}
