import type { LandingPageTemplate } from "@/features/landing-pages/types";
import { getContentString, getContentStringArray, getSectionContent, PriceLine, ProductImage, LandingPageCta, LandingPageFrame, type LandingPageTemplateProps } from "./shared";

export const tiktokLandingTemplate: LandingPageTemplate = {
  id: "tiktok",
  name: "TikTok Fast Offer",
  slug: "tiktok",
  description: "Landing page ngắn, mạnh, ưu tiên video, social proof và CTA nhanh.",
  pageType: "campaign",
  themeConfig: {
    templateId: "tiktok",
    palette: "high-contrast",
    typography: "bold-sans",
    accentColor: "#111111",
  },
  sections: [
    {
      sectionType: "video",
      content: {
        title: "TikTok pick trong 15 giây",
        provider: "tiktok",
        autoplay: true,
        hook: "Xem nhanh - hiểu nhanh - đặt nhanh",
      },
    },
    {
      sectionType: "hero",
      content: {
        headline: "Đặt nhanh trong một lần chạm",
        subheadline: "Landing page tối ưu traffic social: thông điệp ngắn, bằng chứng rõ và CTA luôn nằm trong tầm mắt.",
      },
    },
    {
      sectionType: "features",
      content: {
        title: "Dành cho traffic nóng",
        items: ["15s hook", "Social proof", "One CTA", "COD ready"],
      },
    },
    {
      sectionType: "reviews",
      content: {
        title: "Được chọn nhiều tuần này",
        style: "social_proof",
        metrics: ["128 đơn trong campaign", "4.9/5 phản hồi", "73% khách bấm CTA sau video"],
      },
    },
    {
      sectionType: "countdown",
      content: {
        title: "Ưu đãi campaign còn hiệu lực",
        mode: "evergreen",
        durationMinutes: 30,
      },
    },
    {
      sectionType: "pricing",
      content: {
        layout: "single_offer",
        buttonLabel: "Mua ngay",
        highlightDiscount: true,
      },
    },
  ],
};

export function TikTokLandingPage({ offering, landingPage, sections }: LandingPageTemplateProps) {
  const hero = getSectionContent(sections, "hero");
  const video = getSectionContent(sections, "video");
  const pricing = getSectionContent(sections, "pricing");
  const features = getSectionContent(sections, "features");
  const items = getContentStringArray(features, "items", ["15s hook", "Social proof", "One CTA", "COD ready"]);

  return (
    <LandingPageFrame offering={offering} landingPage={landingPage} className="bg-neutral-950 text-white">
    <main>
      <section className="grid min-h-screen gap-8 px-5 pb-12 pt-28 md:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col justify-center">
          <p className="w-fit bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-neutral-950">{getContentString(video, "title", "Trending offer")}</p>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] md:text-7xl">{getContentString(hero, "headline", offering.name)}</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-neutral-300">{getContentString(hero, "subheadline", offering.excerpt || offering.description || "")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LandingPageCta offering={offering} label={getContentString(pricing, "buttonLabel", "Mua ngay")} className="bg-white text-neutral-950 hover:bg-neutral-200" />
            <PriceLine offering={offering} className="text-white" />
          </div>
        </div>
        <div className="grid items-center gap-4 md:grid-cols-[1fr_0.7fr]">
          <div className="overflow-hidden rounded-[28px] border-4 border-white/15 bg-neutral-900 p-3">
            <ProductImage offering={offering} className="aspect-[9/16] rounded-[20px]" />
          </div>
          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item} className="bg-white px-5 py-4 text-xl font-black text-neutral-950">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </main>
    </LandingPageFrame>
  );
}
