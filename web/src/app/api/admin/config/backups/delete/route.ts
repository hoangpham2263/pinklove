import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getAdminBackupFilePath } from "@/lib/admin-backups";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const body = (await request.json().catch(() => ({}))) as { name?: string };

  try {
    const filePath = getAdminBackupFilePath(String(body.name ?? ""));

    await fs.unlink(filePath);
    await fs.unlink(`${filePath}.sha256`).catch(() => undefined);

    return NextResponse.json({ ok: true, message: "Đã xóa backup package." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Không thể xóa backup package." },
      { status: 400 }
    );
  }
}
