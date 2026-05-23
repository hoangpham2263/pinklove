import {
  TableThumbnailTemplate,
  type TableThumbnailTemplateProps,
} from "@/components/common/table-thumbnail-template";

export type ProviderTableThumbnailProps = TableThumbnailTemplateProps;

export function ProviderTableThumbnail(props: ProviderTableThumbnailProps) {
  return <TableThumbnailTemplate {...props} />;
}
