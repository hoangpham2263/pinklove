import { MediaLibraryManager } from"@/features/media/components/media-library-manager";
import { listMediaAssets } from"@/features/media/server/media-store";

export default async function AdminMediaPage() {
 const allItems = await listMediaAssets();
 const limit = 100;
 const initialData = {
 items: allItems.slice(0, limit),
 total: allItems.length,
 page: 1,
 limit,
 };
 return <MediaLibraryManager initialData={initialData} />;
}
