import { getStructuredData } from "@/lib/page-fields";
import { getManagedPageBreadcrumbStructuredData, type ManagedPage } from "@/lib/managed-pages";
import { getSystemSettings } from "@/lib/system-settings";
import { JsonLd } from "./json-ld";

export async function PageStructuredData({ page }: { page?: ManagedPage | null }) {
  const structuredData = getStructuredData(page);
  const settings = await getSystemSettings();
  const breadcrumbStructuredData =
    page && settings.breadcrumb.enabled && settings.breadcrumb.includeStructuredData
      ? await getManagedPageBreadcrumbStructuredData(page, {
          homeLabel: settings.breadcrumb.homeLabel,
        })
      : null;
  const payload = [breadcrumbStructuredData, structuredData].filter(Boolean) as Record<string, unknown>[];

  if (payload.length === 0) {
    return null;
  }

  return <JsonLd data={payload.length === 1 ? payload[0] : payload} />;
}
