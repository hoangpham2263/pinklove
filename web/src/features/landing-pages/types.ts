import type { Offering } from "@/features/offerings/types";

export type LandingPageType = "default" | "landing" | "seo" | "campaign" | "ab_test";
export type LandingPageStatus = "draft" | "published" | "archived" | "disabled";
export type LandingPageNavLink = {
  label: string;
  href: string;
};
export type LandingPageSectionType =
  | "hero"
  | "gallery"
  | "video"
  | "reviews"
  | "faq"
  | "countdown"
  | "cta"
  | "pricing"
  | "features"
  | "related_products"
  | "custom";

export type CampaignChannel = "facebook" | "tiktok" | "google" | "email" | "affiliate" | "organic";
export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type AbExperimentStatus = "draft" | "running" | "paused" | "completed" | "archived";
export type AbExperimentMetric = "views" | "clicks" | "add_to_cart" | "checkout" | "orders" | "revenue";
export type LandingPageTemplateId = "fashion" | "tiktok" | "cod" | "seo" | "luxury";

export const LANDING_PAGE_TYPES: LandingPageType[] = ["default", "landing", "seo", "campaign", "ab_test"];
export const LANDING_PAGE_STATUSES: LandingPageStatus[] = ["draft", "published", "archived", "disabled"];
export const LANDING_PAGE_SECTION_TYPES: LandingPageSectionType[] = [
  "hero",
  "gallery",
  "video",
  "reviews",
  "faq",
  "countdown",
  "cta",
  "pricing",
  "features",
  "related_products",
  "custom",
];
export const CAMPAIGN_CHANNELS: CampaignChannel[] = ["facebook", "tiktok", "google", "email", "affiliate", "organic"];
export const CAMPAIGN_STATUSES: CampaignStatus[] = ["draft", "active", "paused", "completed", "archived"];
export const AB_EXPERIMENT_STATUSES: AbExperimentStatus[] = ["draft", "running", "paused", "completed", "archived"];
export const AB_EXPERIMENT_METRICS: AbExperimentMetric[] = ["views", "clicks", "add_to_cart", "checkout", "orders", "revenue"];

export type LandingPage = {
  id: string;
  sourceOfferingId?: string;
  name: string;
  slug: string;
  pageType: LandingPageType;
  status: LandingPageStatus;
  themeConfig: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  sectionCount?: number;
  campaignCount?: number;
};

export type LandingPageWithSource = LandingPage & {
  sourceOfferingName?: string;
  sourceOfferingSlug?: string;
  sourceOfferingType?: Offering["offeringType"];
  sourceTemplateEngine?: Offering["templateEngine"];
};

export type LandingPageSection = {
  id: string;
  landingPageId: string;
  sectionType: LandingPageSectionType;
  sortOrder: number;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type LandingPageTemplate = {
  id: LandingPageTemplateId;
  name: string;
  slug: string;
  description: string;
  pageType: LandingPageType;
  themeConfig: Record<string, unknown>;
  sections: Array<{
    sectionType: LandingPageSectionType;
    content: Record<string, unknown>;
  }>;
};

export type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  landingPageId: string;
  status: CampaignStatus;
  budget: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignStats = {
  campaignId: string;
  views: number;
  clicks: number;
  addToCart: number;
  checkout: number;
  orders: number;
  revenue: number;
  roas: number;
  updatedAt: string;
};

export type AbExperiment = {
  id: string;
  name: string;
  status: AbExperimentStatus;
  primaryMetric: AbExperimentMetric;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AbExperimentLandingPage = {
  experimentId: string;
  landingPageId: string;
  trafficPercent: number;
  createdAt: string;
  updatedAt: string;
};
