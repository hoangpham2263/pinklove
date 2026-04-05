import"server-only";

export type GoogleUserInfo = {
 sub: string;
 email: string;
 name?: string;
};

function getGoogleEnv() {
 const clientId = process.env.GOOGLE_CLIENT_ID;
 const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
 const redirectUri = process.env.GOOGLE_REDIRECT_URI;

 if (!clientId || !clientSecret || !redirectUri) {
 throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
 }

 return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(state: string): string {
 const { clientId, redirectUri } = getGoogleEnv();
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
 const { clientId, clientSecret, redirectUri } = getGoogleEnv();

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
