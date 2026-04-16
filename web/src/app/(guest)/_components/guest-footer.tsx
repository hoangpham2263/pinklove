import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media-resolver";
import {
  ArrowUp,
  Camera,
  CircleArrowRight,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Send,
} from "lucide-react";
type FooterRepeaterLink = {
  label?: string;
  url?: string;
};

type FooterIntroItem = {
  icon?: string;
  label?: string;
  value?: string;
  href?: string;
};

type FooterSocialLink = FooterRepeaterLink & {
  platform?: string;
};

type GuestFooterGlobalFields = {
  footerBackgroundImage?: string;
  footerBrandImage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  zaloUrl?: string;
  footerBrandTagline?: string;
  footerNewsletterPlaceholder?: string;
  footerCopyright?: string;
  footerIntroItems?: FooterIntroItem[];
  footerServiceLinks?: FooterRepeaterLink[];
  footerQuickLinks?: FooterRepeaterLink[];
  footerPartnerLinks?: FooterRepeaterLink[];
  footerSocialLinks?: FooterSocialLink[];
};

type GuestFooterProps = {
  globalFields: GuestFooterGlobalFields;
};

function normalizeLinks(items: FooterRepeaterLink[] | undefined) {
  return (Array.isArray(items) ? items : []).filter((item) => item.label?.trim() && item.url?.trim()).map((item) => ({
    label: item.label!.trim(),
    url: item.url!.trim(),
  }));
}

function normalizeSocialLinks(items: FooterSocialLink[] | undefined) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item.label?.trim() && item.url?.trim())
    .map((item) => ({
      label: item.label!.trim(),
      url: item.url!.trim(),
      platform: item.platform?.trim() || item.label!.trim(),
    }));
}

async function normalizeIntroItems(items: FooterIntroItem[] | undefined) {
  return Promise.all(
    (Array.isArray(items) ? items : [])
      .filter((item) => item.label?.trim() && item.value?.trim())
      .map(async (item) => ({
        icon: await resolveMediaUrl(item.icon),
        label: item.label!.trim(),
        value: item.value!.trim(),
        href: item.href?.trim() || "",
      }))
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function renderFooterLink(item: { label: string; url: string }, className: string) {
  if (isExternalHref(item.url)) {
    return (
      <a key={`${item.label}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className={className}>
        {item.label}
      </a>
    );
  }

  return (
    <Link key={`${item.label}-${item.url}`} href={item.url} className={className}>
      {item.label}
    </Link>
  );
}

function getSocialIcon(platformOrLabel: string) {
  const value = platformOrLabel.toLowerCase();

  if (value.includes("facebook")) return Globe;
  if (value.includes("instagram")) return Camera;
  if (value.includes("youtube")) return Play;
  if (value.includes("messenger")) return MessageCircle;
  if (value.includes("mail") || value.includes("email")) return Mail;
  if (value.includes("zalo")) return MessageCircle;
  if (value.includes("phone") || value.includes("hotline") || value.includes("call")) return Phone;

  return Send;
}

export async function GuestFooter({
  globalFields,
}: GuestFooterProps) {
  const footerBackgroundImage = await resolveMediaUrl(globalFields.footerBackgroundImage);
  const footerBrandImage = await resolveMediaUrl(globalFields.footerBrandImage);
  const introItems = await normalizeIntroItems(globalFields.footerIntroItems);
  const serviceLinks = normalizeLinks(globalFields.footerServiceLinks);
  const quickLinks = normalizeLinks(globalFields.footerQuickLinks);
  const partnerLinks = normalizeLinks(globalFields.footerPartnerLinks);
  const socialLinks = normalizeSocialLinks(globalFields.footerSocialLinks);

  const fallbackSocialLinks = [
    globalFields.facebookUrl ? { label: "Facebook", url: globalFields.facebookUrl.trim(), platform: "facebook" } : null,
    globalFields.instagramUrl ? { label: "Instagram", url: globalFields.instagramUrl.trim(), platform: "instagram" } : null,
    globalFields.zaloUrl ? { label: "Zalo", url: globalFields.zaloUrl.trim(), platform: "zalo" } : null,
  ].filter((item): item is { label: string; url: string; platform: string } => Boolean(item));

  const activeSocialLinks = socialLinks.length > 0 ? socialLinks : fallbackSocialLinks;
  const brandTagline = globalFields.footerBrandTagline?.trim() || "Thiết kế Web/App - Graphic design";
  const newsletterPlaceholder = globalFields.footerNewsletterPlaceholder?.trim() || "Nhập Email của bạn...";
  const copyright = globalFields.footerCopyright?.trim() || "Copyright © 2026. All rights reserved.";
  const floatingLinks = activeSocialLinks.slice(0, 3).map((item) => ({
    label: item.label,
    url: item.url,
    icon: getSocialIcon(item.platform),
  }));

  return (
    <>
      <footer className="relative mt-auto overflow-hidden border-t border-emerald-400/15 bg-[#1e1f20] text-white">
        {footerBackgroundImage ? (
          <img src={footerBackgroundImage} alt="Footer background" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}

        <div className="container relative mx-auto space-y-12 px-4 py-10 lg:py-14">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            {footerBrandImage ? (
              <div className="inline-flex flex-col items-center gap-3">
                <img src={footerBrandImage} alt="Footer logo" className="h-12 w-auto max-w-40 object-contain" />
                <p className="text-sm">{brandTagline}</p>
              </div>
            ) : globalFields.footerBrandTagline?.trim() ? (
              <p className="text-sm">{brandTagline}</p>
            ) : null}

            {introItems.length > 0 ? (
              <div className="space-y-5 pt-2 text-left sm:mx-auto sm:max-w-2xl">
                {introItems.map((item) => {
                  const content = (
                    <>
                      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/20 bg-white/6">
                        {item.icon ? (
                          <img src={item.icon} alt={item.label} className="h-4 w-4 object-contain" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </span>
                      <p className="text-sm leading-7 md:text-base">
                        <span className="font-semibold">{item.label}:</span>{" "}
                        <span>{item.value}</span>
                      </p>
                    </>
                  );

                  return item.href ? (
                    <a key={`${item.label}-${item.value}`} href={item.href} className="flex items-start gap-4">
                      {content}
                    </a>
                  ) : (
                    <div key={`${item.label}-${item.value}`} className="flex items-start gap-4">
                      {content}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="grid gap-10 border-t border-white/8 pt-10 lg:grid-cols-[1.05fr_1fr_1fr_1.1fr]">
            <div className="space-y-4">
              <h3 className="text-3xl font-semibold">Dịch vụ</h3>
              <div className="flex flex-col gap-3">
                {serviceLinks.length > 0 ? serviceLinks.map((item) => renderFooterLink(item, "text-sm transition md:text-base")) : (
                  <span className="text-sm md:text-base">Chưa cấu hình link dịch vụ.</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-semibold">Liên kết nhanh</h3>
              <div className="flex flex-col gap-3">
                {quickLinks.length > 0 ? quickLinks.map((item) => renderFooterLink(item, "text-sm transition md:text-base")) : (
                  <span className="text-sm md:text-base">Chưa cấu hình quick links.</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-semibold">Đối tác</h3>
              <div className="flex flex-col gap-3">
                {partnerLinks.length > 0 ? partnerLinks.map((item) => renderFooterLink(item, "text-sm transition md:text-base")) : (
                  <span className="text-sm md:text-base">Chưa cấu hình link đối tác.</span>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-3xl font-semibold">Liên hệ</h3>
              <div className="flex items-center overflow-hidden rounded-full border border-white/12 bg-white/6 pl-5">
                <input
                  type="email"
                  placeholder={newsletterPlaceholder}
                  className="h-12 flex-1 bg-transparent text-sm outline-none"
                  aria-label="Email liên hệ"
                />
                <button
                  type="button"
                  className="flex h-12 w-14 items-center justify-center rounded-full bg-emerald-300 transition hover:bg-emerald-200"
                  aria-label="Gửi email"
                >
                  <CircleArrowRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {activeSocialLinks.map((item) => {
                  const Icon = getSocialIcon(item.platform);

                  return (
                    <a
                      key={`${item.label}-${item.url}`}
                      href={item.url}
                      target={isExternalHref(item.url) ? "_blank" : undefined}
                      rel={isExternalHref(item.url) ? "noreferrer" : undefined}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 transition hover:-translate-y-0.5 hover:bg-white/10"
                      aria-label={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 pt-6 text-center text-sm">
            <p>{copyright}</p>
          </div>
        </div>
      </footer>

      <div className="fixed right-4 bottom-5 z-40 flex flex-col gap-3">
        {floatingLinks.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={`${item.label}-${item.url}`}
              href={item.url}
              target={isExternalHref(item.url) ? "_blank" : undefined}
              rel={isExternalHref(item.url) ? "noreferrer" : undefined}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200/30 bg-[radial-gradient(circle_at_30%_30%,#93f5c6_0%,#69daa8_44%,#2a6b56_100%)] text-white shadow-[0_10px_28px_rgba(42,107,86,0.45)] transition hover:-translate-y-0.5"
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}
        <a
          href="#top"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200/30 bg-[radial-gradient(circle_at_30%_30%,#93f5c6_0%,#69daa8_44%,#2a6b56_100%)] text-white shadow-[0_10px_28px_rgba(42,107,86,0.45)] transition hover:-translate-y-0.5"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="h-5 w-5" />
        </a>
      </div>
    </>
  );
}
