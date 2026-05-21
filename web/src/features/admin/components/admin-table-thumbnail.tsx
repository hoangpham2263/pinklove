import {
  TableThumbnailTemplate,
  type TableThumbnailTemplateProps,
} from "@/components/common/table-thumbnail-template";

export type AdminTableThumbnailProps = TableThumbnailTemplateProps;

export function AdminTableThumbnail(props: AdminTableThumbnailProps) {
  return <TableThumbnailTemplate {...props} />;
}
