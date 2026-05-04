import { MediaLibraryManager } from"@/features/media/components/media-library-manager";
import { countMediaAssets, listMediaAssets } from"@/features/media/server/media-store";

export default async function AdminMediaPage() {
 const limit = 100;
 const [items, total] = await Promise.all([
  listMediaAssets({ page:1, limit }),
  countMediaAssets(),
 ]);
 const initialData = {
 items,
 total,
 page: 1,
 limit,
 };
 return <MediaLibraryManager initialData={initialData} />;
}
