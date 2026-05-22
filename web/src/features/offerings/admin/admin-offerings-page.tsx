import { CheckCircle2, FileText, Package } from "lucide-react";
import { AdminCreateLinkButton } from "@/features/admin/components/admin-buttons";
import { AdminOverviewCard, AdminOverviewGrid } from "@/features/admin/components/admin-overview-card";
import { listAllOfferings } from "@/features/offerings/server/service";
import type { Offering, OfferingTemplateEngine, OfferingType } from "@/features/offerings/types";
import { AdminOfferingList } from "@/features/offerings/admin/admin-offering-list";
import { ROUTES } from "@/lib/routes";

type AdminOfferingsPageViewProps = {
  query: Record<string, string | string[] | undefined>;
  fixedOfferingType: OfferingType;
  fixedTemplateEngine?: OfferingTemplateEngine;
  title: string;
  description: string;
  returnTo: string;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function AdminOfferingsPageView({
  query,
  fixedOfferingType,
  fixedTemplateEngine,
  title,
  description,
  returnTo,
}: AdminOfferingsPageViewProps) {
  const offerings = await listAllOfferings();
  const search = getQueryValue(query.q) ?? "";
  const status = (getQueryValue(query.status) ?? "") as "" | Offering["status"];
  const filteredOfferings = offerings.filter((offering) => {
    if (fixedTemplateEngine) {
      return offering.offeringType === fixedOfferingType && offering.templateEngine === fixedTemplateEngine;
    }
    return offering.offeringType === fixedOfferingType;
  });
  const publishedCount = filteredOfferings.filter((offering) => offering.status === "published").length;
  const draftCount = filteredOfferings.length - publishedCount;
  const canCreateOffering = fixedOfferingType === "physical_product" || fixedTemplateEngine === "builder";
  const createHref =
    fixedTemplateEngine === "builder"
      ? `${ROUTES.ADMIN.OFFERING_BUILDER_CREATE}?returnTo=${encodeURIComponent(returnTo)}`
      : `${ROUTES.ADMIN.OFFERINGS}?type=${fixedOfferingType}&returnTo=${encodeURIComponent(returnTo)}`;
  const hasHeaderContent = title.trim().length > 0 || description.trim().length > 0 || canCreateOffering;

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      {hasHeaderContent ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          {title.trim().length > 0 || description.trim().length > 0 ? (
            <div>
              {title.trim().length > 0 ? <h1 className="text-2xl font-bold tracking-tight">{title}</h1> : null}
              {description.trim().length > 0 ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
          ) : null}
          {canCreateOffering ? (
            <AdminCreateLinkButton href={createHref}>
              {fixedTemplateEngine === "builder" ? "Tạo builder" : "Tạo sản phẩm"}
            </AdminCreateLinkButton>
          ) : null}
        </div>
      ) : null}

      <AdminOverviewGrid className="md:grid-cols-3 lg:grid-cols-3">
        <AdminOverviewCard title="Tổng sản phẩm" value={filteredOfferings.length} icon={Package} />
        <AdminOverviewCard title="Published" value={publishedCount} icon={CheckCircle2} />
        <AdminOverviewCard title="Draft" value={draftCount} icon={FileText} />
      </AdminOverviewGrid>

      <AdminOfferingList
        offerings={filteredOfferings}
        search={search}
        status={status}
        offeringType={fixedOfferingType}
        title={undefined}
        returnTo={returnTo}
      />
    </section>
  );
}
