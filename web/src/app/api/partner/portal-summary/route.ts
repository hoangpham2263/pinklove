import { NextResponse } from "next/server";

import { countVendorAssignmentsForVendor, listVendorOrderSummariesForVendor } from "@/features/vendor-orders/server/service";
import { getCurrentUserFromRequest, isVendorRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isVendorRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [stats, assignments] = await Promise.all([
    countVendorAssignmentsForVendor(user.id),
    listVendorOrderSummariesForVendor(user.id),
  ]);

  return NextResponse.json({ stats, assignments });
}
