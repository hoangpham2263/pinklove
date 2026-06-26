import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getAdminBackupFilePath } from "@/lib/admin-backups";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  await requireAdmin();

  try {
    const { name } = await params;
    const filePath = getAdminBackupFilePath(name);
    const buffer = await fs.readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Type": "application/gzip",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Không tìm thấy backup package." },
      { status: 404 }
    );
  }
}
