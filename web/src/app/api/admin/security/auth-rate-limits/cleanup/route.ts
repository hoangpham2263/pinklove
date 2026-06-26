import { requireAdmin } from "@/lib/auth";
import { respondError, respondSuccess } from "@/lib/action-response";
import { INTERNAL_API_KEY_HEADER } from "@/lib/api";
import { cleanupExpiredAuthRateLimits } from "@/lib/auth-rate-limit";
import { ROUTES } from "@/lib/routes";
import { getSystemSettings, updateSecuritySettings } from "@/lib/system-settings";

export const runtime = "nodejs";

async function authorizeCleanup(request: Request) {
  const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
  if (expectedSecret && request.headers.get(INTERNAL_API_KEY_HEADER) === expectedSecret) {
    return;
  }

  await requireAdmin();
}

export async function POST(request: Request) {
  await authorizeCleanup(request);

  try {
    const settings = await getSystemSettings();
    const retentionDays = settings.security.authRateLimitCleanup.retentionDays;
    const deletedCount = await cleanupExpiredAuthRateLimits(retentionDays);

    await updateSecuritySettings({
      authRateLimitCleanup: {
        ...settings.security.authRateLimitCleanup,
        lastRunAt: new Date().toISOString(),
        lastDeletedCount: deletedCount,
      },
    });

    return respondSuccess(request, {
      message: `Đã cleanup ${deletedCount} auth rate-limit record hết hạn.`,
      location: ROUTES.ADMIN.SECURITY_SETTINGS_AUTH_RATE_LIMITS,
    });
  } catch (error) {
    console.error("Failed to cleanup auth rate limits:", error);
    return respondError(request, {
      status: 500,
      error: "cleanup_failed",
      message: "Không thể cleanup auth rate limits.",
      location: ROUTES.ADMIN.SECURITY_SETTINGS_AUTH_RATE_LIMITS,
    });
  }
}
