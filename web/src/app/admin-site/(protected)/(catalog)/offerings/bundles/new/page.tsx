import { OfferingBundleForm } from "@/features/offerings/admin/offering-bundle-form";
import { listAllOfferings } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";

export default async function NewOfferingBundlePage() {
  await requireAdmin();
  const offerings = await listAllOfferings();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Tạo combo dịch vụ</h1>
        <p className="text-sm text-muted-foreground">Chọn các dịch vụ/sản phẩm có sẵn để tạo một combo bán chung.</p>
      </div>

      <OfferingBundleForm offerings={offerings} />
    </section>
  );
}
