import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Offering } from "@/features/offerings/types";
import type {
  LandingPageNavLink,
  LandingPage,
  LandingPageSection,
} from "@/features/landing-pages/types";
import { formatVnd } from "@/lib/currency";
import { getOfferingPath } from "@/lib/public-paths";

export type LandingPageTemplateProps = {
  offering: Offering;
  landingPage: LandingPage;
  sections: LandingPageSection[];
};

export function ProductImage({ offering, className = "aspect-[4/5]" }: { offering: Offering; className?: string }) {
  if (!offering.thumbnailUrl) {
    return <div className={`${className} flex items-center justify-center bg-stone-100 text-sm text-stone-400`}>No image</div>;
  }

  return (
    <Image
      src={offering.thumbnailUrl}
      alt={offering.name}
      width={1400}
      height={1600}
      className={`${className} w-full object-cover`}
      priority
    />
  );
}

export function PriceLine({ offering, className = "" }: { offering: Offering; className?: string }) {
  return <p className={`text-3xl font-semibold ${className}`}>{formatVnd(offering.price)}</p>;
}

export function LandingPageCta({
  offering,
  label = "Thêm vào giỏ",
  className = "bg-stone-950 text-white hover:bg-stone-800",
}: {
  offering: Offering;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={`${getOfferingPath(offering)}#checkout`}
      className={`inline-flex h-12 items-center justify-center px-6 text-sm font-semibold transition ${className}`}
    >
      {label}
    </Link>
  );
}

export function getSectionContent(
  sections: LandingPageSection[],
  sectionType: LandingPageSection["sectionType"],
  index = 0
) {
  return sections.filter((section) => section.sectionType === sectionType)[index]?.content ?? {};
}

export function getContentString(content: Record<string, unknown>, key: string, fallback: string) {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function getContentStringArray(content: Record<string, unknown>, key: string, fallback: string[]) {
  const value = content[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : fallback;
}

function getLandingLinks(value: unknown): LandingPageNavLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const href = typeof record.href === "string" ? record.href.trim() : "";
    return label && href ? [{ label, href }] : [];
  });
}

function getThemeContent(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getThemeText(content: Record<string, unknown>, key: string, fallback = "") {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function LandingLinks({ links, className = "" }: { links: LandingPageNavLink[]; className?: string }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <nav className={className}>
      {links.map((link, index) => (
        <Link key={`${link.href}-${index}`} href={link.href}>{link.label}</Link>
      ))}
    </nav>
  );
}

function LandingHeader({
  offering,
  landingPage,
}: {
  offering: Offering;
  landingPage: LandingPage;
}) {
  const content = getThemeContent(landingPage.themeConfig.header);
  if (content.hidden === true) {
    return null;
  }

  const links = getLandingLinks(content.links);
  const brandLabel = getThemeText(content, "brandLabel", "PinkLove");
  const brandHref = getThemeText(content, "brandHref", "/");
  const ctaLabel = getThemeText(content, "ctaLabel");
  const ctaHref = getThemeText(content, "ctaHref", `${getOfferingPath(offering)}#checkout`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 border border-stone-200 bg-white/90 px-5 py-3 text-stone-950 shadow-[0_14px_45px_rgba(15,23,42,0.08)] backdrop-blur">
        <Link href={brandHref} className="shrink-0 text-sm font-semibold uppercase tracking-[0.22em]">
          {brandLabel}
        </Link>
        <LandingLinks links={links} className="hidden items-center gap-6 text-sm text-stone-600 md:flex" />
        {ctaLabel ? (
          <Link href={ctaHref} className="inline-flex h-10 shrink-0 items-center bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function LandingFooter({
  offering,
  landingPage,
}: {
  offering: Offering;
  landingPage: LandingPage;
}) {
  const content = getThemeContent(landingPage.themeConfig.footer);
  if (content.hidden === true) {
    return null;
  }

  const title = getThemeText(content, "title", offering.name);
  const description = getThemeText(content, "description");
  const copyright = getThemeText(content, "copyright", `PinkLove · ${offering.name}`);
  const links = getLandingLinks(content.links);

  return (
    <footer className="bg-stone-950 px-5 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">{description}</p> : null}
        </div>
        <LandingLinks links={links} className="grid content-start gap-2 text-sm text-white/70 sm:grid-cols-2 sm:gap-x-8" />
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5 text-xs text-white/45">{copyright}</p>
    </footer>
  );
}

export function LandingPageFrame({
  offering,
  landingPage,
  className,
  children,
}: {
  offering: Offering;
  landingPage: LandingPage;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-standalone-landing-page="true" className={className}>
      <LandingHeader offering={offering} landingPage={landingPage} />
      {children}
      <LandingFooter offering={offering} landingPage={landingPage} />
    </div>
  );
}
