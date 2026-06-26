import { MediaLibraryManager } from "@/features/media/components/media-library-manager";
import { countMediaAssets, listMediaAssets } from "@/features/media/server/media-store";

export default async function AdminMediaLibraryPage() {
  const limit = 100;
  const [items, total] = await Promise.all([
    listMediaAssets({ page: 1, limit }),
    countMediaAssets(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-7 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý file vật lý: upload, xem dạng grid/list, sao chép URL và xóa file.
        </p>
      </div>

      <MediaLibraryManager initialData={{ items, total, page: 1, limit }} />
    </section>
  );
}
