import {
  OverviewCardTemplate,
  OverviewGridTemplate,
  type OverviewCardTemplateProps,
  type OverviewGridTemplateProps,
} from "@/components/common/overview-card-template";

export type VendorOverviewGridProps = OverviewGridTemplateProps;
export type VendorOverviewCardProps = OverviewCardTemplateProps;

export function VendorOverviewGrid(props: VendorOverviewGridProps) {
  return <OverviewGridTemplate {...props} />;
}

export function VendorOverviewCard(props: VendorOverviewCardProps) {
  return <OverviewCardTemplate {...props} />;
}
