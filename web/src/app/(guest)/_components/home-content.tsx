import Image from "next/image";
import { EventPlannerTitleAccent } from "@/app/(guest)/_components/event-planner-title-accent";
import { GlobalFaqSection } from "@/app/(guest)/_components/global-faq-section";
import { GuestLinkButton } from "@/app/(guest)/_components/guest-ui";
import { GuestAnimatedCtaButton } from "@/app/(guest)/_components/guest-animated-cta-button";
import { HeroAnimatedTitle } from "@/app/(guest)/_components/hero-animated-title";
import { HeroInvitationOrb } from "@/app/(guest)/_components/hero-invitation-orb";
import { listPublishedProducts } from "@/features/products/server/service";
import { LoopOnlineInvitationCard } from "@/features/products/components/LoopOnlineInvitationCard";
import { LoopProductCard } from "@/features/products/components/LoopProductCard";
import { SmoothScrollLink } from "@/app/(guest)/_components/smooth-scroll-link";
import type { ManagedPage } from "@/lib/managed-pages";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";

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
    servicesTitle?: string;
    servicesDescription?: string;
    serviceItems?: Array<{
      headerImage?: string;
      title?: string;
      description?: string;
      descriptionItems?: string;
    }>;
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
    invitationGalleryProductSlugs?: string[];
    sharedInvitationsBadge?: string;
    sharedInvitationsTitle?: string;
    sharedInvitationsDescription?: string;
    sharedInvitationsCtaText?: string;
    sharedInvitationsCtaLink?: string;
    sharedInvitationsProductSlugs?: string[];
  }>(page);

  const serviceItems = (Array.isArray(fields.serviceItems) ? fields.serviceItems : []).filter(
    (item) => item.title?.trim() || item.description?.trim() || item.descriptionItems?.trim() || item.headerImage?.trim()
  );

  const resolvedServiceItems = await Promise.all(
    (serviceItems.length > 0
      ? serviceItems
      : [
        {
          title: "Design Consultation",
          description: "Our professional team is always ready to help.",
          descriptionItems: "Idea planning\nPersonalized advice\nFast deployment",
        },
        {
          title: "Turnkey Solutions",
          description: "Ensuring high quality and timely completion.",
          descriptionItems: "Template selection\nContent setup\nPublishing support",
        },
        {
          title: "Maintenance",
          description: "Always by your side throughout the journey.",
          descriptionItems: "Easy updates\nGuest support\nContinuous improvements",
        },
      ])
      .map(async (item) => ({
        image: await resolveMediaUrl(item.headerImage),
        title: item.title?.trim() || "",
        description: item.description?.trim() || "",
        descriptionItems: String(item.descriptionItems ?? "")
          .split(/\r?\n/)
          .map((entry) => entry.trim())
          .filter(Boolean),
      }))
  );

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
  const publishedProducts = await listPublishedProducts();
  const invitationGalleryProductSlugs = Array.isArray(fields.invitationGalleryProductSlugs)
    ? fields.invitationGalleryProductSlugs.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const publishedProductMap = new Map(publishedProducts.map((item) => [item.slug, item] as const));
  const invitationGalleryItems = invitationGalleryProductSlugs
    .map((slug) => publishedProductMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.thumbnailUrl?.trim());
  const sharedInvitationsProductSlugs = Array.isArray(fields.sharedInvitationsProductSlugs)
    ? fields.sharedInvitationsProductSlugs.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const sharedInvitationsItems = sharedInvitationsProductSlugs
    .map((slug) => publishedProductMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.thumbnailUrl?.trim());
  const heroPreviewProducts = (
    invitationGalleryItems.length
      ? invitationGalleryItems
      : sharedInvitationsItems.length
        ? sharedInvitationsItems
        : publishedProducts.filter((item) => item.thumbnailUrl?.trim())
  ).slice(0, 8);
  const heroPreviewTrack = heroPreviewProducts.length > 0
    ? [...heroPreviewProducts, ...heroPreviewProducts]
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
                <HeroInvitationOrb products={heroPreviewTrack} />
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

      <section id="home-about" className="py-10 lg:py-15 2xl:py-20 bg-gradient-to-b from-[#FF6FF5] to-[#f5dbef] ">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-10 lg:gap-15 2xl:gap-20">
            <div className="col-span-12 lg:col-span-6 space-y-5 lg:space-y-7.5">
              {fields.aboutTitle ? (<h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold bg-[linear-gradient(90deg,#ADD3C1_0%,#FFFFFF_50%,#ADD3C1_100%)] bg-no-repeat bg-clip-text text-transparent">{fields.aboutTitle}</h2>) : null}
              {fields.aboutDescription ? (<div className={`${RICH_TEXT_CONTENT_CLASSNAME} text-white`} dangerouslySetInnerHTML={createRichTextMarkup(fields.aboutDescription)} />) : null}
              <div className="overflow-hidden rounded-xl max-w-lg">
                {aboutImage ? (
                  <Image src={aboutImage} alt={fields.aboutTitle || "About us"} fill className="!relative object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                ) : null}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6 flex flex-col justify-center space-y-5 lg:space-y-7.5">
              {hasAboutTexts ? (
                <div className="space-y-7.5">
                  {fields.aboutText1?.trim() ? (
                    <p className="text-sm md:text-base lg:text-lg text-white">{fields.aboutText1}</p>
                  ) : null}
                  {fields.aboutText2?.trim() ? (
                    <p className="text-sm md:text-base lg:text-lg text-white">{fields.aboutText2}</p>
                  ) : null}
                  {fields.aboutText3?.trim() ? (
                    <p className="text-sm md:text-base lg:text-lg text-white">{fields.aboutText3}</p>
                  ) : null}
                </div>
              ) : null}

              {aboutItems.length ? (
                <div className="space-y-5 lg:space-y-7.5">
                  {aboutItems.map((item) => (
                    <div key={`${item.label}-${item.content}`} className="flex items-center gap-x-5 px-5 lg:px-7.5 py-5 lg:py-7.5 bg-gradient-to-r from-[#111111] to-[#111111]/35 rounded-full">
                      <h3 className="text-base md:text-lg lg:text-xl font-semibold uppercase text-guest-primary">{item.label}</h3>
                      <p className="text-sm md:text-base text-white">{item.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {page.body ? (
        <section id="home-body" className="pt-10 lg:pt-15 2 xl:pt-20">
          <div className="container mx-auto px-4">
            <div
              className={`mx-auto max-w-5xl ${RICH_TEXT_CONTENT_CLASSNAME}`}
              dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
            />
          </div>
        </section>
      ) : null}

      <section id="home-services" className="pt-10 lg:pt-15 2 xl:pt-20">
        <div className="container mx-auto px-4 pb-16">
          <div className="mb-12 text-center">
            <h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold">
              {fields.servicesTitle || "Our Services"}
            </h2>
            {fields.servicesDescription ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base lg:text-lg">
                {fields.servicesDescription}
              </p>
            ) : null}
          </div>
          <div id="home-service-items" className="grid gap-8 md:grid-cols-3">
            {resolvedServiceItems.map((feature, index) => (
              <article
                key={`${feature.title}-${index}`}
                className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_18px_40px_rgba(35,31,39,0.08)]"
              >
                {feature.image ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                    <Image
                      src={feature.image}
                      alt={feature.title || `Service ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 33vw, 100vw"
                    />
                  </div>
                ) : null}
                <div className="space-y-4 p-8">
                  {feature.title ? (
                    <h3 className="text-xl font-semibold text-stone-900">{feature.title}</h3>
                  ) : null}
                  {feature.description ? (
                    <p className="text-sm md:text-base lg:text-lg text-stone-600">{feature.description}</p>
                  ) : null}
                  {feature.descriptionItems.length ? (
                    <ul className="space-y-2 text-sm text-stone-600 md:text-base">
                      {feature.descriptionItems.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FF6FF5]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {hasEventPlannerSection ? (
        <section id="home-event-planner" className="overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,171,196,0.22),transparent_32%),linear-gradient(180deg,#fff7f8_0%,#ffffff_48%,#fff8f4_100%)] py-14 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto space-y-5 lg:space-y-7.5">
              {(eventPlannerEyebrow || eventPlannerTitle || eventPlannerHighlight || eventPlannerSuffix) ? (
                <div className="flex justify-center gap-5">
                  <div className="flex flex-col items-end gap-2">
                    {eventPlannerEyebrow ? <span className="text-lg lg:text-3xl 2xl:text-4xl font-black uppercase tracking-tight">{eventPlannerEyebrow}</span> : null}
                    {eventPlannerTitle ? <span className="relative text-lg lg:text-3xl 2xl:text-4xl font-black uppercase tracking-tight">
                      <EventPlannerTitleAccent
                        className="absolute right-[calc(100%+20px)] top-1/2 -translate-y-1/2 w-25 h-auto"
                      />
                      {eventPlannerTitle}</span> : null}
                  </div>
                  <div className="flex items-end gap-2">
                    {eventPlannerHighlight ? <span className="font-['Brush_Script_MT','Segoe_Script',cursive] text-2xl lg:text-[100px] leading-[60px] text-guest-primary">{eventPlannerHighlight}</span> : null}
                    {eventPlannerSuffix ? <span className="text-lg lg:text-3xl 2xl:text-4xl font-black uppercase">{eventPlannerSuffix}</span> : null}
                  </div>
                </div>
              ) : null}

              {eventPlannerProblemCards.length ? (
                <div className="grid gap-5 md:grid-cols-3">
                  {eventPlannerProblemCards.map((item, index) => (
                    <article
                      key={`${item.title}-${item.description}-${index}`}
                      className="rounded-[28px] border border-[#f7e6e8] bg-white px-6 py-8 text-center shadow-[0_18px_40px_rgba(219,110,126,0.12)]"
                    >
                      <div className="mx-auto mb-5 flex h-24 items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={112}
                            height={112}
                            className="h-auto max-h-24 w-auto object-contain"
                          />
                        ) : (
                          <div className="flex size-20 items-center justify-center rounded-full bg-[#fff4f2] text-4xl text-[#d9a79e]">
                            ?
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold sm:text-xl">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#63606d] sm:text-base">{item.description}</p>
                    </article>
                  ))}
                </div>
              ) : null}

              {(eventPlannerSolutionTitle || eventPlannerSolutionDescription || eventPlannerCtaText) ? (
                <div className="mx-auto max-w-5xl text-center">
                  {eventPlannerSolutionTitle ? (
                    <h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold uppercase leading-tight tracking-tight">
                      {eventPlannerTitleParts.length > 1 ? (
                        eventPlannerTitleParts.map((part, index) => (
                          <span key={`${part}-${index}`}>
                            {part}
                            {index < eventPlannerTitleParts.length - 1 ? (
                              <span className="bg-[linear-gradient(90deg,#d64f5b_0%,#f6a6b1_100%)] bg-clip-text text-transparent">
                                {eventPlannerHighlightText}
                              </span>
                            ) : null}
                          </span>
                        ))
                      ) : (
                        eventPlannerSolutionTitle
                      )}
                    </h2>
                  ) : null}
                  {eventPlannerSolutionDescription ? (
                    <p className="mx-auto mt-5 max-w-4xl text-base leading-8 text-[#3d3744] sm:text-lg">
                      {eventPlannerSolutionDescription}
                    </p>
                  ) : null}
                  {eventPlannerCtaText ? (
                    <div className="mt-8">
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
                      className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-[#f2e8ea] bg-white p-7 shadow-[0_18px_40px_rgba(45,35,66,0.08)]"
                    >
                      <div className="max-w-[15rem]">
                        <h3 className="text-2xl font-black leading-tight tracking-tight">
                          {item.title}
                        </h3>
                        <p className="mt-5 text-base leading-8 text-[#63606d]">
                          {item.description}
                        </p>
                      </div>
                      {item.accentImage ? (
                        <div className="pointer-events-none absolute bottom-5 right-5 flex size-24 select-none items-center justify-center opacity-90">
                          <Image
                            src={item.accentImage}
                            alt=""
                            width={120}
                            height={120}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasInvitationGallerySection ? (
        <section id="home-invitation-gallery" className="overflow-hidden bg-white py-14 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-[92rem]">
              <div className="mx-auto max-w-5xl text-left">
                {invitationGalleryBadge ? (
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-[#ffd8dd] text-xl text-[#d55363] shadow-[0_10px_24px_rgba(213,83,99,0.12)]">
                    {invitationGalleryBadge}
                  </div>
                ) : null}
                {invitationGalleryTitle ? (
                  <h2 className="inline-block max-w-4xl text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold uppercase leading-[1.08] tracking-tight">
                    {invitationGalleryTitle}
                  </h2>
                ) : null}
                {invitationGalleryDescription ? (
                  <p className="mt-4 max-w-4xl text-base leading-8 text-[#6a6876] sm:text-xl">
                    {invitationGalleryDescription}
                  </p>
                ) : null}
              </div>

              {invitationGalleryItems.length ? (
                <div className="relative mt-10 lg:mt-14">
                  <div className="pointer-events-none absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-2xl text-[#8e8b96] shadow-[0_12px_30px_rgba(35,31,39,0.12)]">
                      ‹
                    </div>
                  </div>
                  <div className="pointer-events-none absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-2xl text-[#8e8b96] shadow-[0_12px_30px_rgba(35,31,39,0.12)]">
                      ›
                    </div>
                  </div>

                  <div className="-mx-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex min-w-max gap-4 lg:gap-5">
                      {invitationGalleryItems.map((product) => (
                        product.productType !== "general_product" ? (
                          <LoopOnlineInvitationCard
                            key={product.id}
                            product={product}
                            className="h-[24rem] w-[15rem] shrink-0"
                          />
                        ) : (
                          <LoopProductCard
                            key={product.id}
                            product={product}
                            className="h-[24rem] w-[15rem] shrink-0"
                          />
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {invitationGalleryCtaText ? (
                <div className="mt-10 flex justify-center">
                  <GuestLinkButton
                    href={invitationGalleryCtaLink || ROUTES.TEMPLATES}
                    className="inline-flex items-center justify-center gap-3 rounded-full border-0 bg-[linear-gradient(90deg,#e45b66_0%,#d94d5d_100%)] px-9 py-4 text-lg font-bold text-white shadow-[0_16px_34px_rgba(217,77,93,0.28)] hover:opacity-95"
                  >
                    <span>{invitationGalleryCtaText}</span>
                    <span aria-hidden="true" className="text-lg">➤</span>
                  </GuestLinkButton>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasSharedInvitationsSection ? (
        <section id="home-shared-invitations" className="overflow-hidden bg-white py-14 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-[92rem]">
              <div className="mx-auto max-w-5xl text-left">
                {sharedInvitationsBadge ? (
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-[#ffd8dd] text-xl text-[#d55363] shadow-[0_10px_24px_rgba(213,83,99,0.12)]">
                    {sharedInvitationsBadge}
                  </div>
                ) : null}
                {sharedInvitationsTitle ? (
                  <h2 className="inline-block max-w-4xl text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold uppercase leading-[1.08] tracking-tight">
                    {sharedInvitationsTitle}
                  </h2>
                ) : null}
                {sharedInvitationsDescription ? (
                  <p className="mt-4 max-w-4xl text-base leading-8 text-[#6a6876] sm:text-xl">
                    {sharedInvitationsDescription}
                  </p>
                ) : null}
              </div>

              {sharedInvitationsItems.length ? (
                <div className="relative mt-10 lg:mt-14">
                  <div className="pointer-events-none absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-2xl text-[#8e8b96] shadow-[0_12px_30px_rgba(35,31,39,0.12)]">
                      ‹
                    </div>
                  </div>
                  <div className="pointer-events-none absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                    <div className="flex size-11 items-center justify-center rounded-full bg-white text-2xl text-[#8e8b96] shadow-[0_12px_30px_rgba(35,31,39,0.12)]">
                      ›
                    </div>
                  </div>

                  <div className="-mx-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex min-w-max gap-4 lg:gap-5">
                      {sharedInvitationsItems.map((product) => (
                        product.productType !== "general_product" ? (
                          <LoopOnlineInvitationCard
                            key={product.id}
                            product={product}
                            className="h-[24rem] w-[15rem] shrink-0"
                          />
                        ) : (
                          <LoopProductCard
                            key={product.id}
                            product={product}
                            className="h-[24rem] w-[15rem] shrink-0"
                          />
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {sharedInvitationsCtaText ? (
                <div className="mt-10 flex justify-center">
                  <GuestLinkButton
                    href={sharedInvitationsCtaLink || ROUTES.TEMPLATES}
                    className="inline-flex items-center justify-center gap-3 rounded-full border-0 bg-[linear-gradient(90deg,#e45b66_0%,#d94d5d_100%)] px-9 py-4 text-lg font-bold text-white shadow-[0_16px_34px_rgba(217,77,93,0.28)] hover:opacity-95"
                  >
                    <span>{sharedInvitationsCtaText}</span>
                    <span aria-hidden="true" className="text-lg">➤</span>
                  </GuestLinkButton>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <GlobalFaqSection className="pb-16" containerClassName="container mx-auto px-4" />
      <div id="home-page-end" className="h-px" aria-hidden="true" />
    </div>
  );
}
