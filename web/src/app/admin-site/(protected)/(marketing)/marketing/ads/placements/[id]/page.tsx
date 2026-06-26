import { notFound } from "next/navigation";
import { PlacementForm } from "@/features/ads/admin/ads-entity-forms";
import { getAdPlacementById } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditPlacementPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await getAdPlacementById(id);
  if (!row) notFound();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Sửa placement</h1><p className="text-sm text-muted-foreground">Cấu hình vị trí, target pages và dismiss policy.</p></div>
      <PlacementForm row={row} />
    </section>
  );
}
