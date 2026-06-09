import type { ComponentType } from "react";
import type { LandingPage, LandingPageSection, LandingPageTemplate, LandingPageTemplateId } from "@/features/landing-pages/types";
import type { Offering } from "@/features/offerings/types";
import { codLandingTemplate, CodLandingPage } from "./cod";
import { fashionLandingTemplate, FashionLandingPage } from "./fashion";
import { luxuryLandingTemplate, LuxuryLandingPage } from "./luxury";
import { seoLandingTemplate, SeoLandingPage } from "./seo";
import { tiktokLandingTemplate, TikTokLandingPage } from "./tiktok";

export type LandingPageTemplateComponent = ComponentType<{
  offering: Offering;
  landingPage: LandingPage;
  sections: LandingPageSection[];
}>;

export type LandingPageTemplateDefinition = LandingPageTemplate & {
  component: LandingPageTemplateComponent;
};

export const LANDING_PAGE_TEMPLATES: LandingPageTemplateDefinition[] = [
  { ...fashionLandingTemplate, component: FashionLandingPage },
  { ...tiktokLandingTemplate, component: TikTokLandingPage },
  { ...codLandingTemplate, component: CodLandingPage },
  { ...seoLandingTemplate, component: SeoLandingPage },
  { ...luxuryLandingTemplate, component: LuxuryLandingPage },
];

export function getLandingPageTemplate(templateId: string): LandingPageTemplateDefinition | null {
  return LANDING_PAGE_TEMPLATES.find((template) => template.id === (templateId as LandingPageTemplateId)) ?? null;
}

export function getLandingPageTemplateForPage(landingPage: LandingPage): LandingPageTemplateDefinition | null {
  const templateId = typeof landingPage.themeConfig.templateId === "string" ? landingPage.themeConfig.templateId : landingPage.slug;
  return getLandingPageTemplate(templateId);
}

export function renderLandingPage({
  offering,
  landingPage,
  sections,
}: {
  offering: Offering;
  landingPage: LandingPage;
  sections: LandingPageSection[];
}) {
  const template = getLandingPageTemplateForPage(landingPage);
  if (!template) {
    return null;
  }

  const LandingPage = template.component;
  return <LandingPage offering={offering} landingPage={landingPage} sections={sections} />;
}

