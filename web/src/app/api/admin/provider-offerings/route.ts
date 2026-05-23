import { NextResponse } from "next/server";

import { listProviderOfferingSubmissionsForAdmin } from "@/features/provider-offering-submissions/server/service";
import { getCurrentUserFromRequest, isAdminRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const submissions = await listProviderOfferingSubmissionsForAdmin();
  return NextResponse.json({ submissions });
}
