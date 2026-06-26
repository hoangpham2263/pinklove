import Link from "next/link";
import Image from "next/image";
import { GuestPinkCloud } from "@/app/user-site/_components/guest-pinkcloud";
import { resolveMediaUrl } from "@/lib/media-resolver";
import {
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

type PinkCloudMessageItem = {
  message?: string;
};

type GuestFooterGlobalFields = {
  footerBrandImage?: string;
  footerBrandAlt?: string;
  footerBrandTagline?: string;
  footerContactTitle?: string;
  footerNewsletterPlaceholder?: string;
  footerNewsletterAriaLabel?: string;
  footerNewsletterSubmitLabel?: string;
  footerCopyright?: string;
  footerIntroItems?: FooterIntroItem[];
  footerSocialLinks?: FooterSocialLink[];
  pinkCloudMessages?: PinkCloudMessageItem[];
  footerScrollTopLabel?: string;
};

type GuestFooterProps = {
  globalFields: GuestFooterGlobalFields;
  columns: Array<{
    id: string;
    title: string;
    links: Array<{ label: string; url: string }>;
  }>;
};

function normalizeSocialLinks(items: FooterSocialLink[] | undefined) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item.label?.trim() && item.url?.trim())
    .map((item) => ({
      label: item.label!.trim(),
      url: normalizeActionUrl(item.url!.trim()),
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

function normalizePinkCloudMessages(items: PinkCloudMessageItem[] | undefined) {
  return (Array.isArray(items) ? items : [])
    .map((item) => item.message?.trim() || "")
    .filter(Boolean);
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function normalizeActionUrl(href: string) {
  if (/^(https?:\/\/|mailto:|tel:|sms:|#|\/)/i.test(href)) {
    return href;
  }

  return `https://${href}`;
}

function renderFooterLink(item: { label: string; url: string }, className: string) {
  if (!isInternalHref(item.url)) {
    return (
      <a
        key={`${item.label}-${item.url}`}
        href={item.url}
        target={/^https?:\/\//.test(item.url) ? "_blank" : undefined}
        rel={/^https?:\/\//.test(item.url) ? "noreferrer" : undefined}
        className={className}
      >
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

function ScrollToTopButton({ label }: { label?: string }) {
  if (!label) {
    return null;
  }

  return (
    <a
      href="#top"
      className="flex h-12 w-12 items-center justify-center text-guest-primary transition hover:-translate-y-0.5"
      aria-label={label}
    >
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <g stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="19" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v10m0-10c-.561 0-.989.438-1.843 1.314L8.5 4.97M12 2c.563 0 .99.438 1.844 1.314l1.657 1.656" />
        </g>
      </svg>
    </a>
  );
}

function FooterCloudlet({
  x,
  y,
  scale = 1,
  delay = "0s",
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="footer-cloudlet" style={{ animationDelay: delay }}>
        <ellipse cx="0" cy="24" rx="54" ry="10" fill="#B529AA" opacity="0.08" filter="url(#footer-cloud-blur)" />
        <circle cx="-34" cy="0" r="24" fill="url(#footer-cloud-fill)" />
        <circle cx="-8" cy="-16" r="28" fill="url(#footer-cloud-fill)" />
        <circle cx="22" cy="-2" r="25" fill="url(#footer-cloud-fill)" />
        <circle cx="-14" cy="8" r="30" fill="url(#footer-cloud-fill)" />
        <ellipse cx="18" cy="9" rx="36" ry="22" fill="url(#footer-cloud-fill)" />
        <ellipse cx="-10" cy="-18" rx="20" ry="7" fill="#FFFFFF" opacity="0.22" filter="url(#footer-cloud-blur)" />
        <ellipse cx="-34" cy="-4" rx="12" ry="5" fill="#FFFFFF" opacity="0.24" filter="url(#footer-cloud-blur)" />
      </g>
    </g>
  );
}

function FooterSparkle({
  x,
  y,
  size,
  delay = "0s",
}: {
  x: number;
  y: number;
  size: number;
  delay?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="footer-cloud-sparkle" style={{ animationDelay: delay }}>
        <path
          d={`M0 ${-size}C${size * 0.18} ${-size * 0.28} ${size * 0.28} ${-size * 0.18} ${size} 0C${size * 0.28} ${size * 0.18} ${size * 0.18} ${size * 0.28} 0 ${size}C${-size * 0.18} ${size * 0.28} ${-size * 0.28} ${size * 0.18} ${-size} 0C${-size * 0.28} ${-size * 0.18} ${-size * 0.18} ${-size * 0.28} 0 ${-size}Z`}
          fill="url(#footer-sparkle-fill)"
        />
      </g>
    </g>
  );
}

function FooterHeart({
  x,
  y,
  size,
  delay = "0s",
}: {
  x: number;
  y: number;
  size: number;
  delay?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 24})`}>
      <g className="footer-cloud-heart" style={{ animationDelay: delay }}>
        <path
          d="M0 18C-16 7 -20 -5 -12 -13C-6 -19 2 -15 0 -7C-2 -15 6 -19 12 -13C20 -5 16 7 0 18Z"
          fill="url(#footer-heart-fill)"
        />
      </g>
    </g>
  );
}

function FooterBubble({
  x,
  y,
  size,
  delay = "0s",
}: {
  x: number;
  y: number;
  size: number;
  delay?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="footer-cloud-bubble" style={{ animationDelay: delay }}>
        <circle r={size} fill="url(#footer-bubble-fill)" />
        <circle cx={-size * 0.32} cy={-size * 0.34} r={size * 0.28} fill="#FFFFFF" opacity="0.34" />
      </g>
    </g>
  );
}

function FooterCrescent({
  x,
  y,
  size,
  delay = "0s",
}: {
  x: number;
  y: number;
  size: number;
  delay?: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="footer-cloud-crescent" style={{ animationDelay: delay }}>
        <path d={`M${size * 0.64} ${-size * 0.86}C${size * 0.06} ${-size * 0.64} ${-size * 0.28} ${-size * 0.12} ${-size * 0.12} ${size * 0.42}C${size * 0.02} ${size * 0.9} ${size * 0.52} ${size * 1.1} ${size * 0.98} ${size * 0.84}C${size * 0.62} ${size * 0.76} ${size * 0.34} ${size * 0.48} ${size * 0.24} ${size * 0.1}C${size * 0.12} ${-size * 0.36} ${size * 0.28} ${-size * 0.7} ${size * 0.64} ${-size * 0.86}Z`} fill="url(#footer-crescent-fill)" />
      </g>
    </g>
  );
}

function FooterBackgroundPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
      viewBox="0 0 1920 660"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <clipPath id="footer-pattern-clip">
        <rect width="1920" height="660" />
      </clipPath>
      <rect width="1920" height="660" fill="url(#footer-paper-fade)" />
      <g clipPath="url(#footer-pattern-clip)">
      <g opacity="0.28">
        <rect x="116" y="66" width="1688" height="528" rx="44" stroke="url(#footer-paper-stroke)" strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
        <rect x="168" y="112" width="1584" height="436" rx="32" stroke="url(#footer-paper-stroke)" strokeWidth="0.9" fill="none" vectorEffect="non-scaling-stroke" />
        <rect x="220" y="158" width="1480" height="344" rx="24" stroke="url(#footer-paper-stroke-soft)" strokeWidth="0.8" fill="none" vectorEffect="non-scaling-stroke" />
      </g>
      <g opacity="0.16" fill="#B529AA">
        {Array.from({ length: 15 }).map((_, row) =>
          Array.from({ length: 34 }).map((__, column) => (
            <circle
              key={`${row}-${column}`}
              cx={58 + column * 56 + (row % 2) * 28}
              cy={46 + row * 42}
              r={column % 5 === 0 ? 1.45 : 1}
            />
          ))
        )}
      </g>
      <g opacity="0.24" stroke="url(#footer-paper-stroke)" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke">
        <path d="M116 172C116 108 158 66 222 66" />
        <path d="M1804 172C1804 108 1762 66 1698 66" />
        <path d="M116 488C116 552 158 594 222 594" />
        <path d="M1804 488C1804 552 1762 594 1698 594" />
        <path d="M168 202C168 148 204 112 258 112" />
        <path d="M1752 202C1752 148 1716 112 1662 112" />
        <path d="M168 458C168 512 204 548 258 548" />
        <path d="M1752 458C1752 512 1716 548 1662 548" />
      </g>
      <g opacity="0.5">
        <FooterCloudlet x={160} y={140} scale={0.54} delay="-1.2s" />
        <FooterCloudlet x={520} y={520} scale={0.44} delay="-6.7s" />
        <FooterCloudlet x={1400} y={142} scale={0.44} delay="-3.1s" />
        <FooterCloudlet x={1760} y={520} scale={0.54} delay="-8.4s" />
      </g>

      <g opacity="0.95">
        <FooterSparkle x={330} y={104} size={26} delay="-0.4s" />
        <FooterSparkle x={300} y={360} size={20} delay="-3.6s" />
        <FooterSparkle x={660} y={168} size={18} delay="-2.2s" />
        <FooterSparkle x={650} y={432} size={16} delay="-6.8s" />
        <FooterSparkle x={960} y={116} size={20} delay="-1.1s" />
        <FooterSparkle x={960} y={542} size={18} delay="-4.1s" />
        <FooterSparkle x={1040} y={418} size={12} delay="-7.1s" />
        <FooterSparkle x={1260} y={226} size={16} delay="-3.2s" />
        <FooterSparkle x={1268} y={486} size={18} delay="-5.2s" />
        <FooterSparkle x={1388} y={160} size={13} delay="-8.1s" />
        <FooterSparkle x={1590} y={108} size={26} delay="-1.7s" />
        <FooterSparkle x={1606} y={376} size={20} delay="-6.2s" />
        <FooterSparkle x={1718} y={592} size={14} delay="-2.1s" />

        <FooterHeart x={470} y={300} size={15} delay="-1.8s" />
        <FooterHeart x={960} y={330} size={12} delay="-7.2s" />
        <FooterHeart x={1450} y={300} size={15} delay="-4.8s" />
        <FooterHeart x={180} y={430} size={13} delay="-6.2s" />
        <FooterHeart x={1740} y={230} size={13} delay="-3.8s" />
        <FooterHeart x={680} y={220} size={11} delay="-5.8s" />
        <FooterHeart x={1240} y={590} size={11} delay="-2.8s" />

        <FooterBubble x={110} y={260} size={11} delay="-2.4s" />
        <FooterBubble x={230} y={94} size={8} delay="-3.9s" />
        <FooterBubble x={360} y={520} size={9} delay="-5.4s" />
        <FooterBubble x={590} y={292} size={8} delay="-4.1s" />
        <FooterBubble x={800} y={124} size={7} delay="-3.1s" />
        <FooterBubble x={820} y={552} size={7} delay="-6.1s" />
        <FooterBubble x={944} y={454} size={6} delay="-7.6s" />
        <FooterBubble x={1100} y={172} size={7} delay="-5.1s" />
        <FooterBubble x={1118} y={520} size={7} delay="-8.1s" />
        <FooterBubble x={1330} y={378} size={8} delay="-6.4s" />
        <FooterBubble x={1560} y={538} size={9} delay="-7.1s" />
        <FooterBubble x={1690} y={454} size={7} delay="-4.9s" />
        <FooterBubble x={1810} y={320} size={11} delay="-3.4s" />

        <FooterCrescent x={190} y={580} size={13} delay="-7.4s" />
        <FooterCrescent x={520} y={118} size={16} delay="-3.2s" />
        <FooterCrescent x={760} y={370} size={11} delay="-8.4s" />
        <FooterCrescent x={960} y={230} size={10} delay="-5.6s" />
        <FooterCrescent x={1010} y={594} size={9} delay="-6.6s" />
        <FooterCrescent x={1160} y={370} size={11} delay="-2.6s" />
        <FooterCrescent x={1400} y={540} size={16} delay="-6.2s" />
        <FooterCrescent x={1730} y={92} size={13} delay="-4.4s" />
      </g>
      <g opacity="0.12" fill="none" stroke="url(#footer-paper-stroke)" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <path d="M111 594C260 525 391 516 520 562" />
        <path d="M1806 66C1668 130 1538 142 1412 102" />
      </g>
      </g>
      <defs>
        <linearGradient id="footer-paper-fade" x1="960" y1="0" x2="960" y2="660" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="0.52" stopColor="#FFF5FD" stopOpacity="0.08" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="footer-paper-stroke" x1="116" y1="66" x2="1804" y2="594" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC6FB" stopOpacity="0.28" />
          <stop offset="0.52" stopColor="#FF41F2" stopOpacity="0.22" />
          <stop offset="1" stopColor="#B529AA" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="footer-paper-stroke-soft" x1="220" y1="158" x2="1700" y2="502" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC6FB" stopOpacity="0.18" />
          <stop offset="1" stopColor="#B529AA" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id="footer-cloud-fill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(-8 -10) scale(82 58)">
          <stop stopColor="#FFFFFF" stopOpacity="0.38" />
          <stop offset="0.48" stopColor="#FFB8FB" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FF41F2" stopOpacity="0.06" />
        </radialGradient>
        <linearGradient id="footer-sparkle-fill" x1="0" y1="100" x2="1920" y2="560" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#FFB8FB" stopOpacity="0.78" />
          <stop offset="1" stopColor="#FF41F2" stopOpacity="0.48" />
        </linearGradient>
        <linearGradient id="footer-heart-fill" x1="0" y1="-20" x2="0" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD8FC" stopOpacity="0.84" />
          <stop offset="0.55" stopColor="#FF8BE8" stopOpacity="0.62" />
          <stop offset="1" stopColor="#D94DCE" stopOpacity="0.36" />
        </linearGradient>
        <radialGradient id="footer-bubble-fill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(-4 -5) scale(24)">
          <stop stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#FFC6FB" stopOpacity="0.64" />
          <stop offset="1" stopColor="#FF41F2" stopOpacity="0.32" />
        </radialGradient>
        <linearGradient id="footer-crescent-fill" x1="-20" y1="-20" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.88" />
          <stop offset="0.54" stopColor="#FFB8FB" stopOpacity="0.62" />
          <stop offset="1" stopColor="#B529AA" stopOpacity="0.32" />
        </linearGradient>
        <filter id="footer-cloud-blur" x="-80" y="-80" width="160" height="160" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
    </svg>
  );
}

export async function GuestFooter({
  globalFields,
  columns,
}: GuestFooterProps) {
  const footerBrandImage = await resolveMediaUrl(globalFields.footerBrandImage);
  const footerBrandAlt = globalFields.footerBrandAlt?.trim() || "";
  const introItems = await normalizeIntroItems(globalFields.footerIntroItems);
  const socialLinks = normalizeSocialLinks(globalFields.footerSocialLinks);
  const brandTagline = globalFields.footerBrandTagline?.trim();
  const contactTitle = globalFields.footerContactTitle?.trim();
  const newsletterPlaceholder = globalFields.footerNewsletterPlaceholder?.trim();
  const newsletterAriaLabel = globalFields.footerNewsletterAriaLabel?.trim();
  const newsletterSubmitLabel = globalFields.footerNewsletterSubmitLabel?.trim();
  const copyright = globalFields.footerCopyright?.trim();
  const pinkCloudMessages = normalizePinkCloudMessages(globalFields.pinkCloudMessages);
  const scrollTopLabel = globalFields.footerScrollTopLabel?.trim();

  return (
    <>
      <footer data-guest-footer className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#f5f5f5]" aria-hidden="true" />
        <FooterBackgroundPattern />
        <div className="relative z-20 container mx-auto px-4 pt-10 lg:pt-15 2xl:pt-20 pb-5 lg:pb-7.5 2xl:pb-10">
          <div className="mx-auto space-y-2.5 lg:space-y-5 flex flex-col items-center">
            {footerBrandImage ? <img src={footerBrandImage} alt={footerBrandAlt} className="h-10 lg:h-12.5 w-auto object-contain" /> : null}
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
                          isInternalHref(item.href) ? (
                            <Link href={item.href} className="hover:text-guest-primary transition">
                              {item.value}
                            </Link>
                          ) : (
                            <a
                              href={item.href}
                              target={/^https?:\/\//.test(item.href) ? "_blank" : undefined}
                              rel={/^https?:\/\//.test(item.href) ? "noreferrer" : undefined}
                              className="hover:text-guest-primary transition"
                            >
                              {item.value}
                            </a>
                          )
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
              {columns.map((column) => (
                <div key={column.id} className="col-span-12 md:col-span-3 space-y-4">
                  <h3 className="w-fit text-base md:text-lg lg:text-xl 2xl:text-2xl font-semibold bg-[linear-gradient(90deg,#3B2A33_0%,#B86A8A_50%,#4A2D38_100%)] bg-no-repeat bg-clip-text text-transparent">
                    {column.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {column.links.map((item) => renderFooterLink(item, "text-sm md:text-base hover:text-guest-primary transition"))}
                  </div>
                </div>
              ))}

              <div className="col-span-12 md:col-span-3 space-y-5">
                {contactTitle ? (
                  <h3 className="w-fit text-base md:text-lg lg:text-xl 2xl:text-2xl font-semibold bg-[linear-gradient(90deg,#3B2A33_0%,#B86A8A_50%,#4A2D38_100%)] bg-no-repeat bg-clip-text text-transparent">
                    {contactTitle}
                  </h3>
                ) : null}
                {(newsletterPlaceholder || newsletterAriaLabel || newsletterSubmitLabel) ? (
                  <div className="flex items-center overflow-hidden rounded-full border border-guest-primary pl-5">
                    <input
                      type="email"
                      placeholder={newsletterPlaceholder}
                      className="h-12 flex-1 bg-transparent text-sm outline-none"
                      aria-label={newsletterAriaLabel}
                    />
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-guest-primary transition hover:bg-guest-primary/80"
                      aria-label={newsletterSubmitLabel}
                    >
                      <CircleArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                ) : null}

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

      <div className="fixed right-4 bottom-10 z-40 flex flex-col items-center gap-2.5">
        <ScrollToTopButton label={scrollTopLabel} />
        <GuestPinkCloud messages={pinkCloudMessages} />
      </div>
    </>
  );
}
