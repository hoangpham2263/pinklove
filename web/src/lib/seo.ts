import { headers } from "next/headers";
import type { Metadata } from "next";
import { getSystemSettings } from "@/lib/system-settings";

const DEFAULT_SITE_NAME = "PinkLove";
const DEFAULT_TITLE = "PinkLove";
const DEFAULT_DESCRIPTION = "Thiệp cưới online, blog cưới, công cụ cưới và builder tạo thiệp tối ưu cho trải nghiệm chia sẻ.";

export function getSiteUrl() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!value) {
    return "http://127.0.0.1:3000";
  }

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export function getSiteUrlFromHeaderValues({
  host,
  forwardedHost,
  forwardedProto,
}: {
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}) {
  const resolvedHost = forwardedHost?.trim() || host?.trim();

  if (resolvedHost) {
    return `${forwardedProto?.trim() || "https"}://${resolvedHost}`;
  }

  return getSiteUrl();
}

export function getSiteUrlFromRequest(request: Request) {
  return getSiteUrlFromHeaderValues({
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  });
}

export async function getCurrentSiteUrl() {
  try {
    const headerStore = await headers();
    return getSiteUrlFromHeaderValues({
      host: headerStore.get("host"),
      forwardedHost: headerStore.get("x-forwarded-host"),
      forwardedProto: headerStore.get("x-forwarded-proto"),
    });
  } catch {
    return getSiteUrl();
  }
}

export function absoluteUrl(path = "/", baseUrl = getSiteUrl()) {
  return new URL(path, baseUrl).toString();
}

function resolveMetadataImageUrl(image: string | undefined, baseUrl: string) {
  const trimmed = image?.trim();
  if (!trimmed) {
    return undefined;
  }

  return absoluteUrl(trimmed, baseUrl);
}

type SeoMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export async function createSeoMetadata({
  title,
  description,
  path = "/",
  keywords,
  image,
  type = "website",
  noindex = false,
}: SeoMetadataInput): Promise<Metadata> {
  const settings = await getSystemSettings();
  const siteUrl = await getCurrentSiteUrl();
  const url = absoluteUrl(path, siteUrl);
  const imageUrl = resolveMetadataImageUrl(image || settings.opengraph.defaultImage, siteUrl);
  const canIndex = settings.indexing.siteIndexingEnabled && !noindex;
  const ogTitle = title || settings.opengraph.defaultTitle || DEFAULT_TITLE;
  const ogDescription = description || settings.opengraph.defaultDescription || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: canIndex,
      follow: canIndex,
    },
    openGraph: {
      type,
      url,
      title: ogTitle,
      description: ogDescription,
      siteName: settings.branding.siteName || DEFAULT_SITE_NAME,
      locale: settings.opengraph.locale || "vi_VN",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? settings.opengraph.twitterCard : "summary",
      title: ogTitle,
      description: ogDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export async function createRootMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const siteUrl = await getCurrentSiteUrl();
  const canIndex = settings.indexing.siteIndexingEnabled;
  const defaultImage = resolveMetadataImageUrl(settings.opengraph.defaultImage, siteUrl);
  const faviconUrl = resolveMetadataImageUrl(settings.favicon.siteFavicon, siteUrl);
  const appleTouchIconUrl = resolveMetadataImageUrl(settings.favicon.appleTouchIcon, siteUrl);
  const defaultTitle = settings.opengraph.defaultTitle || DEFAULT_TITLE;
  const defaultDescription = settings.opengraph.defaultDescription || DEFAULT_DESCRIPTION;
  const siteName = settings.branding.siteName || DEFAULT_SITE_NAME;
  const locale = settings.opengraph.locale || "vi_VN";

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    alternates: {
      canonical: absoluteUrl("/", siteUrl),
    },
    icons: {
      icon: faviconUrl ? [{ url: faviconUrl }] : undefined,
      shortcut: faviconUrl ? [{ url: faviconUrl }] : undefined,
      apple: appleTouchIconUrl ? [{ url: appleTouchIconUrl }] : undefined,
    },
    openGraph: {
      type: "website",
      url: absoluteUrl("/", siteUrl),
      title: defaultTitle,
      description: defaultDescription,
      siteName,
      locale,
      images: defaultImage ? [{ url: defaultImage }] : undefined,
    },
    twitter: {
      card: defaultImage ? settings.opengraph.twitterCard : "summary",
      title: defaultTitle,
      description: defaultDescription,
      images: defaultImage ? [defaultImage] : undefined,
    },
    robots: {
      index: canIndex,
      follow: canIndex,
      googleBot: {
        index: canIndex,
        follow: canIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "wedding",
  };
}
