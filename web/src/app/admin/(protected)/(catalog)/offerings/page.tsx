import { CheckCircle2, FileText, Layers3, Package, Plus, Tags } from "lucide-react";
import Link from "next/link";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listAllOfferings, listOfferingTypes } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export default async function AdminOfferingsPage() {
  await requireAdmin();
  const [offerings, offeringTypes] = await Promise.all([listAllOfferings(), listOfferingTypes()]);
  const publishedCount = offerings.filter((offering) => offering.status === "published").length;
  const draftCount = offerings.length - publishedCount;
  const missingMediaCount = offerings.filter((offering) => !offering.thumbnailUrl).length;
  const recentOfferings = offerings.slice(0, 6);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offerings Overview</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ sinh thái catalog, type và dữ liệu cần xử lý.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminCreateLinkButton href={ROUTES.ADMIN.OFFERING_MANAGE}>Quản lý table</AdminCreateLinkButton>
          <AdminCreateLinkButton href={ROUTES.ADMIN.OFFERINGS}>
            <Plus className="mr-2 size-4" />
            Tạo offering
          </AdminCreateLinkButton>
        </div>
      </div>

      <AdminOverviewGrid className="md:grid-cols-2 xl:grid-cols-4">
        <AdminOverviewCard title="Tổng offerings" value={offerings.length} icon={Package} />
        <AdminOverviewCard title="Published" value={publishedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Draft" value={draftCount} icon={FileText} />
        <AdminOverviewCard title="Thiếu media" value={missingMediaCount} icon={Layers3} />
      </AdminOverviewGrid>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Offerings gần đây</h2>
          </div>
          <div className="divide-y">
            {recentOfferings.map((offering) => (
              <Link key={offering.id} href={ROUTES.ADMIN.OFFERING(offering.slug)} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="truncate font-medium">{offering.name}</div>
                  <div className="text-xs text-muted-foreground">{offering.offeringType}</div>
                </div>
                <span className="rounded-md border px-2 py-1 text-xs">{offering.status}</span>
              </Link>
            ))}
            {recentOfferings.length === 0 ? <div className="p-4 text-sm text-muted-foreground">Chưa có offering.</div> : null}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-semibold">Quản lý nhanh</h2>
          </div>
          <div className="grid gap-2 p-4">
            <Link href={ROUTES.ADMIN.OFFERING_MANAGE} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Offerings table</Link>
            <Link href={ROUTES.ADMIN.OFFERING_TYPES} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Offering types</Link>
            <Link href={ROUTES.ADMIN.OFFERING_CATEGORIES} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Categories</Link>
            <Link href={ROUTES.ADMIN.OFFERING_TEMPLATES} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Digital templates</Link>
            <Link href={ROUTES.ADMIN.OFFERING_BUILDER} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Builder templates</Link>
          </div>
          <div className="border-t p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Tags className="size-4" />
              Types active
            </div>
            <div className="flex flex-wrap gap-2">
              {offeringTypes.map((type) => (
                <span key={type.key} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{type.key}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
