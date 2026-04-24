import { NextResponse } from "next/server";

import { listVendorProductSubmissionsForAdmin } from "@/features/vendor-product-submissions/server/service";
import { getCurrentUserFromRequest, isAdminRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const submissions = await listVendorProductSubmissionsForAdmin();
  return NextResponse.json({ submissions });
}
