import type { Metadata } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_SITE_NAME = "PinkLove";
const DEFAULT_TITLE = "PinkLove";
const DEFAULT_DESCRIPTION = "Thiệp cưới online, blog cưới, công cụ cưới và builder tạo thiệp tối ưu cho trải nghiệm chia sẻ.";

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return value || DEFAULT_SITE_URL;
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
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

export function createSeoMetadata({
  title,
  description,
  path = "/",
  keywords,
  image,
  type = "website",
  noindex = false,
}: SeoMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
    },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: DEFAULT_SITE_NAME,
      locale: "vi_VN",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function createRootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: DEFAULT_SITE_NAME,
    title: {
      default: DEFAULT_TITLE,
      template: `%s | ${DEFAULT_SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    alternates: {
      canonical: absoluteUrl("/"),
    },
    openGraph: {
      type: "website",
      url: absoluteUrl("/"),
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      siteName: DEFAULT_SITE_NAME,
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "wedding",
  };
}
