import Image from "next/image";
import { Sparkles } from "lucide-react";
import { GlobalFaqSection } from "@/app/(guest)/_components/global-faq-section";
import { GuestLinkButton } from "@/app/(guest)/_components/guest-ui";
import { GuestAnimatedCtaButton } from "@/app/(guest)/_components/guest-animated-cta-button";
import { GuestMarketingPageDecor } from "@/app/(guest)/_components/guest-marketing-background";
import { HeroAnimatedTitle } from "@/app/(guest)/_components/hero-animated-title";
import { HeroInvitationOrb } from "@/app/(guest)/_components/hero-invitation-orb";
import { HomeStatsSection, type HomeStatsItem } from "@/app/(guest)/_components/home-stats-section";
import { normalizeServiceGroupItems, ServiceGroupSection, type ServiceGroupItemInput } from "@/app/(guest)/_components/service-group-section";
import { listPublishedOfferings } from "@/features/offerings/server/service";
import { LoopOnlineInvitationCard } from "@/features/offerings/components/LoopOnlineInvitationCard";
import { LoopOfferingCard } from "@/features/offerings/components/LoopOfferingCard";
import { PagedCarousel } from "@/components/common/paged-carousel";
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
  eyebrow: string;
  title?: string;
  description?: string;
  align?: "left" | "center";
}) {
  if (!title && !description) {
    return null;
  }

  return (
    <div className={align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-4xl"}>
      <p className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#b529aa] ${align === "center" ? "justify-center" : ""}`}>
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </p>
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
    heroTitle?: string;
    heroDescription?: string;
    heroButtonText?: string;
    heroButtonLink?: string;
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
    invitationGalleryBadge?: string;
    invitationGalleryTitle?: string;
    invitationGalleryDescription?: string;
    invitationGalleryCtaText?: string;
    invitationGalleryCtaLink?: string;
    invitationGalleryOfferingSlugs?: string[];
    sharedInvitationsBadge?: string;
    sharedInvitationsTitle?: string;
    sharedInvitationsDescription?: string;
    sharedInvitationsCtaText?: string;
    sharedInvitationsCtaLink?: string;
    sharedInvitationsOfferingSlugs?: string[];
  }>(page);

  const serviceItems = (Array.isArray(fields.serviceItems) ? fields.serviceItems : []).filter(
    (item) => item.title?.trim() || item.description?.trim() || item.descriptionItems?.trim() || item.headerImage?.trim()
  );

  const resolvedServiceItems = normalizeServiceGroupItems(serviceItems, 5);

  const bannerTitle = fields.heroTitle || page.title || "";
  const bannerShortDescription = fields.bannerShortDescription || page.excerpt;
  const bannerDescription = fields.bannerDescription || fields.heroDescription;
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
  const publishedOfferings = await listPublishedOfferings();
  const invitationGalleryOfferingSlugs = Array.isArray(fields.invitationGalleryOfferingSlugs)
    ? fields.invitationGalleryOfferingSlugs.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const publishedOfferingMap = new Map(publishedOfferings.map((item) => [item.slug, item] as const));
  const invitationGalleryItems = invitationGalleryOfferingSlugs
    .map((slug) => publishedOfferingMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.thumbnailUrl?.trim());
  const sharedInvitationsOfferingSlugs = Array.isArray(fields.sharedInvitationsOfferingSlugs)
    ? fields.sharedInvitationsOfferingSlugs.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const sharedInvitationsItems = sharedInvitationsOfferingSlugs
    .map((slug) => publishedOfferingMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.thumbnailUrl?.trim());
  const heroPreviewOfferings = (
    invitationGalleryItems.length
      ? invitationGalleryItems
      : sharedInvitationsItems.length
        ? sharedInvitationsItems
        : publishedOfferings.filter((item) => item.thumbnailUrl?.trim())
  ).slice(0, 8);
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
  const eventPlannerEyebrow = fields.eventPlannerEyebrow?.trim();
  const eventPlannerTitle = fields.eventPlannerTitle?.trim();
  const eventPlannerHighlight = fields.eventPlannerHighlight?.trim();
  const eventPlannerSuffix = fields.eventPlannerSuffix?.trim();
  const eventPlannerSolutionTitle = fields.eventPlannerSolutionTitle?.trim();
  const eventPlannerSolutionDescription = fields.eventPlannerSolutionDescription?.trim();
  const eventPlannerHighlightText = fields.eventPlannerHighlightText?.trim();
  const eventPlannerCtaText = fields.eventPlannerCtaText?.trim();
  const eventPlannerCtaLink = fields.eventPlannerCtaLink?.trim();
  const eventPlannerTitleParts = eventPlannerSolutionTitle && eventPlannerHighlightText
    ? eventPlannerSolutionTitle.split(eventPlannerHighlightText)
    : [];
  const invitationGalleryBadge = fields.invitationGalleryBadge?.trim();
  const invitationGalleryTitle = fields.invitationGalleryTitle?.trim();
  const invitationGalleryDescription = fields.invitationGalleryDescription?.trim();
  const invitationGalleryCtaText = fields.invitationGalleryCtaText?.trim();
  const invitationGalleryCtaLink = fields.invitationGalleryCtaLink?.trim();
  const sharedInvitationsBadge = fields.sharedInvitationsBadge?.trim();
  const sharedInvitationsTitle = fields.sharedInvitationsTitle?.trim();
  const sharedInvitationsDescription = fields.sharedInvitationsDescription?.trim();
  const sharedInvitationsCtaText = fields.sharedInvitationsCtaText?.trim();
  const sharedInvitationsCtaLink = fields.sharedInvitationsCtaLink?.trim();
  const hasEventPlannerSection = Boolean(
    eventPlannerEyebrow ||
    eventPlannerTitle ||
    eventPlannerHighlight ||
    eventPlannerSuffix ||
    eventPlannerSolutionTitle ||
    eventPlannerSolutionDescription ||
    eventPlannerProblemCards.length ||
    eventPlannerFeatures.length
  );
  const hasInvitationGallerySection = Boolean(
    invitationGalleryBadge ||
    invitationGalleryTitle ||
    invitationGalleryDescription ||
    invitationGalleryCtaText ||
    invitationGalleryItems.length
  );
  const hasSharedInvitationsSection = Boolean(
    sharedInvitationsBadge ||
    sharedInvitationsTitle ||
    sharedInvitationsDescription ||
    sharedInvitationsCtaText ||
    sharedInvitationsItems.length
  );
  const scrollDots = [
    { id: "hero", href: "#home-hero", label: "Đi đến banner", className: "size-4 bg-[#FF6FF5]" },
    { id: "about", href: hasAboutContent ? "#home-about" : "#home-services", label: "Đi đến giới thiệu", className: "size-3.5 bg-[#FF6FF5]/80" },
    { id: "services", href: "#home-services", label: "Đi đến dịch vụ", className: "size-3 bg-[#FF6FF5]/60" },
    { id: "service-items", href: "#home-service-items", label: "Đi đến danh sách dịch vụ", className: "size-3 bg-[#FF6FF5]/60" },
  ];

  return (
    <div>
      <section id="home-hero" className="relative h-screen overflow-hidden bg-gradient-to-b from-[#FFD1F7] to-[#F9F1FF] py-12 sm:py-16 lg:py-0">
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
        <div className="relative z-10 container mx-auto h-full px-4 lg:flex">
          <div className="relative grid h-full w-full grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10 lg:pl-20">
            <div className="flex flex-col justify-center space-y-5 text-center lg:col-span-6 lg:h-full lg:text-left">
              <HeroAnimatedTitle
                topLine={fields.bannerTopLine}
                lineOnePrefix={fields.bannerLine1Prefix}
                lineOneRotating={fields.bannerLine1Rotating}
                lineOneSuffix={fields.bannerLine1Suffix}
                lineTwo={fields.bannerLine2}
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
              <div className="mt-5 flex justify-center lg:mt-7.5 lg:justify-start">
                <GuestLinkButton href={fields.heroButtonLink || ROUTES.ABOUT} className="inline-flex items-center justify-center gap-2.5 uppercase font-semibold bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] hover:bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)]">
                  {fields.heroButtonText}
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="size-5 animate-phone-ring" width="20" height="20" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11.811 6.727C12.825 4.909 13.331 4 14.09 4c.757 0 1.264.909 2.277 2.727l.262.47c.288.517.432.775.657.945c.224.17.504.234 1.063.36l.51.116c1.967.445 2.95.667 3.185 1.42s-.437 1.537-1.778 3.106l-.347.406c-.381.445-.572.668-.658.944s-.057.573 0 1.168l.053.541c.203 2.094.305 3.14-.308 3.605s-1.534.041-3.377-.807l-.476-.22c-.524-.24-.786-.361-1.063-.361c-.278 0-.54.12-1.063.361l-.477.22c-1.842.848-2.763 1.272-3.376.807s-.511-1.511-.309-3.605l.053-.541c.057-.595.086-.892 0-1.168s-.276-.498-.657-.944l-.347-.406C6.57 11.575 5.9 10.79 6.135 10.038s1.218-.975 3.185-1.42l.51-.116c.559-.126.838-.19 1.063-.36s.368-.428.656-.945z" />
                      <path strokeLinecap="round" d="M2.089 16a4.74 4.74 0 0 1 4-.874m-4-4.626c1-.5 1.29-.44 2-.5M2 5.609l.208-.122c2.206-1.292 4.542-1.64 6.745-1.005l.208.06" opacity=".5" />
                    </g>
                  </svg>
                </GuestLinkButton>
              </div>
            </div>
            <div className="flex min-h-[280px] items-center lg:col-span-6 lg:h-full">
              <div className="flex w-full items-center justify-center lg:h-full">
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

              <SmoothScrollLink
                targetId="home-page-end"
                pixelsPerSecond={600}
                aria-label="Cuộn xuống cuối trang"
                className="group pointer-events-auto flex cursor-pointer flex-col items-center gap-y-5 border-0 bg-transparent p-0 transition-colors duration-300 hover:text-[#FF6FF5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6FF5]"
              >
                <span className="breathe-element flex justify-center whitespace-nowrap text-sm font-medium uppercase lg:text-base [--puramu-animation-length:3s]" style={{ writingMode: "sideways-lr" }}>
                  cuộn xuống
                </span>

                <span className="flex flex-col items-center gap-y-5 [--puramu-length:100px] animate-[fade-in-and-slide-down_2s_linear_forwards_infinite]">
                  <svg width="17" height="28" viewBox="0 0 17 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.08963 0C3.62895 0 0 3.62895 0 8.08963V19.4126C0 23.8733 3.62895 27.5022 8.08963 27.5022C12.5503 27.5022 16.1792 23.8733 16.1792 19.4126V8.08963C16.1792 3.62895 12.5503 0 8.08963 0ZM14.5291 19.4126C14.5291 22.9633 11.6403 25.8522 8.08963 25.8522C4.53895 25.8522 1.65008 22.9633 1.65008 19.4126V8.08963C1.65008 4.53895 4.53895 1.65008 8.08963 1.65008C11.6403 1.65008 14.5291 4.53895 14.5291 8.08963V19.4126Z" fill="currentColor" />
                    <path d="M8.08966 5.471C7.63394 5.471 7.26465 5.84029 7.26465 6.29601V10.0934C7.26465 10.5489 7.63394 10.9185 8.08972 10.9185C8.54522 10.9185 8.91473 10.5489 8.91473 10.0934V6.29601C8.91473 5.84029 8.54544 5.471 8.08966 5.471Z" fill="currentColor" />
                  </svg>
                  <span className="h-25 w-[2px] bg-gradient-to-b from-current to-black/60 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                </span>
              </SmoothScrollLink>
            </div>
          </div>
        </div>
      </section>

      <div className="guest-soft-top-bg contact-wave-bg relative isolate overflow-hidden">
        <GuestMarketingPageDecor ambientGlowDensity="regular" />
        <div className="relative z-10">
          <div className="space-y-14 py-10 lg:space-y-18 lg:py-16">
        <HomeStatsSection items={homeStats} />

        {hasAboutContent ? (
          <section id="home-about" className="container mx-auto px-4">
              <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="space-y-6">
                  <HomePanelHeader
                    eyebrow="Giới thiệu"
                    title={fields.aboutTitle}
                    description={fields.aboutDescription ? undefined : fields.aboutText1}
                  />
                  {fields.aboutDescription ? (
                    <div
                      className={`${RICH_TEXT_CONTENT_CLASSNAME} text-stone-600`}
                      dangerouslySetInnerHTML={createRichTextMarkup(fields.aboutDescription)}
                    />
                  ) : null}
                  {aboutImage ? (
                    <div className="relative aspect-[4/3] max-w-lg overflow-hidden rounded-[24px] border border-[#f8d8f4] bg-[#fff5fd] shadow-[0_14px_34px_rgba(35,31,39,0.07)]">
                      <Image src={aboutImage} alt={fields.aboutTitle || "Giới thiệu"} fill className="object-cover" sizes="(min-width: 1024px) 42vw, 100vw" />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-5">
                  {hasAboutTexts ? (
                    <div className="space-y-3 text-sm leading-7 text-stone-600 md:text-base">
                      {fields.aboutText1?.trim() ? <p>{fields.aboutText1}</p> : null}
                      {fields.aboutText2?.trim() ? <p>{fields.aboutText2}</p> : null}
                      {fields.aboutText3?.trim() ? <p>{fields.aboutText3}</p> : null}
                    </div>
                  ) : null}

                  {aboutItems.length ? (
                    <div className="grid gap-4">
                      {aboutItems.map((item) => (
                        <article key={`${item.label}-${item.content}`} className="rounded-[24px] border border-[#f8d8f4] bg-white p-5 shadow-[0_14px_34px_rgba(35,31,39,0.07)]">
                          <div className="flex gap-4">
                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white">
                              {item.label}
                            </span>
                            <p className="text-sm leading-7 text-stone-600 md:text-base">{item.content}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
          </section>
        ) : null}

        {page.body ? (
          <section id="home-body" className="container mx-auto px-4">
              <div
                className={`relative z-10 mx-auto max-w-5xl text-stone-700 ${RICH_TEXT_CONTENT_CLASSNAME}`}
                dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
              />
          </section>
        ) : null}

        <section id="home-services" className="container mx-auto px-4">
            <div id="home-service-items" className="relative z-10">
              <ServiceGroupSection
                eyebrow="Nhóm dịch vụ"
                title="Chọn đúng dịch vụ theo nhu cầu cưới"
                description="Mỗi nhóm dịch vụ có thể mở rộng thành offering, provider, đơn hàng và lịch triển khai riêng trong hệ thống."
                items={resolvedServiceItems}
                action={(
                  <GuestLinkButton href={ROUTES.SERVICES} className="rounded-full px-7 py-3 text-sm font-semibold uppercase">
                    Xem toàn bộ dịch vụ
                  </GuestLinkButton>
                )}
                theme="home"
                gridClassName="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
              />
            </div>
        </section>

        {hasEventPlannerSection ? (
          <section id="home-event-planner" className="container mx-auto px-4">
              <div className="relative z-10 space-y-8">
                <HomePanelHeader
                  eyebrow={eventPlannerEyebrow || "Wedding planner"}
                  title={[eventPlannerTitle, eventPlannerHighlight, eventPlannerSuffix].filter(Boolean).join(" ")}
                  description={eventPlannerSolutionDescription}
                  align="center"
                />

                {eventPlannerProblemCards.length ? (
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
                ) : null}

                {(eventPlannerSolutionTitle || eventPlannerCtaText) ? (
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
                ) : null}

                {eventPlannerFeatures.length ? (
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
                ) : null}
              </div>
          </section>
        ) : null}

        {hasInvitationGallerySection ? (
          <section id="home-invitation-gallery" className="container mx-auto px-4">
              <div className="relative z-10">
                <PagedCarousel
                  itemsPerPage={4}
                  controlsVariant="buttons"
                  controlsPosition="header"
                  gridClassName="grid cursor-grab touch-pan-y select-none gap-4 lg:gap-5 active:cursor-grabbing sm:grid-cols-2 lg:grid-cols-4"
                  header={(
                    <HomePanelHeader
                      eyebrow={invitationGalleryBadge ? `${invitationGalleryBadge} Invitation gallery` : "Invitation gallery"}
                      title={invitationGalleryTitle}
                      description={invitationGalleryDescription}
                    />
                  )}
                  actions={invitationGalleryCtaText ? (
                    <GuestLinkButton href={invitationGalleryCtaLink || ROUTES.TEMPLATES} className="hidden rounded-full px-6 py-3 text-sm font-semibold sm:inline-flex">
                      {invitationGalleryCtaText}
                    </GuestLinkButton>
                  ) : null}
                >
                  {invitationGalleryItems.map((offering) => (
                    offering.offeringType === "digital_template" ? (
                      <LoopOnlineInvitationCard key={offering.id} offering={offering} className="w-full shrink-0" />
                    ) : (
                      <LoopOfferingCard key={offering.id} offering={offering} className="w-full shrink-0" />
                    )
                  ))}
                </PagedCarousel>
                {invitationGalleryCtaText ? (
                  <div className="mt-7 flex justify-center sm:hidden">
                    <GuestLinkButton href={invitationGalleryCtaLink || ROUTES.TEMPLATES} className="rounded-full px-6 py-3 text-sm font-semibold">
                      {invitationGalleryCtaText}
                    </GuestLinkButton>
                  </div>
                ) : null}
              </div>
          </section>
        ) : null}

        {hasSharedInvitationsSection ? (
          <section id="home-shared-invitations" className="container mx-auto px-4">
              <div className="relative z-10">
                <PagedCarousel
                  itemsPerPage={4}
                  controlsVariant="buttons"
                  controlsPosition="header"
                  gridClassName="grid cursor-grab touch-pan-y select-none gap-4 lg:gap-5 active:cursor-grabbing sm:grid-cols-2 lg:grid-cols-4"
                  header={(
                    <HomePanelHeader
                      eyebrow={sharedInvitationsBadge ? `${sharedInvitationsBadge} Shared invitations` : "Shared invitations"}
                      title={sharedInvitationsTitle}
                      description={sharedInvitationsDescription}
                    />
                  )}
                  actions={sharedInvitationsCtaText ? (
                    <GuestLinkButton href={sharedInvitationsCtaLink || ROUTES.TEMPLATES} className="hidden rounded-full px-6 py-3 text-sm font-semibold sm:inline-flex">
                      {sharedInvitationsCtaText}
                    </GuestLinkButton>
                  ) : null}
                >
                  {sharedInvitationsItems.map((offering) => (
                    offering.offeringType === "digital_template" ? (
                      <LoopOnlineInvitationCard key={offering.id} offering={offering} className="w-full shrink-0" />
                    ) : (
                      <LoopOfferingCard key={offering.id} offering={offering} className="w-full shrink-0" />
                    )
                  ))}
                </PagedCarousel>
                {sharedInvitationsCtaText ? (
                  <div className="mt-7 flex justify-center sm:hidden">
                    <GuestLinkButton href={sharedInvitationsCtaLink || ROUTES.TEMPLATES} className="rounded-full px-6 py-3 text-sm font-semibold">
                      {sharedInvitationsCtaText}
                    </GuestLinkButton>
                  </div>
                ) : null}
              </div>
          </section>
        ) : null}

            <GlobalFaqSection className="pb-6" containerClassName="container mx-auto px-4" />
          </div>
          <div id="home-page-end" className="h-px" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
