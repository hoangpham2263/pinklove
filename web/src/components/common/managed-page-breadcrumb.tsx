import Link from "next/link";
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
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-stone-400">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.slug}-${item.path}`} className="flex items-center gap-2">
              {isCurrent ? (
                <span>{item.name}</span>
              ) : (
                <Link href={item.path} className="transition-colors hover:text-stone-700">
                  {item.name}
                </Link>
              )}
              {!isCurrent ? <span>{separator}</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
