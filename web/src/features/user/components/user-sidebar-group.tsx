"use client";

import Link from "next/link";
import {
  BadgePercent,
  ChevronRight,
  FolderHeart,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type UserSidebarIconName = "folder-heart" | "user" | "badge-percent" | "settings";

type UserSidebarChild = {
  label: string;
  href: string;
  iconName: UserSidebarIconName;
};

type UserSidebarGroupProps = {
  label: string;
  iconName: UserSidebarIconName;
  children: UserSidebarChild[];
  defaultOpen?: boolean;
};

const iconMap = {
  "folder-heart": FolderHeart,
  user: UserIcon,
  "badge-percent": BadgePercent,
  settings: Settings,
} satisfies Record<UserSidebarIconName, React.ComponentType<{ className?: string }>>;

export function UserSidebarGroup({
  label,
  iconName,
  children,
  defaultOpen = false,
}: UserSidebarGroupProps) {
  const GroupIcon = iconMap[iconName];

  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
        <div className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none data-[state=open]:animate-none data-[state=closed]:h-0 data-[state=open]:h-[var(--radix-collapsible-content-height)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 transition-[height,opacity] duration-200 ease-out">
        <div className="ml-5 mt-1 flex flex-col gap-1 border-l pl-4">
          {children.map((item) => {
            const ItemIcon = iconMap[item.iconName];

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
