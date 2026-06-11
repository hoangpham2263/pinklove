import { MediaCollectionsManager } from "@/features/media/components/media-collections-manager";
import { listMediaCollections, listMediaCollectionTargets } from "@/features/media/server/media-collections";
import { ROUTES } from "@/lib/routes";

export default async function AdminMediaCollectionsPage() {
  const [collections, collectionTargets] = await Promise.all([
    listMediaCollections(),
    listMediaCollectionTargets(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col gap-7 p-5 md:p-7.5">
      <div>
        <h1 className="text-2xl font-semibold">Media Collections</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý album/gallery theo wedding site, provider, offering và landing page.
        </p>
      </div>

      <MediaCollectionsManager
        collections={collections}
        targets={collectionTargets}
        action={ROUTES.API.ADMIN.MEDIA_COLLECTIONS}
      />
    </section>
  );
}
