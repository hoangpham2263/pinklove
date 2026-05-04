import"server-only";

import { getSystemSettings } from "@/lib/system-settings";

export type GoogleUserInfo = {
 sub: string;
 email: string;
 name?: string;
};

async function getGoogleConfig() {
 const settings = await getSystemSettings();
 const google = settings.thirdParty.googleOAuth;
 const clientId = google.clientId;
 const clientSecret = google.clientSecret;
 const redirectUri = google.redirectUri;

 if (!google.enabled || !clientId || !clientSecret || !redirectUri) {
 throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
 }

 return { clientId, clientSecret, redirectUri };
}

export async function buildGoogleAuthUrl(state: string): Promise<string> {
 const { clientId, redirectUri } = await getGoogleConfig();
 const params = new URLSearchParams({
 client_id: clientId,
 redirect_uri: redirectUri,
 response_type:"code",
 scope:"openid email profile",
 access_type:"offline",
 prompt:"consent",
 state,
 });

 return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForGoogleUser(code: string): Promise<GoogleUserInfo> {
 const { clientId, clientSecret, redirectUri } = await getGoogleConfig();

 const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
 method:"POST",
 headers: {"Content-Type":"application/x-www-form-urlencoded" },
 body: new URLSearchParams({
  code,
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uri: redirectUri,
  grant_type:"authorization_code",
 }),
 });

 if (!tokenResponse.ok) {
 throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
 }

 const tokenData = (await tokenResponse.json()) as { access_token?: string };
 if (!tokenData.access_token) {
 throw new Error("GOOGLE_ACCESS_TOKEN_MISSING");
 }

 const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
 headers: {
  Authorization: `Bearer ${tokenData.access_token}`,
 },
 });

 if (!userResponse.ok) {
 throw new Error("GOOGLE_USERINFO_FAILED");
 }

 const userInfo = (await userResponse.json()) as GoogleUserInfo;
 if (!userInfo.sub || !userInfo.email) {
 throw new Error("GOOGLE_USERINFO_INVALID");
 }

 return userInfo;
}
