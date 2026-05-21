import {
  TableThumbnailTemplate,
  type TableThumbnailTemplateProps,
} from "@/components/common/table-thumbnail-template";

export type CustomerTableThumbnailProps = TableThumbnailTemplateProps;

export function CustomerTableThumbnail(props: CustomerTableThumbnailProps) {
  return <TableThumbnailTemplate {...props} />;
}
