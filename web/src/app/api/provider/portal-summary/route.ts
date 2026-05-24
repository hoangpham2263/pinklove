import { NextResponse } from "next/server";

import { countProviderAssignmentsForProvider, listProviderOrderSummariesForProvider } from "@/features/provider-orders/server/service";
import { getCurrentUserFromRequest, isProviderRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isProviderRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [stats, assignments] = await Promise.all([
    countProviderAssignmentsForProvider(user.id),
    listProviderOrderSummariesForProvider(user.id),
  ]);

  return NextResponse.json({ stats, assignments });
}
