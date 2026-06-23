import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { withTransaction } from "@/lib/database";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import {
 DEFAULT_PHONE_COUNTRY,
 getPhoneCountryByCode,
} from "@/features/auth/phone-countries";
import { normalizePhoneNumber } from "@/features/auth/phone-number";

import {
 createSession,
 getPublicRegistrationRole,
 getSessionCookieOptions,
 registerUser,
 SESSION_COOKIE_NAME,
 USER_ROLES,
} from"@/lib/auth";

export const runtime ="nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
 const formData = await request.formData();
 const accountName = String(formData.get("accountName") ??"").trim();
 const password = String(formData.get("password") ??"");
 const phone = String(formData.get("phone") ??"").trim();
 const phoneCountry =
  getPhoneCountryByCode(String(formData.get("phoneCountry") ??"")) ??
  DEFAULT_PHONE_COUNTRY;
 const email = String(formData.get("email") ??"").trim().toLowerCase();
 const termsAccepted = String(formData.get("termsAccepted") ??"") === "accepted";
 const normalizedPhone = normalizePhoneNumber(phone, phoneCountry.code, phoneCountry.dialCode);

 if (!accountName || !password || !phone || !email) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=missing_fields` } });
 }

 if (!EMAIL_PATTERN.test(email)) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=invalid_email` } });
 }

 if (!normalizedPhone) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=invalid_phone` } });
 }

 if (password.length < MIN_PASSWORD_LENGTH) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=weak_password` } });
 }

 if (!termsAccepted) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=terms_required` } });
 }

 try {
 const user = await withTransaction(async (execute) => {
  const role = await getPublicRegistrationRole(execute);
  const created = await registerUser({
   email,
   accountName,
   password,
   role,
  }, execute);

  await execute(
   `
    INSERT INTO user_profiles (user_id, phone, contact_email)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET
     phone = EXCLUDED.phone,
     contact_email = EXCLUDED.contact_email,
     updated_at = NOW()
   `,
   [created.id, normalizedPhone.e164, email]
  );

  return created;
 });
 const token = await createSession(user.id);
 const target = user.role === USER_ROLES.ADMIN ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("users_email_normalized_uidx")) {
  return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=email_taken` } });
 }

 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=register_failed` } });
}
}
