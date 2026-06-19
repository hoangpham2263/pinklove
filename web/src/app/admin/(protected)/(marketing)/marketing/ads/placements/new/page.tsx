import { PlacementForm } from "@/features/ads/admin/ads-entity-forms";
import { requireAdmin } from "@/lib/auth";

export default async function NewPlacementPage() {
  await requireAdmin();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Tạo placement</h1><p className="text-sm text-muted-foreground">Vị trí render banner, popup, floating và bar.</p></div>
      <PlacementForm />
    </section>
  );
}
