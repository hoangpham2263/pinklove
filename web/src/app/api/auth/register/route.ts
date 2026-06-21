import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { query } from "@/lib/database";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import {
 DEFAULT_PHONE_COUNTRY,
 getPhoneCountryByCode,
} from "@/features/auth/phone-countries";

import {
 countUsers,
 createSession,
 getSessionCookieOptions,
 isAdminRole,
 registerUser,
 SESSION_COOKIE_NAME,
 USER_ROLES,
} from"@/lib/auth";

export const runtime ="nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
 const formData = await request.formData();
 const username = String(formData.get("username") ??"").trim();
 const password = String(formData.get("password") ??"");
 const phone = String(formData.get("phone") ??"").trim();
 const phoneCountry =
  getPhoneCountryByCode(String(formData.get("phoneCountry") ??"")) ??
  DEFAULT_PHONE_COUNTRY;
 const email = String(formData.get("email") ??"").trim().toLowerCase();
 const termsAccepted = String(formData.get("termsAccepted") ??"") === "accepted";

 if (!username || !password || !phone || !email) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=missing_fields` } });
 }

 if (!EMAIL_PATTERN.test(email)) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=invalid_email` } });
 }

 if (password.length < MIN_PASSWORD_LENGTH) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=weak_password` } });
 }

 if (!termsAccepted) {
 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=terms_required` } });
 }

 try {
 const totalUsers = await countUsers();
 const role = totalUsers === 0 ? USER_ROLES.ADMIN : USER_ROLES.CUSTOMER;
 const user = await registerUser(username, password, role);
 await query(
  `
   INSERT INTO user_profiles (user_id, phone, contact_email)
   VALUES ($1, $2, $3)
   ON CONFLICT (user_id)
   DO UPDATE SET
    phone = EXCLUDED.phone,
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW()
  `,
  [user.id, `${phoneCountry.dialCode} ${phone}`, email]
 );
 const token = await createSession(user.id);
 const target = isAdminRole(user.role) ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 const message = error instanceof Error ? error.message :"";
 if (message.includes("duplicate key value")) {
  return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=username_taken` } });
 }

 return new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=register_failed` } });
}
}
