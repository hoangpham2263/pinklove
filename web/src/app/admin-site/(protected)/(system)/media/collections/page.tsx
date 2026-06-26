import { MediaCollectionsManager } from "@/features/media/components/media-collections-manager";
import { listMediaCollections, listMediaCollectionTargets } from "@/features/media/server/media-collections";
import { ROUTES } from "@/lib/routes";

export default async function AdminMediaCollectionsPage() {
  const [collections, collectionTargets] = await Promise.all([
    listMediaCollections(),
    listMediaCollectionTargets(),
  ]);

  return (
    <section className="flex w-full flex-1 flex-col p-5 md:p-7.5">
      <MediaCollectionsManager
        collections={collections}
        targets={collectionTargets}
        action={ROUTES.API.ADMIN.MEDIA_COLLECTIONS}
        plain
      />
    </section>
  );
}
