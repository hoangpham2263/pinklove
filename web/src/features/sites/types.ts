export type WeddingSiteType = "coded_template" | "builder_template";
export type WeddingSiteStatus = "draft" | "published";

export type WeddingSite = {
  id: string;
  userId: string;
  productId?: string;
  productName?: string;
  title: string;
  slug: string;
  siteType: WeddingSiteType;
  templateKey: string;
  status: WeddingSiteStatus;
  customData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
