import Link from "next/link";
import Image from "next/image";
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
  const brandTagline = globalFields.footerBrandTagline?.trim();
  const newsletterPlaceholder = globalFields.footerNewsletterPlaceholder?.trim();
  const copyright = globalFields.footerCopyright?.trim();
  const floatingLinks = socialLinks.slice(0, 3).map((item) => ({
    label: item.label,
    url: item.url,
    icon: getSocialIcon(item.platform),
  }));

  return (
    <>
      <footer className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#f5f5f5]" aria-hidden="true" />
        {footerBackgroundImage ? (
          <img
            src={footerBackgroundImage}
            alt="Footer background"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
          />
        ) : null}
        <div className="relative z-20 container mx-auto px-4 pt-10 lg:pt-15 2xl:pt-20 pb-5 lg:pb-7.5 2xl:pb-10">
          <div className="mx-auto space-y-2.5 lg:space-y-5 flex flex-col items-center">
            {footerBrandImage ? <img src={footerBrandImage} alt="Footer logo" className="h-10 lg:h-12.5 w-auto object-contain" /> : null}
            {brandTagline ? <p className="text-sm lg:text-base">{brandTagline}</p> : null}

            {introItems.length > 0 ? (
              <div className="space-y-2.5 lg:space-y-3">
                {introItems.map((item) => {
                  return (
                    <div key={`${item.label}-${item.value}`} className="flex items-center justify-center gap-x-3">
                      {item.icon ? (
                        <Image src={item.icon} alt={item.label} width={20} height={20} className="size-7.5 object-cover" />
                      ) : null}
                      <p className="text-sm md:text-base">
                        <span className="font-semibold">{item.label}:</span>{" "}
                        {item.href ? (
                          <a href={item.href} className="hover:text-guest-primary transition">{item.value}</a>
                        ) : (
                          <span>{item.value}</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        <div className="relative flex flex-col gap-5 lg:gap-7.5 pt-10 lg:pt-15 2xl:pt-20 pb-5 lg:pb-7.5 2xl:pb-10">
          <div className="absolute inset-0 z-0 bg-linear-to-b from-[#FFD1F7] to-[#fefcff]" aria-hidden="true" />
          <div className="relative z-20 container mx-auto px-4 grid grid-cols-12 gap-10">
              <div className="col-span-12 md:col-span-3 space-y-4">
                <h3 className="w-fit text-base md:text-lg lg:text-xl 2xl:text-2xl font-semibold bg-[linear-gradient(90deg,#3B2A33_0%,#B86A8A_50%,#4A2D38_100%)] bg-no-repeat bg-clip-text text-transparent">
                  Dịch vụ
                </h3>
                <div className="flex flex-col gap-3">
                  {serviceLinks.map((item) => renderFooterLink(item, "text-sm md:text-base transition"))}
                </div>
              </div>

              <div className="col-span-12 md:col-span-3 space-y-4">
                <h3 className="w-fit text-base md:text-lg lg:text-xl 2xl:text-2xl font-semibold bg-[linear-gradient(90deg,#3B2A33_0%,#B86A8A_50%,#4A2D38_100%)] bg-no-repeat bg-clip-text text-transparent">
                  Liên kết nhanh
                </h3>
                <div className="flex flex-col gap-3">
                  {quickLinks.map((item) => renderFooterLink(item, "text-sm md:text-base transition"))}
                </div>
              </div>

              <div className="col-span-12 md:col-span-3 space-y-4">
                <h3 className="w-fit text-base md:text-lg lg:text-xl 2xl:text-2xl font-semibold bg-[linear-gradient(90deg,#3B2A33_0%,#B86A8A_50%,#4A2D38_100%)] bg-no-repeat bg-clip-text text-transparent">
                  Đối tác
                </h3>
                <div className="flex flex-col gap-3">
                  {partnerLinks.map((item) => renderFooterLink(item, "text-sm md:text-base transition"))}
                </div>
              </div>

              <div className="col-span-12 md:col-span-3 space-y-5">
                <h3 className="w-fit text-base md:text-lg lg:text-xl 2xl:text-2xl font-semibold bg-[linear-gradient(90deg,#3B2A33_0%,#B86A8A_50%,#4A2D38_100%)] bg-no-repeat bg-clip-text text-transparent">
                  Liên hệ
                </h3>
                <div className="flex items-center overflow-hidden rounded-full border border-guest-primary pl-5">
                  <input
                    type="email"
                    placeholder={newsletterPlaceholder}
                    className="h-12 flex-1 bg-transparent text-sm outline-none"
                    aria-label="Email liên hệ"
                  />
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-guest-primary transition hover:bg-guest-primary/80"
                    aria-label="Gửi email"
                  >
                    <CircleArrowRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => {
                    const Icon = getSocialIcon(item.platform);

                    return (
                      <a
                        key={`${item.label}-${item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
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
          <div className="relative z-20 text-center text-sm">{copyright ? <p>{copyright}</p> : null}</div>
        </div>
      </footer>

      <div className="fixed right-4 bottom-5 z-40 flex flex-col gap-3">
        {floatingLinks.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={`${item.label}-${item.url}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
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
