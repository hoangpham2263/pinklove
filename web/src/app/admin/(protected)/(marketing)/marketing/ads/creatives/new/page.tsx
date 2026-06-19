import { CreativeForm } from "@/features/ads/admin/ads-entity-forms";
import { getTargetUrlOptions } from "@/features/ads/admin/target-url-options";
import { listAdvertiserOptions } from "@/features/ads/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function NewCreativePage() {
  await requireAdmin();
  const [advertisers, targetUrlOptions] = await Promise.all([listAdvertiserOptions(), getTargetUrlOptions()]);
  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div><h1 className="text-2xl font-bold tracking-tight">Tạo creative</h1><p className="text-sm text-muted-foreground">Nội dung hình ảnh, headline, body và CTA.</p></div>
      <CreativeForm advertisers={advertisers} targetUrlOptions={targetUrlOptions} />
    </section>
  );
}
