import { NextResponse } from "next/server";
import { runBackupScript } from "@/lib/admin-backup-commands";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await requireAdmin();

  try {
    await runBackupScript();

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
