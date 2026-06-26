import { Boxes, PackagePlus } from "lucide-react";

import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { OfferingBundleList } from "@/features/offerings/admin/offering-bundle-list";
import { listOfferingBundles } from "@/features/offerings/server/bundles";
import { listAllOfferings } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminOfferingBundlesPage() {
  await requireAdmin();
  const [bundles, offerings] = await Promise.all([listOfferingBundles(), listAllOfferings()]);
  const selectableOfferings = offerings.filter((offering) => offering.status !== "archived");

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Combo dịch vụ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý combo ghép từ nhiều dịch vụ/sản phẩm có sẵn. Dùng cho gói cưới trọn bộ, gói triển khai hoặc combo bán kèm.
          </p>
        </div>
        <AdminCreateLinkButton href={ROUTES.ADMIN.OFFERING_BUNDLE_NEW}>Tạo combo</AdminCreateLinkButton>
      </div>

      <AdminOverviewGrid className="md:grid-cols-2">
        <AdminOverviewCard title="Combo đã tạo" value={bundles.length} description="Gói ghép từ nhiều dịch vụ/sản phẩm" icon={Boxes} />
        <AdminOverviewCard title="Dịch vụ có thể chọn" value={selectableOfferings.length} description="Nguồn để ghép vào combo" icon={PackagePlus} />
      </AdminOverviewGrid>

      <OfferingBundleList bundles={bundles} />
    </section>
  );
}
