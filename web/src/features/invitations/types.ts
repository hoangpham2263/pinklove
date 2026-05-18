export type InvitationType = "coded_template" | "builder";
export type InvitationStatus = "draft" | "published";

export type InvitationSite = {
  id: string;
  userId: string;
  productId?: string;
  productName?: string;
  productThumbnailUrl?: string;
  title: string;
  slug: string;
  siteType: InvitationType;
  templateKey: string;
  status: InvitationStatus;
  customData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
