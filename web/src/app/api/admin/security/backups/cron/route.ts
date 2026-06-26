import path from "path";
import { NextResponse } from "next/server";

import { INTERNAL_API_KEY_HEADER } from "@/lib/api";
import { cleanupExpiredAdminBackups } from "@/lib/admin-backups";
import { runBackupScript } from "@/lib/admin-backup-commands";
import { recordSecurityEvent } from "@/lib/security-events";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
  return Boolean(expectedSecret && request.headers.get(INTERNAL_API_KEY_HEADER) === expectedSecret);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    await recordSecurityEvent({
      request,
      eventType: "forbidden_api",
      severity: "warn",
      status: 403,
      metadata: { action: "backup_cron_forbidden" },
    });
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  if (process.env.BACKUP_CRON_ENABLED !== "true") {
    return NextResponse.json({ ok: false, message: "Backup cron is disabled." }, { status: 409 });
  }

  try {
    const backupPath = await runBackupScript();
    const cleanup = await cleanupExpiredAdminBackups();
    const backupName = path.basename(backupPath);

    await recordSecurityEvent({
      request,
      eventType: "admin_action",
      status: 200,
      metadata: { action: "backup_cron_create", backupName, deletedByRetention: cleanup.deleted.length },
    });

    return NextResponse.json({
      ok: true,
      message: "Backup cron completed.",
      backupName,
      deletedByRetention: cleanup.deleted.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Backup cron failed." },
      { status: 500 }
    );
  }
}
