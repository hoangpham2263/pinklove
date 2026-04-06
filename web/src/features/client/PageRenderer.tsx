import type { CmsPage } from "@/lib/cms";
import { AboutTemplate } from "./templates/AboutTemplate";
import { ContactTemplate } from "./templates/ContactTemplate";
import { DefaultTemplate } from "./templates/DefaultTemplate";
import { HomeTemplate } from "./templates/HomeTemplate";
import { resolvePublicTemplateKey } from "@/features/pages/registry";

type PageRendererProps = {
  page: CmsPage;
};

export function PageRenderer({ page }: PageRendererProps) {
  switch (resolvePublicTemplateKey(page)) {
    case "home":
      return <HomeTemplate page={page} />;
    case "about":
      return <AboutTemplate page={page} />;
    case "contact":
      return <ContactTemplate page={page} />;
    default:
      return <DefaultTemplate page={page} />;
  }
}
