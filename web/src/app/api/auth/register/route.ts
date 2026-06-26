import { NextResponse } from"next/server";
import { ROUTES } from "@/lib/routes";
import { withTransaction } from "@/lib/database";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/constants";
import {
 DEFAULT_PHONE_COUNTRY,
 getPhoneCountryByCode,
} from "@/features/auth/phone-countries";
import { normalizePhoneNumber } from "@/features/auth/phone-number";
import { AuthCsrfError, verifyAuthCsrfToken } from "@/lib/auth-csrf";
import { AuthRateLimitError, getRequestIp, recordAuthRateLimit } from "@/lib/auth-rate-limit";
import { recordSecurityEvent } from "@/lib/security-events";

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

function redirectRegisterError(error: string) {
 const response = new NextResponse(null, { status: 303, headers: { Location: `${ROUTES.AUTH.REGISTER}?error=${error}` } });
 const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
 response.headers.append(
  "Set-Cookie",
  `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`
 );
 return response;
}

function isAccountUniquenessError(message: string) {
 return message.includes("users_email_normalized_uidx") || message.includes("user_profiles_phone_normalized_uidx");
}

export async function POST(request: Request) {
 const formData = await request.formData();
 const accountName = String(formData.get("accountName") ??"").trim();
 const password = String(formData.get("password") ??"");
 const phone = String(formData.get("phone") ??"").trim();
 const csrfToken = String(formData.get("csrfToken") ?? "");
 const phoneCountry =
  getPhoneCountryByCode(String(formData.get("phoneCountry") ??"")) ??
  DEFAULT_PHONE_COUNTRY;
 const email = String(formData.get("email") ??"").trim().toLowerCase();
 const termsAccepted = String(formData.get("termsAccepted") ??"") === "accepted";
 const normalizedPhone = normalizePhoneNumber(phone, phoneCountry.code, phoneCountry.dialCode);

 if (!accountName || !password || !phone || !email) {
 await recordSecurityEvent({
  request,
  eventType: "register_failed",
  severity: "warn",
  status: 303,
  metadata: { reason: "missing_fields" },
 });
 return redirectRegisterError("missing_fields");
 }

 if (!EMAIL_PATTERN.test(email)) {
 await recordSecurityEvent({
  request,
  eventType: "register_failed",
  severity: "warn",
  status: 303,
  metadata: { reason: "invalid_email" },
 });
 return redirectRegisterError("invalid_email");
 }

 if (!normalizedPhone) {
 await recordSecurityEvent({
  request,
  eventType: "register_failed",
  severity: "warn",
  status: 303,
  metadata: { reason: "invalid_phone" },
 });
 return redirectRegisterError("invalid_phone");
 }

 if (password.length < MIN_PASSWORD_LENGTH) {
 await recordSecurityEvent({
  request,
  eventType: "register_failed",
  severity: "warn",
  status: 303,
  metadata: { reason: "weak_password" },
 });
 return redirectRegisterError("weak_password");
 }

 if (!termsAccepted) {
 await recordSecurityEvent({
  request,
  eventType: "register_failed",
  severity: "warn",
  status: 303,
  metadata: { reason: "terms_required" },
 });
 return redirectRegisterError("terms_required");
 }

 try {
 await verifyAuthCsrfToken("register", csrfToken);

 await recordAuthRateLimit("register:ip", getRequestIp(request));
 await recordAuthRateLimit("register:email", email);
 await recordAuthRateLimit("register:phone", normalizedPhone.e164);

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
 await recordSecurityEvent({
  request,
  eventType: "register_success",
  status: 303,
  userId: user.id,
  metadata: { role: user.role },
 });
 const token = await createSession(user.id);
 const target = user.role === USER_ROLES.ADMIN ? ROUTES.ADMIN.DASHBOARD : ROUTES.CUSTOMER.DASHBOARD;
 const response = new NextResponse(null, { status: 303, headers: { Location: target } });
 response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
 return response;
 } catch (error) {
 if (error instanceof AuthCsrfError) {
  await recordSecurityEvent({
   request,
   eventType: "csrf_failed",
   severity: "warn",
   status: 303,
   metadata: { scope: "register" },
  });
  return redirectRegisterError("register_failed");
 }

 if (error instanceof AuthRateLimitError) {
  await recordSecurityEvent({
   request,
   eventType: "rate_limited",
   severity: "warn",
   status: 303,
   metadata: { scope: "register" },
  });
  return redirectRegisterError("rate_limited");
 }

 const message = error instanceof Error ? error.message :"";
 if (isAccountUniquenessError(message)) {
  await recordSecurityEvent({
   request,
   eventType: "register_failed",
   severity: "warn",
   status: 303,
   metadata: { reason: "account_exists" },
  });
  return redirectRegisterError("account_exists");
 }

 await recordSecurityEvent({
  request,
  eventType: "register_failed",
  severity: "warn",
  status: 303,
  metadata: { reason: "register_failed" },
 });
 return redirectRegisterError("register_failed");
}
}
