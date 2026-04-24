import { BreadcrumbTrail } from "@/components/common/breadcrumb-trail";
import { getManagedPageBreadcrumbs, type ManagedPage } from "@/lib/managed-pages";
import { getSystemSettings } from "@/lib/system-settings";

export async function ManagedPageBreadcrumb({ page }: { page: ManagedPage }) {
  const settings = await getSystemSettings();

  if (!settings.breadcrumb.enabled || !settings.breadcrumb.showOnPage) {
    return null;
  }

  const items = await getManagedPageBreadcrumbs(page, {
    homeLabel: settings.breadcrumb.homeLabel,
  });
  const separator = settings.breadcrumb.separator || "/";

  if (items.length <= 1) {
    return null;
  }

  return (
    <BreadcrumbTrail
      items={items.map((item, index) => ({
        label: item.name,
        href: index === items.length - 1 ? undefined : item.path,
      }))}
      separator={separator}
      listClassName="text-xs uppercase tracking-[0.35em] text-stone-400"
      linkClassName="transition-colors hover:text-stone-700"
      currentClassName="text-stone-500"
      separatorClassName="text-stone-300"
    />
  );
}
