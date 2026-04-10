export type InvitationType = "coded_template" | "builder_template";
export type InvitationStatus = "draft" | "published";

export type InvitationSite = {
  id: string;
  userId: string;
  productId?: string;
  productName?: string;
  title: string;
  slug: string;
  siteType: InvitationType;
  templateKey: string;
  status: InvitationStatus;
  customData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
