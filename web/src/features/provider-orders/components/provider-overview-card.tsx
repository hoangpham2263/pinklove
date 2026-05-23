import {
  OverviewCardTemplate,
  OverviewGridTemplate,
  type OverviewCardTemplateProps,
  type OverviewGridTemplateProps,
} from "@/components/common/overview-card-template";

export type ProviderOverviewGridProps = OverviewGridTemplateProps;
export type ProviderOverviewCardProps = OverviewCardTemplateProps;

export function ProviderOverviewGrid(props: ProviderOverviewGridProps) {
  return <OverviewGridTemplate {...props} />;
}

export function ProviderOverviewCard(props: ProviderOverviewCardProps) {
  return <OverviewCardTemplate {...props} />;
}
