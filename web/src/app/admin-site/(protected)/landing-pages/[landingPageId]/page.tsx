import { notFound } from "next/navigation";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { LandingPageEditorForm } from "@/features/landing-pages/admin/landing-page-editor-form";
import { getLandingPageById, listLandingPageSections } from "@/features/landing-pages/server/service";
import { listAllOfferings } from "@/features/offerings/server/service";
import { requireAdmin } from "@/lib/auth";
import { getLandingPagePath } from "@/lib/public-paths";

type AdminLandingPageEditPageProps = {
  params: Promise<{ landingPageId: string }>;
};

export default async function AdminLandingPageEditPage({
  params,
}: AdminLandingPageEditPageProps) {
  await requireAdmin();
  const { landingPageId } = await params;
  const landingPage = await getLandingPageById(landingPageId);

  if (!landingPage) {
    notFound();
  }

  const [sections, offerings] = await Promise.all([
    listLandingPageSections(landingPage.id),
    listAllOfferings(),
  ]);
  const publicHref = getLandingPagePath(landingPage);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sửa landing · {landingPage.name}</h1>
          <p className="text-sm text-muted-foreground">{landingPage.sourceOfferingName ?? "Chưa chọn sản phẩm nguồn"}</p>
        </div>
        <AdminTableActionButton action="external" href={publicHref} target="_blank" label="Xem nhanh" />
      </div>

      <LandingPageEditorForm landingPage={landingPage} sections={sections} offerings={offerings} />
    </section>
  );
}
