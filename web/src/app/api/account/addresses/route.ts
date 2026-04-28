import { NextResponse } from "next/server";

import {
  deleteUserAddress,
  listUserAddresses,
  setDefaultUserAddress,
  upsertUserAddress,
} from "@/features/account/server/address-service";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getSafeReturnTo } from "@/lib/return-to";
import { ROUTES } from "@/lib/routes";

export const runtime = "nodejs";

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function redirect(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}

function withQueryFlag(pathname: string, key: string) {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}${key}=1`;
}

function addressInputFromForm(formData: FormData) {
  return {
    label: String(formData.get("label") ?? ""),
    recipientName: String(formData.get("recipientName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? ""),
    ward: String(formData.get("ward") ?? ""),
    district: String(formData.get("district") ?? ""),
    city: String(formData.get("city") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "VN"),
    isDefault: String(formData.get("isDefault") ?? "") === "on",
  };
}

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Please login first." }, { status: 401 });
  }

  return NextResponse.json({ addresses: await listUserAddresses(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    if (wantsJson(request)) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }
    return redirect(ROUTES.AUTH.LOGIN);
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "save");
  const addressId = String(formData.get("addressId") ?? "").trim();
  const returnTo = getSafeReturnTo(formData.get("returnTo"), ROUTES.CUSTOMER.CONFIG_ADDRESSES);

  try {
    if (action === "delete") {
      await deleteUserAddress(user.id, addressId);
    } else if (action === "setDefault") {
      await setDefaultUserAddress(user.id, addressId);
    } else {
      await upsertUserAddress(user.id, addressInputFromForm(formData), addressId || undefined);
    }
  } catch (error) {
    if (wantsJson(request)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "ADDRESS_SAVE_FAILED" },
        { status: 400 }
      );
    }

    return redirect(withQueryFlag(returnTo, "addressError"));
  }

  if (wantsJson(request)) {
    return NextResponse.json({ success: true, addresses: await listUserAddresses(user.id) });
  }

  return redirect(withQueryFlag(returnTo, "addressesSaved"));
}
