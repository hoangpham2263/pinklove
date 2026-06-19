import { notFound } from "next/navigation";
import { AdminTableActionButton } from "@/features/admin/components/admin-table-actions";
import { requireAdmin } from "@/lib/auth";
import { listAllOfferings } from "@/features/offerings/server/service";
import { getPageBySlug, normalizeSlug } from "@/lib/managed-pages";
import { getManagedPagePath } from "@/lib/page-paths";
import { PageEditorForm } from "@/features/pages/admin/page-editor-form";
import { isAuthPageSlug, isContentPageSlug } from "@/features/pages/config/managed-pages";

type AdminPageEditorProps = {
  params: Promise<{ slug?: string[] }>;
};

function getPreviewHref(path: string) {
  return path === "/" ? "/?preview=1" : `${path}?preview=1`;
}

export default async function AdminPageEditor({ params }: AdminPageEditorProps) {
  await requireAdmin();
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);

  if (!isAuthPageSlug(slug) && !isContentPageSlug(slug)) {
    notFound();
  }

  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const previewHref = getPreviewHref(getManagedPagePath(page));
  const offerings = await listAllOfferings();
  const offeringOptions = offerings.map((offering) => ({
    value: offering.slug,
    label: offering.name,
    description: `${
      offering.offeringType === "digital_template" && offering.templateEngine === "builder"
        ? "Builder"
        : offering.offeringType !== "digital_template"
          ? "Sản phẩm"
          : "Template"
    } • ${offering.status}`,
  }));

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Edit Page: {page.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <AdminTableActionButton action="external" href={previewHref} target="_blank" label="Xem nhanh" />
        </div>
      </div>
      <PageEditorForm page={page} offeringOptions={offeringOptions} />
    </section>
  );
}
