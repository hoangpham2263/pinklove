import {
  OverviewCardTemplate,
  OverviewGridTemplate,
  type OverviewCardTemplateProps,
  type OverviewGridTemplateProps,
} from "@/components/common/overview-card-template";

export type AdminOverviewGridProps = OverviewGridTemplateProps;
export type AdminOverviewCardProps = OverviewCardTemplateProps;

export function AdminOverviewGrid(props: AdminOverviewGridProps) {
  return <OverviewGridTemplate {...props} />;
}

export function AdminOverviewCard(props: AdminOverviewCardProps) {
  return <OverviewCardTemplate {...props} />;
}
