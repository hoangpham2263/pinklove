import { notFound } from "next/navigation";
import { CreativeForm } from "@/features/ads/admin/ads-entity-forms";
import { getTargetUrlOptions } from "@/features/ads/admin/target-url-options";
import { getAdCreativeById, listAdvertiserOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function EditCreativePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [row, advertisers, targetUrlOptions] = await Promise.all([getAdCreativeById(id), listAdvertiserOptions(), getTargetUrlOptions()]);
  if (!row) notFound();
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Sửa creative</h1><p className="text-sm text-muted-foreground">Cập nhật nội dung hiển thị.</p></div>
      <CreativeForm row={row} advertisers={advertisers} targetUrlOptions={targetUrlOptions} />
    </section>
  );
}
