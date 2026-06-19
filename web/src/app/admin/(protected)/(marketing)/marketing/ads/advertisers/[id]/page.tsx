import { notFound } from "next/navigation";
import { AdvertiserForm } from "@/features/ads/admin/ads-entity-forms";
import { getAdvertiserById } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditAdvertiserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await getAdvertiserById(id);
  if (!row) notFound();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Sửa advertiser</h1><p className="text-sm text-muted-foreground">Cập nhật hồ sơ advertiser.</p></div>
      <AdvertiserForm row={row} />
    </section>
  );
}
