import { NextResponse } from "next/server";

import { getCurrentUserFromRequest, getUserShippingProfile, isVendorRole, setUserShippingProfile } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    if (wantsJson) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }
    return new NextResponse(null, { status: 303, headers: { Location: ROUTES.PARTNER.LOGIN } });
  }

  if (!isVendorRole(user.role)) {
    if (wantsJson) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return new NextResponse(null, { status: 303, headers: { Location: ROUTES.CUSTOMER.DASHBOARD } });
  }

  const formData = await request.formData();
  const currentProfile = await getUserShippingProfile(user.id);

  await setUserShippingProfile(user.id, {
    businessName: String(formData.get("businessName") ?? ""),
    storeName: String(formData.get("storeName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    pickupContactName: currentProfile.pickupContactName,
    pickupPhone: currentProfile.pickupPhone,
    pickupAddressLine1: currentProfile.pickupAddressLine1,
    pickupWard: currentProfile.pickupWard,
    pickupDistrict: currentProfile.pickupDistrict,
    pickupProvince: currentProfile.pickupProvince,
    returnSameAsPickup: currentProfile.returnSameAsPickup,
    returnContactName: currentProfile.returnContactName,
    returnPhone: currentProfile.returnPhone,
    returnAddressLine1: currentProfile.returnAddressLine1,
    returnWard: currentProfile.returnWard,
    returnDistrict: currentProfile.returnDistrict,
    returnProvince: currentProfile.returnProvince,
  });

  if (wantsJson) {
    return NextResponse.json({ success: true });
  }

  return new NextResponse(null, { status: 303, headers: { Location: ROUTES.PARTNER.CONFIG_ACCOUNT } });
}
