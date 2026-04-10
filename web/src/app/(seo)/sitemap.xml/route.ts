import { getSiteUrlFromRequest } from "@/lib/seo";
import { getEnabledSitemapIndexItems, renderSitemapIndex } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const siteUrl = getSiteUrlFromRequest(request);
  const items = await getEnabledSitemapIndexItems(siteUrl);
  const xml = renderSitemapIndex(items);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
