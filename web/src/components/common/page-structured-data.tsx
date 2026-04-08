import { getStructuredData } from "@/lib/cms-fields";
import type { CmsPage } from "@/lib/cms";
import { JsonLd } from "./json-ld";

export function PageStructuredData({ page }: { page?: CmsPage | null }) {
  const structuredData = getStructuredData(page);

  if (!structuredData) {
    return null;
  }

  return <JsonLd data={structuredData} />;
}
