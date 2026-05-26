import {
  Boxes,
  CheckCircle2,
  FileText,
  Layers3,
  PackagePlus,
  Shapes,
  Tags,
  Truck,
} from "lucide-react";

import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import {
  listAllOfferingCategories,
  listAllOfferings,
  listOfferingTypes,
} from "@/features/offerings/server/service";
import { SYSTEM_OFFERING_TYPES } from "@/features/offerings/types";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminOfferingsPage() {
  await requireAdmin();

  const [offerings, categories, offeringTypes] = await Promise.all([
    listAllOfferings(),
    listAllOfferingCategories(),
    listOfferingTypes({ includeArchived: true }),
  ]);

  const catalogOfferings = offerings.filter((offering) => offering.offeringType !== SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE);
  const templateOfferings = offerings.filter((offering) => offering.offeringType === SYSTEM_OFFERING_TYPES.DIGITAL_TEMPLATE);
  const publishedCount = catalogOfferings.filter((offering) => offering.status === "published").length;
  const draftCount = catalogOfferings.length - publishedCount;
  const activeTypeCount = offeringTypes.filter((type) => type.status === "active").length;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Offerings</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan catalog, cấu hình type và các luồng provider liên quan đến sản phẩm/dịch vụ.
        </p>
      </div>

      <AdminOverviewGrid>
        <AdminOverviewCard title="Catalog live" value={publishedCount} description={`${draftCount} bản nháp`} icon={CheckCircle2} />
        <AdminOverviewCard title="Tổng catalog" value={catalogOfferings.length} description="Sản phẩm và dịch vụ bán trên site" icon={Boxes} />
        <AdminOverviewCard title="Templates" value={templateOfferings.length} description="Thiệp số, builder và coded templates" icon={Layers3} />
        <AdminOverviewCard title="Offering types" value={activeTypeCount} description={`${offeringTypes.length} type trong hệ thống`} icon={Shapes} />
      </AdminOverviewGrid>

      <AdminOverviewGrid className="md:grid-cols-2 xl:grid-cols-3">
        <AdminOverviewCard
          title="Quản lý sản phẩm"
          description="Mở bảng catalog đầy đủ để lọc, tìm kiếm, sửa và bulk update."
          href={ROUTES.ADMIN.OFFERING_MANAGE}
          hrefLabel="Vào danh sách"
          icon={Boxes}
        />
        <AdminOverviewCard
          title="Tạo sản phẩm"
          description="Tạo offering mới theo type đã cấu hình."
          href={ROUTES.ADMIN.OFFERINGS}
          hrefLabel="Tạo mới"
          icon={PackagePlus}
        />
        <AdminOverviewCard
          title="Offering Types"
          description="Quản lý schema, field definitions, tồn kho và quyền provider supply."
          href={ROUTES.ADMIN.OFFERING_TYPES}
          hrefLabel="Cấu hình types"
          icon={Shapes}
        />
        <AdminOverviewCard
          title="Categories"
          value={categories.length}
          description="Nhóm catalog và cấu trúc phân loại sản phẩm."
          href={ROUTES.ADMIN.OFFERING_CATEGORIES}
          hrefLabel="Quản lý danh mục"
          icon={Tags}
        />
        <AdminOverviewCard
          title="Templates"
          description="Quản lý kho thiệp số coded template."
          href={ROUTES.ADMIN.OFFERING_TEMPLATES}
          hrefLabel="Xem templates"
          icon={FileText}
        />
        <AdminOverviewCard
          title="Provider Submissions"
          description="Duyệt sản phẩm provider gửi lên trước khi áp dụng vào catalog."
          href={ROUTES.ADMIN.PROVIDER_OFFERINGS}
          hrefLabel="Duyệt submissions"
          icon={Truck}
        />
      </AdminOverviewGrid>
    </section>
  );
}
