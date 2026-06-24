import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { EventPlannerTitleAccent } from "@/app/(guest)/_components/event-planner-title-accent";
import { GlobalFaqSection } from "@/app/(guest)/_components/global-faq-section";
import { GuestLinkButton } from "@/app/(guest)/_components/guest-ui";
import { GuestAnimatedCtaButton } from "@/app/(guest)/_components/guest-animated-cta-button";
import { GuestMarketingPageDecor } from "@/app/(guest)/_components/guest-marketing-background";
import { HeroAnimatedTitle } from "@/app/(guest)/_components/hero-animated-title";
import { HeroInvitationOrb } from "@/app/(guest)/_components/hero-invitation-orb";
import { HomeStatsSection, type HomeStatsItem } from "@/app/(guest)/_components/home-stats-section";
import { HomeTestimonialsCarousel } from "@/app/(guest)/_components/home-testimonials-carousel";
import { normalizeServiceGroupItems, ServiceGroupItemCard, type ServiceGroupItemInput } from "@/app/(guest)/_components/service-group-section";
import { listPublishedOfferings } from "@/features/offerings/server/service";
import { SmoothScrollLink } from "@/app/(guest)/_components/smooth-scroll-link";
import type { ManagedPage } from "@/lib/managed-pages";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";

function HomePanelHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
}) {
  if (!title && !description) {
    return null;
  }

  return (
    <div className={align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-4xl"}>
      {eyebrow ? (
        <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#b529aa] ${align === "center" ? "justify-center" : ""}`}>
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-stone-950 sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base lg:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export async function HomeContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    bannerTopLine?: string;
    bannerLine1Prefix?: string;
    bannerLine1Rotating?: string;
    bannerLine1Suffix?: string;
    bannerLine2?: string;
    bannerShortDescription?: string;
    bannerDescription?: string;
    scrollDownText?: string;
    heroTitle?: string;
    heroDescription?: string;
    heroButtonText?: string;
    heroButtonLink?: string;
    aboutEyebrow?: string;
    aboutTitle?: string;
    aboutDescription?: string;
    aboutImage?: string;
    aboutText1?: string;
    aboutText2?: string;
    aboutText3?: string;
    aboutItems?: Array<{
      label?: string;
      content?: string;
    }>;
    homeStats?: Array<{
      label?: string;
      value?: string;
      description?: string;
    }>;
    servicesTitle?: string;
    servicesDescription?: string;
    servicesCtaText?: string;
    servicesCtaLink?: string;
    serviceItems?: ServiceGroupItemInput[];
    eventPlannerEyebrow?: string;
    eventPlannerTitle?: string;
    eventPlannerHighlight?: string;
    eventPlannerSuffix?: string;
    eventPlannerSolutionTitle?: string;
    eventPlannerSolutionDescription?: string;
    eventPlannerHighlightText?: string;
    eventPlannerCtaText?: string;
    eventPlannerCtaLink?: string;
    eventPlannerProblems?: Array<{
      image?: string;
      title?: string;
      description?: string;
    }>;
    eventPlannerFeatures?: Array<{
      title?: string;
      description?: string;
      accentImage?: string;
    }>;
    testimonialsEyebrow?: string;
    testimonialsTitle?: string;
    testimonialsDescription?: string;
    testimonials?: Array<{
      quote?: string;
      name?: string;
      role?: string;
      avatar?: string;
      rating?: string | number;
    }>;
    partnersEyebrow?: string;
    partnersTitle?: string;
    partnersDescription?: string;
    partners?: Array<{
      name?: string;
      description?: string;
      logo?: string;
      url?: string;
    }>;
  }>(page);

  const bannerTopLine = fields.bannerTopLine ?? "Chào mừng đến với";
  const bannerLine1Prefix = fields.bannerLine1Prefix ?? "Nền tảng cho";
  const bannerLine1Rotating = fields.bannerLine1Rotating ?? "Đám cưới, Sự kiện, Lễ kỷ niệm";
  const bannerLine1Suffix = fields.bannerLine1Suffix ?? "hoàn hảo của bạn";
  const bannerLine2 = fields.bannerLine2 ?? "Pinklove";

  const serviceItems = (Array.isArray(fields.serviceItems) ? fields.serviceItems : []).filter(
    (item) => item.title?.trim() || item.description?.trim() || item.descriptionItems?.trim() || item.headerImage?.trim()
  );

  const resolvedServiceItems = normalizeServiceGroupItems(serviceItems, 5);

  const bannerTitle = fields.heroTitle || "";
  const bannerShortDescription = fields.bannerShortDescription || "Nền tảng tổ chức sự kiện và đám cưới hàng đầu Việt Nam.";
  const bannerDescription = fields.bannerDescription || fields.heroDescription || "Từ việc tìm kiếm nhà cung cấp, quản lý ngân sách, đến việc gửi thiệp mời, chúng tôi lo tất cả để ngày trọng đại của bạn thật hoàn hảo.";
  const scrollDownText = fields.scrollDownText?.trim() ?? "Cuộn xuống";
  const heroButtonText = fields.heroButtonText?.trim() ?? "Bắt đầu ngay";
  const heroButtonLink = fields.heroButtonLink?.trim() ?? "/";
  const aboutEyebrow = fields.aboutEyebrow?.trim() ?? "Về chúng tôi";
  const aboutImage = await resolveMediaUrl(fields.aboutImage);
  const hasAboutTexts = Boolean(
    fields.aboutText1?.trim() ||
    fields.aboutText2?.trim() ||
    fields.aboutText3?.trim()
  );
  const aboutItems = (Array.isArray(fields.aboutItems) ? fields.aboutItems : []).filter(
    (item) => item.label?.trim() && item.content?.trim()
  );
  const homeStats: HomeStatsItem[] = (Array.isArray(fields.homeStats) ? fields.homeStats : [])
    .filter((item) => item.label?.trim() && item.value?.trim())
    .map((item) => ({
      label: item.label?.trim() || "",
      value: item.value?.trim() || "",
      description: item.description?.trim() || "",
    }));
  const eventPlannerProblems = (Array.isArray(fields.eventPlannerProblems) ? fields.eventPlannerProblems : []).filter(
    (item) => item.title?.trim() && item.description?.trim()
  );
  const eventPlannerProblemCards = await Promise.all(
    eventPlannerProblems.map(async (item) => ({
      image: await resolveMediaUrl(item.image),
      title: item.title?.trim() || "",
      description: item.description?.trim() || "",
    }))
  );
  const eventPlannerFeatures = await Promise.all(
    (Array.isArray(fields.eventPlannerFeatures) ? fields.eventPlannerFeatures : [])
      .filter((item) => item.title?.trim() && item.description?.trim())
      .map(async (item) => ({
        title: item.title?.trim() || "",
        description: item.description?.trim() || "",
        accentImage: await resolveMediaUrl(item.accentImage),
      }))
  );
  const testimonials = await Promise.all(
    (Array.isArray(fields.testimonials) ? fields.testimonials : [])
      .filter((item) => item.quote?.trim() && item.name?.trim())
      .map(async (item) => ({
        quote: item.quote?.trim() || "",
        name: item.name?.trim() || "",
        role: item.role?.trim() || "",
        avatar: await resolveMediaUrl(item.avatar),
        rating: Math.max(0, Math.min(5, Math.round(Number(item.rating ?? 5) || 5))),
      }))
  );
  const partners = await Promise.all(
    (Array.isArray(fields.partners) ? fields.partners : [])
      .filter((item) => item.name?.trim())
      .map(async (item) => ({
        name: item.name?.trim() || "",
        description: item.description?.trim() || "",
        logo: await resolveMediaUrl(item.logo),
        url: item.url?.trim() || "",
      }))
  );
  const publishedOfferings = await listPublishedOfferings();
  const heroPreviewOfferings = publishedOfferings.filter((item) => item.thumbnailUrl?.trim()).slice(0, 8);
  const heroPreviewTrack = heroPreviewOfferings.length > 0
    ? [...heroPreviewOfferings, ...heroPreviewOfferings]
    : [];
  const hasAboutContent = Boolean(
    fields.aboutTitle?.trim() ||
    fields.aboutDescription?.trim() ||
    aboutImage ||
    hasAboutTexts ||
    aboutItems.length
  );
  const eventPlannerEyebrow = fields.eventPlannerEyebrow?.trim() ?? "BẠN LÀ NHÀ TỔ CHỨC SỰ KIỆN?";
  const eventPlannerTitle = fields.eventPlannerTitle?.trim() ?? "CẢM THẤY";
  const eventPlannerHighlight = fields.eventPlannerHighlight?.trim() ?? "Stress?";
  const eventPlannerSuffix = fields.eventPlannerSuffix?.trim() ?? "CHÚNG TÔI GIÚP ĐƯỢC";
  const eventPlannerSolutionTitle = fields.eventPlannerSolutionTitle?.trim() ?? "Nền tảng tất cả trong một giúp bạn quản lý sự kiện dễ dàng";
  const eventPlannerSolutionDescription = fields.eventPlannerSolutionDescription?.trim() ?? "Mô tả giải pháp.";
  const eventPlannerHighlightText = fields.eventPlannerHighlightText?.trim() ?? "tất cả trong một";
  const eventPlannerCtaText = fields.eventPlannerCtaText?.trim() ?? "Khám phá ngay";
  const eventPlannerCtaLink = fields.eventPlannerCtaLink?.trim() ?? "/";
  const servicesTitle = fields.servicesTitle?.trim() ?? "Dịch vụ của chúng tôi";
  const servicesCtaText = fields.servicesCtaText?.trim() ?? "Xem tất cả dịch vụ";
  const servicesCtaLink = fields.servicesCtaLink?.trim() ?? "/services";
  const testimonialsEyebrow = fields.testimonialsEyebrow?.trim() ?? "Khách hàng nói gì";
  const testimonialsTitle = fields.testimonialsTitle?.trim() ?? "Đánh giá từ khách hàng";
  const testimonialsDescription = fields.testimonialsDescription?.trim() ?? "Đây là những gì khách hàng của chúng tôi nói về chúng tôi.";
  const partnersEyebrow = fields.partnersEyebrow?.trim() ?? "Đối tác của chúng tôi";
  const partnersTitle = fields.partnersTitle?.trim() ?? "Những người đồng hành cùng chúng tôi";
  const eventPlannerTitleParts = eventPlannerSolutionTitle && eventPlannerHighlightText
    ? eventPlannerSolutionTitle.split(eventPlannerHighlightText)
    : [];
  const hasTestimonialsSection = Boolean(testimonialsEyebrow || testimonialsTitle || testimonialsDescription || testimonials.length);
  const hasPartnersSection = Boolean(partnersEyebrow || partnersTitle || partners.length);
  const partnerRows = partners.length
    ? [
      partners.filter((_, index) => index % 2 === 0),
      partners.filter((_, index) => index % 2 === 1),
    ].map((row) => row.length ? row : partners)
    : [];
  const scrollDots = [
    { id: "hero", href: "#home-hero", label: "Đi đến banner", className: "size-4 bg-[#FF6FF5]" },
    { id: "services", href: "#home-services", label: "Đi đến dịch vụ", className: "size-3.5 bg-[#FF6FF5]/80" },
    { id: "service-items", href: "#home-service-items", label: "Đi đến danh sách dịch vụ", className: "size-3 bg-[#FF6FF5]/60" },
    { id: "about", href: hasAboutContent ? "#home-about" : "#home-stats", label: "Đi đến giới thiệu", className: "size-3 bg-[#FF6FF5]/60" },
  ];

  return (
    <>
      <GuestMarketingPageDecor ambientGlowDensity="regular" />
      <section id="home-hero" className="relative z-10 overflow-hidden bg-gradient-to-b from-[#FFD1F7] to-[#F9F1FF] pt-20 sm:pt-25 lg:pt-30 pb-20 lg:pb-40 2xl:pb-60">
        <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
          <div className="absolute left-[8%] top-[20%] size-24 rounded-full bg-guest-primary/15 blur-3xl" />
          <div className="absolute right-[12%] top-[28%] size-32 rounded-full bg-[#ffb8fb]/30 blur-3xl" />
          <div className="absolute bottom-[16%] left-[38%] size-24 rounded-full bg-white/35 blur-3xl" />
          <span
            className="cta-sparkle-float absolute left-[8%] top-[18%] bg-clip-text text-4xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.2)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 26%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 62%, white) 46%, color-mix(in srgb, var(--color-guest-primary) 88%, white) 100%)" }}
          >✦</span>
          <span
            className="cta-sparkle-float absolute left-[31%] top-[14%] bg-clip-text text-2xl text-transparent drop-shadow-[0_6px_14px_rgba(255,184,251,0.18)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 18%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 54%, white) 46%, color-mix(in srgb, var(--color-guest-primary) 82%, white) 100%)" }}
          >✧</span>
          <span
            className="cta-heart-pop absolute left-[13%] bottom-[26%] bg-clip-text text-3xl text-transparent drop-shadow-[0_8px_18px_rgba(217,77,206,0.24)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 28%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 66%, white) 50%, color-mix(in srgb, var(--color-guest-primary) 90%, white) 100%)" }}
          >♥</span>
          <span
            className="cta-sparkle-float absolute left-[41%] bottom-[14%] bg-clip-text text-5xl text-transparent drop-shadow-[0_8px_20px_rgba(255,111,245,0.35)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 22%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 60%, white) 45%, color-mix(in srgb, var(--color-guest-primary) 86%, white) 100%)" }}
          >✦</span>
          <span
            className="cta-sparkle-float absolute right-[24%] top-[18%] bg-clip-text text-3xl text-transparent drop-shadow-[0_6px_16px_rgba(255,111,245,0.2)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 24%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 62%, white) 46%, color-mix(in srgb, var(--color-guest-primary) 88%, white) 100%)" }}
          >✦</span>
          <span
            className="cta-heart-pop absolute right-[16%] bottom-[24%] bg-clip-text text-2xl text-transparent drop-shadow-[0_8px_18px_rgba(217,77,206,0.22)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 30%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 68%, white) 50%, color-mix(in srgb, var(--color-guest-primary) 90%, white) 100%)" }}
          >♥</span>
          <span
            className="cta-sparkle-float absolute right-[8%] top-[46%] bg-clip-text text-4xl text-transparent drop-shadow-[0_8px_20px_rgba(255,111,245,0.35)]"
            style={{ backgroundImage: "linear-gradient(145deg, color-mix(in srgb, var(--color-guest-primary) 22%, white) 0%, color-mix(in srgb, var(--color-guest-primary) 60%, white) 45%, color-mix(in srgb, var(--color-guest-primary) 86%, white) 100%)" }}
          >✦</span>
          <span className="absolute left-[55%] top-[12%] size-2 rounded-full bg-white shadow-[0_0_20px_rgba(255,111,245,0.7)]" />
          <span className="absolute right-[12%] bottom-[14%] size-3 rounded-full bg-guest-primary/50 shadow-[0_0_24px_rgba(255,111,245,0.55)]" />
        </div>
        <div className="container px-4 mx-auto relative z-10 lg:flex">
          <div className="relative grid w-full grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pl-20">
            <div className="flex flex-col justify-center space-y-5 text-center lg:col-span-6 lg:text-left">
              <HeroAnimatedTitle
                topLine={bannerTopLine}
                lineOnePrefix={bannerLine1Prefix}
                lineOneRotating={bannerLine1Rotating}
                lineOneSuffix={bannerLine1Suffix}
                lineTwo={bannerLine2}
                fallbackTitle={bannerTitle}
                className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold"
              />
              {bannerShortDescription && (<p className="text-sm md:text-base lg:text-lg font-semibold">{bannerShortDescription}</p>)}
              {bannerDescription ? (
                <div
                  className={`text-sm md:text-base lg:text-lg ${RICH_TEXT_CONTENT_CLASSNAME}`}
                  dangerouslySetInnerHTML={createRichTextMarkup(bannerDescription)}
                />
              ) : null}
              {heroButtonText ? (
                <div className="mt-5 flex justify-center lg:mt-7.5 lg:justify-start">
                  <GuestLinkButton href={heroButtonLink || ROUTES.ABOUT} className="inline-flex items-center justify-center gap-2.5 uppercase font-semibold bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] hover:bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)]">
                    {heroButtonText}
                    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="size-5 animate-phone-ring" width="20" height="20" viewBox="0 0 24 24">
                      <g fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11.811 6.727C12.825 4.909 13.331 4 14.09 4c.757 0 1.264.909 2.277 2.727l.262.47c.288.517.432.775.657.945c.224.17.504.234 1.063.36l.51.116c1.967.445 2.95.667 3.185 1.42s-.437 1.537-1.778 3.106l-.347.406c-.381.445-.572.668-.658.944s-.057.573 0 1.168l.053.541c.203 2.094.305 3.14-.308 3.605s-1.534.041-3.377-.807l-.476-.22c-.524-.24-.786-.361-1.063-.361c-.278 0-.54.12-1.063.361l-.477.22c-1.842.848-2.763 1.272-3.376.807s-.511-1.511-.309-3.605l.053-.541c.057-.595.086-.892 0-1.168s-.276-.498-.657-.944l-.347-.406C6.57 11.575 5.9 10.79 6.135 10.038s1.218-.975 3.185-1.42l.51-.116c.559-.126.838-.19 1.063-.36s.368-.428.656-.945z" />
                        <path strokeLinecap="round" d="M2.089 16a4.74 4.74 0 0 1 4-.874m-4-4.626c1-.5 1.29-.44 2-.5M2 5.609l.208-.122c2.206-1.292 4.542-1.64 6.745-1.005l.208.06" opacity=".5" />
                      </g>
                    </svg>
                  </GuestLinkButton>
                </div>
              ) : null}
            </div>
            <div className="flex min-h-[280px] items-center lg:col-span-6">
              <div className="flex w-full items-center justify-center">
                <HeroInvitationOrb offerings={heroPreviewTrack} />
              </div>
            </div>

            {/* Dots */}
            <div className="pointer-events-none absolute left-4 top-1/2 z-[80] hidden -translate-y-1/2 flex-col items-center gap-y-7.5 lg:flex">
              <div className="flex flex-col items-center gap-y-5">
                {scrollDots.map((dot) => (
                  <a
                    key={dot.id}
                    href={dot.href}
                    aria-label={dot.label}
                    className={`${dot.className} pointer-events-auto block rounded-full transition-transform duration-300 hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6FF5]`}
                  />
                ))}
              </div>

              {scrollDownText ? (
                <SmoothScrollLink
                  targetId="home-page-end"
                  pixelsPerSecond={600}
                  aria-label={scrollDownText}
                  className="group pointer-events-auto flex cursor-pointer flex-col items-center gap-y-5 border-0 bg-transparent p-0 transition-colors duration-300 hover:text-[#FF6FF5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6FF5]"
                >
                  <span className="breathe-element flex justify-center whitespace-nowrap text-sm font-medium uppercase lg:text-base [--puramu-animation-length:3s]" style={{ writingMode: "sideways-lr" }}>
                    {scrollDownText}
                  </span>

                  <span className="flex flex-col items-center gap-y-5 [--puramu-length:100px] animate-[fade-in-and-slide-down_2s_linear_forwards_infinite]">
                    <svg width="17" height="28" viewBox="0 0 17 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.08963 0C3.62895 0 0 3.62895 0 8.08963V19.4126C0 23.8733 3.62895 27.5022 8.08963 27.5022C12.5503 27.5022 16.1792 23.8733 16.1792 19.4126V8.08963C16.1792 3.62895 12.5503 0 8.08963 0ZM14.5291 19.4126C14.5291 22.9633 11.6403 25.8522 8.08963 25.8522C4.53895 25.8522 1.65008 22.9633 1.65008 19.4126V8.08963C1.65008 4.53895 4.53895 1.65008 8.08963 1.65008C11.6403 1.65008 14.5291 4.53895 14.5291 8.08963V19.4126Z" fill="currentColor" />
                      <path d="M8.08966 5.471C7.63394 5.471 7.26465 5.84029 7.26465 6.29601V10.0934C7.26465 10.5489 7.63394 10.9185 8.08972 10.9185C8.54522 10.9185 8.91473 10.5489 8.91473 10.0934V6.29601C8.91473 5.84029 8.54544 5.471 8.08966 5.471Z" fill="currentColor" />
                    </svg>
                    <span className="h-25 w-[2px] bg-gradient-to-b from-current to-black/60 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                  </span>
                </SmoothScrollLink>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="home-services" className="relative z-10 pt-5 lg:pt-7.5 2xl:pt-10 pb-10 lg:pb-15 2xl:pb-20 bg-white">
        <svg className="pointer-events-none absolute inset-x-0 bottom-full z-0 w-full fill-white" viewBox="0 0 1920 96" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="m1920.5 91.325c-878.73-165.59-1537.7-68.638-1920.5 1e-4v130.67h1920.5v-130.67z" />
        </svg>
        <div className="container px-4 mx-auto">
          <div className="container mx-auto relative z-10">
            <div id="home-service-items" className="relative z-10">
              {servicesTitle ? (
                <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-semibold uppercase">{servicesTitle}</h2>
              ) : null}
              <div className="mt-6 lg:mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {resolvedServiceItems.map((item, index) => (
                  <ServiceGroupItemCard key={item.title} item={item} index={index} theme="home" />
                ))}
              </div>
              {servicesCtaText ? (
                <div className="mt-10 flex justify-center">
                  <GuestLinkButton href={servicesCtaLink || ROUTES.SERVICES} className="rounded-full px-8 py-3.5 text-sm font-semibold uppercase">
                    {servicesCtaText}
                  </GuestLinkButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {hasAboutContent ? (
        <section id="home-about" className="relative z-10 pt-20 lg:pt-30 2xl:pt-40 pb-28 lg:pb-36 2xl:pb-40 bg-gradient-to-b from-[#FFD1F7] to-[#F9F1FF]">
          <div className="container px-4 mx-auto relative z-10">
            <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                {aboutImage ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-[#f8d8f4] bg-[#fff5fd] shadow-[0_14px_34px_rgba(35,31,39,0.07)]">
                    <Image src={aboutImage} alt={fields.aboutTitle || "Tiêu đề Giới thiệu"} fill className="object-cover" sizes="(min-width: 1024px) 42vw, 100vw" />
                  </div>
                ) : null}
              </div>

              <div className="space-y-5">
                <HomePanelHeader
                  eyebrow={aboutEyebrow}
                  title={fields.aboutTitle || "Tiêu đề Giới thiệu"}
                  description={fields.aboutDescription ? undefined : fields.aboutText1}
                />
                {fields.aboutDescription ? (
                  <div
                    className={`${RICH_TEXT_CONTENT_CLASSNAME} text-stone-600`}
                    dangerouslySetInnerHTML={createRichTextMarkup(fields.aboutDescription)}
                  />
                ) : null}
                {hasAboutTexts ? (
                  <div className="space-y-3 text-sm leading-7 text-stone-600 md:text-base">
                    {fields.aboutText1?.trim() ? <p>{fields.aboutText1}</p> : null}
                    {fields.aboutText2?.trim() ? <p>{fields.aboutText2}</p> : null}
                    {fields.aboutText3?.trim() ? <p>{fields.aboutText3}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <HomeStatsSection items={homeStats} className="absolute inset-x-0 bottom-0 z-20 translate-y-1/2" />
        </section>
      ) : null}

      {page.body ? (
        <section id="home-body" className="container px-4 mx-auto relative z-10">
          <div
            className={`relative z-10 mx-auto max-w-5xl ${RICH_TEXT_CONTENT_CLASSNAME}`}
            dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
          />
        </section>
      ) : null}

      {(eventPlannerEyebrow || eventPlannerTitle || eventPlannerHighlight || eventPlannerSuffix) ? (
        <section id="home-event-planner" className="container px-4 mx-auto relative z-10 pt-28 lg:pt-36 2xl:pt-40">
          <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-5">
            <div className="flex flex-col items-center gap-2 sm:items-end">
              {eventPlannerEyebrow ? (
                <span className="text-lg font-black uppercase tracking-tight text-stone-950 lg:text-3xl 2xl:text-4xl">
                  {eventPlannerEyebrow}
                </span>
              ) : null}
              {eventPlannerTitle ? (
                <span className="relative text-lg font-black uppercase tracking-tight text-stone-950 lg:text-3xl 2xl:text-4xl">
                  <EventPlannerTitleAccent className="absolute right-[calc(100%+20px)] top-1/2 hidden h-auto w-25 -translate-y-1/2 lg:block" />
                  {eventPlannerTitle}
                </span>
              ) : null}
            </div>
            <div className="flex items-end justify-center gap-2">
              {eventPlannerHighlight ? (
                <span className="font-['Brush_Script_MT','Segoe_Script',cursive] text-6xl leading-[0.75] text-[#e54153] lg:text-[100px]">
                  {eventPlannerHighlight}
                </span>
              ) : null}
              {eventPlannerSuffix ? (
                <span className="pb-1 text-lg font-black uppercase text-stone-950 lg:pb-3 lg:text-3xl 2xl:text-4xl">
                  {eventPlannerSuffix}
                </span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {eventPlannerProblemCards.length ? (
        <section id="home-event-planner-problems" className="container px-4 mx-auto relative z-10 pt-10 lg:pt-14">
          <div className="grid gap-5 md:grid-cols-3">
            {eventPlannerProblemCards.map((item, index) => (
              <article
                key={`${item.title}-${item.description}-${index}`}
                className="min-h-48 rounded-[24px] border border-[#f8d8f4] bg-white p-5 shadow-[0_14px_34px_rgba(35,31,39,0.07)] transition hover:-translate-y-1 hover:border-[#ff6ff5] hover:shadow-[0_22px_48px_rgba(217,77,206,0.16)]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-[#fff5fd]">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} width={56} height={56} className="h-10 w-10 object-contain" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-[#b529aa]" />
                    )}
                  </span>
                  <span className="rounded-full bg-[#fff5fd] px-3 py-1 text-xs font-semibold text-[#b529aa]">#{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-600 md:text-base">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {(eventPlannerSolutionTitle || eventPlannerCtaText) ? (
        <section id="home-event-planner-solution" className="container px-4 mx-auto relative z-10 pt-10 lg:pt-14">
          <div className="mx-auto max-w-5xl rounded-[24px] border border-[#f8d8f4] bg-white p-6 text-center shadow-[0_14px_34px_rgba(35,31,39,0.07)]">
            {eventPlannerSolutionTitle ? (
              <h2 className="text-2xl font-semibold leading-tight text-stone-950 sm:text-3xl lg:text-4xl">
                {eventPlannerTitleParts.length > 1 ? (
                  eventPlannerTitleParts.map((part, index) => (
                    <span key={`${part}-${index}`}>
                      {part}
                      {index < eventPlannerTitleParts.length - 1 ? (
                        <span className="text-[#b529aa]">{eventPlannerHighlightText}</span>
                      ) : null}
                    </span>
                  ))
                ) : (
                  eventPlannerSolutionTitle
                )}
              </h2>
            ) : null}
            {eventPlannerCtaText ? (
              <div className="mt-7">
                <GuestAnimatedCtaButton href={eventPlannerCtaLink || ROUTES.ABOUT}>
                  {eventPlannerCtaText}
                </GuestAnimatedCtaButton>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {eventPlannerFeatures.length ? (
        <section id="home-event-planner-features" className="container px-4 mx-auto relative z-10 pt-10 lg:pt-14">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {eventPlannerFeatures.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="relative min-h-64 overflow-hidden rounded-[24px] border border-[#f8d8f4] bg-white p-5 shadow-[0_14px_34px_rgba(35,31,39,0.07)] transition hover:-translate-y-1 hover:border-[#ff6ff5] hover:shadow-[0_22px_48px_rgba(217,77,206,0.16)]"
              >
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                {item.accentImage ? (
                  <div className="pointer-events-none absolute bottom-4 right-4 flex size-16 select-none items-center justify-center opacity-80">
                    <Image src={item.accentImage} alt="" width={80} height={80} className="h-full w-full object-contain" />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hasTestimonialsSection ? (
        <section id="home-testimonials" className="container px-4 mx-auto relative z-10 pt-16 lg:pt-24">
          <div className="relative z-10 space-y-8">
            <HomePanelHeader
              eyebrow={testimonialsEyebrow}
              title={testimonialsTitle}
              description={testimonialsDescription}
              align="center"
            />
            {testimonials.length ? (
              <HomeTestimonialsCarousel testimonials={testimonials} />
            ) : null}
          </div>
        </section>
      ) : null}

      {hasPartnersSection ? (
        <section id="home-partners" className="container px-4 mx-auto relative z-10 py-10 lg:py-15 2xl:py-20">
          <div className="relative z-10 space-y-8">
            <HomePanelHeader
              eyebrow={partnersEyebrow}
              title={partnersTitle}
              align="center"
            />
            {partners.length ? (
              <div className="space-y-4 overflow-hidden">
                {partnerRows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={rowIndex === 0 ? "home-partners-marquee flex w-max gap-4" : "home-partners-marquee-reverse flex w-max gap-4"}
                  >
                    {[...row, ...row, ...row].map((item, index) => {
                      const content = (
                        <div className="flex min-h-28 w-60 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#f8d8f4] bg-white px-5 py-5 text-center transition hover:border-[#ff6ff5] hover:shadow-[0_18px_44px_rgba(217,77,206,0.1)] sm:w-[17rem] lg:w-72">
                          {item.logo ? (
                            <Image src={item.logo} alt={item.name} width={144} height={56} className="h-12 w-auto max-w-36 object-contain" />
                          ) : (
                            <span className="text-base font-semibold text-stone-950">{item.name}</span>
                          )}
                          {item.logo ? <h3 className="mt-4 text-sm font-semibold text-stone-950">{item.name}</h3> : null}
                        </div>
                      );

                      return item.url ? (
                        item.url.startsWith("/") && !item.url.startsWith("//") ? (
                          <Link key={`${rowIndex}-${item.name}-${index}`} href={item.url} className="block shrink-0">
                            {content}
                          </Link>
                        ) : (
                          <a
                            key={`${rowIndex}-${item.name}-${index}`}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block shrink-0"
                          >
                            {content}
                          </a>
                        )
                      ) : (
                        <div key={`${rowIndex}-${item.name}-${index}`} className="shrink-0">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <GlobalFaqSection className="relative z-10 pb-6" containerClassName="container px-4 mx-auto" />
      <div id="home-page-end" className="h-px" aria-hidden="true" />
    </>
  );
}
