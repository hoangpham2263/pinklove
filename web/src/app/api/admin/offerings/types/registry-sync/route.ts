import { getOfferingTypeRegistrySyncStatus, syncOfferingTypesFromRegistry } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  const status = await getOfferingTypeRegistrySyncStatus();
  return NextResponse.json({ ok: true, status });
}

export async function POST() {
  await requireAdmin();
  const status = await syncOfferingTypesFromRegistry();
  return NextResponse.json({ ok: true, status, message: "Đã đồng bộ offering types từ code registry xuống DB." });
}
