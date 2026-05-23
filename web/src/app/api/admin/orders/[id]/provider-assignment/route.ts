import { NextResponse } from "next/server";

import { getProviderAssignmentByOrderId } from "@/features/provider-orders/server/service";
import { getCurrentUserFromRequest, isAdminRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getProviderAssignmentByOrderId(id);
  return NextResponse.json({ detail });
}
