import {
  TableThumbnailTemplate,
  type TableThumbnailTemplateProps,
} from "@/components/common/table-thumbnail-template";

export type VendorTableThumbnailProps = TableThumbnailTemplateProps;

export function VendorTableThumbnail(props: VendorTableThumbnailProps) {
  return <TableThumbnailTemplate {...props} />;
}
