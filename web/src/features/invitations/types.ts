export type InvitationType = "coded" | "editable";
export type InvitationStatus = "draft" | "published";

export type InvitationSite = {
  id: string;
  userId: string;
  offeringId?: string;
  offeringName?: string;
  offeringThumbnailUrl?: string;
  title: string;
  slug: string;
  siteType: InvitationType;
  templateKey: string;
  status: InvitationStatus;
  customData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
