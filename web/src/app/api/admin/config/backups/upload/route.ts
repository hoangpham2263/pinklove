import { createHash } from "crypto";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { ensureAdminBackupDirectory, getAdminBackupFilePath } from "@/lib/admin-backups";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Thiếu file backup cần upload." }, { status: 400 });
  }

  if (!file.name.endsWith(".tar.gz")) {
    return NextResponse.json({ ok: false, message: "Chỉ hỗ trợ backup package dạng .tar.gz." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = getAdminBackupFilePath(file.name);
    const checksum = createHash("sha256").update(buffer).digest("hex");

    await ensureAdminBackupDirectory();
    await fs.writeFile(filePath, buffer, { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
      if (error.code === "EEXIST") {
        throw new Error("File backup này đã tồn tại.");
      }

      throw error;
    });
    await fs.writeFile(`${filePath}.sha256`, `${checksum}  ${file.name}\n`);

    return NextResponse.json({ ok: true, message: "Đã upload backup vào thư viện." });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Không thể upload backup." },
      { status: 400 }
    );
  }
}
