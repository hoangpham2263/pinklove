import { NextResponse } from "next/server";
import { getAdminBackupFilePath } from "@/lib/admin-backups";
import { runRestoreScript } from "@/lib/admin-backup-commands";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const body = (await request.json().catch(() => ({}))) as { name?: string; confirmation?: string };

  if (body.confirmation !== "RESTORE") {
    return NextResponse.json({ ok: false, message: "Thiếu xác nhận RESTORE." }, { status: 400 });
  }

  try {
    const filePath = getAdminBackupFilePath(String(body.name ?? ""));

    await runRestoreScript(filePath);

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
