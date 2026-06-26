import { notFound } from "next/navigation";

import { OfferingBundleForm } from "@/features/offerings/admin/offering-bundle-form";
import { getOfferingBundleBySlug } from "@/features/offerings/server/bundles";
import { listAllOfferings } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";

type EditOfferingBundlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditOfferingBundlePage({ params }: EditOfferingBundlePageProps) {
  await requireAdmin();
  const { slug } = await params;
  const [bundle, offerings] = await Promise.all([
    getOfferingBundleBySlug(decodeURIComponent(slug)),
    listAllOfferings(),
  ]);

  if (!bundle) notFound();

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Chỉnh sửa combo</h1>
        <p className="text-sm text-muted-foreground">/{bundle.slug}</p>
      </div>

      <OfferingBundleForm bundle={bundle} offerings={offerings} />
    </section>
  );
}
