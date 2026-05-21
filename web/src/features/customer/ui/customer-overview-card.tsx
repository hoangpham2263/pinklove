import {
  OverviewCardTemplate,
  OverviewGridTemplate,
  type OverviewCardTemplateProps,
  type OverviewGridTemplateProps,
} from "@/components/common/overview-card-template";

export type CustomerOverviewGridProps = OverviewGridTemplateProps;
export type CustomerOverviewCardProps = OverviewCardTemplateProps;

export function CustomerOverviewGrid(props: CustomerOverviewGridProps) {
  return <OverviewGridTemplate {...props} />;
}

export function CustomerOverviewCard(props: CustomerOverviewCardProps) {
  return <OverviewCardTemplate {...props} />;
}
