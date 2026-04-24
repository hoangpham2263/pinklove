import { NextResponse } from "next/server";

import { getVendorProductSubmissionDetailForVendor } from "@/features/vendor-product-submissions/server/service";
import { getCurrentUserFromRequest, isVendorRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isVendorRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getVendorProductSubmissionDetailForVendor(user.id, id);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ detail });
}
