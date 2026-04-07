import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  type AffiliateCommissionType,
  type AffiliateStatus,
} from "@/features/affiliate/types";
import { adminUpdateAffiliateAccount } from "@/features/affiliate/server/service";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const formData = await request.formData();
  const userId = Number(formData.get("userId") ?? "0");
  const status = String(formData.get("status") ?? "pending") as AffiliateStatus;
  const commissionType = String(formData.get("commissionType") ?? "percent") as AffiliateCommissionType;
  const commissionValue = Number(formData.get("commissionValue") ?? "0");
  const notes = String(formData.get("notes") ?? "");

  if (!userId) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.AFFILIATES}?error=missing_user` },
    });
  }

  try {
    await adminUpdateAffiliateAccount({
      actorId: admin.id,
      userId,
      status,
      commissionType,
      commissionValue,
      notes,
    });

    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.AFFILIATES}?saved=updated` },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "update_failed";
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `${ROUTES.ADMIN.AFFILIATES}?error=${encodeURIComponent(code)}` },
    });
  }
}
