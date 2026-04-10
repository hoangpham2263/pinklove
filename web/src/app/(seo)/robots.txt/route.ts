import { getSiteUrlFromRequest } from "@/lib/seo";
import { buildRobotsContent } from "@/lib/robots";
import { getSystemSettings } from "@/lib/system-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const siteUrl = getSiteUrlFromRequest(request);
  const settings = await getSystemSettings();
  const content = buildRobotsContent(siteUrl, settings);

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
