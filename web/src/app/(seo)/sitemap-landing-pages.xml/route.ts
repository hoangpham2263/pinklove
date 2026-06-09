import { getSiteUrlFromRequest } from "@/lib/seo";
import { getSitemapItemsByKey, renderSitemapUrlSet } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const siteUrl = getSiteUrlFromRequest(request);
  const xml = renderSitemapUrlSet(await getSitemapItemsByKey("landing-pages", siteUrl));

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
