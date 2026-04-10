import Link from "next/link";
import {
  LayoutDashboard,
  FolderHeart,
  User as UserIcon,
  BadgePercent,
  Settings,
  ExternalLink
} from "lucide-react";

import { UserTopHeader } from "@/features/user/components/user-top-header";
import { UserNavLink } from "@/features/user/components/user-nav-link";
import { UserSidebarGroup } from "@/features/user/components/user-sidebar-group";
import { requireAppUser } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

type UserNavChild = {
  label: string;
  href: string;
  iconName: "folder-heart" | "user" | "badge-percent" | "settings";
};

type UserNavGroup = {
  label: string;
  iconName: "folder-heart" | "user" | "badge-percent" | "settings";
  children: UserNavChild[];
  defaultOpen?: boolean;
};

const userNavGroups: UserNavGroup[] = [
  {
    label: "Site",
    iconName: "folder-heart",
    defaultOpen: false,
    children: [{ label: "My Invitations", href: ROUTES.USER.INVITATIONS, iconName: "folder-heart" }],
  },
  {
    label: "User",
    iconName: "user",
    defaultOpen: false,
    children: [
      { label: "Profile", href: ROUTES.USER.PROFILE, iconName: "user" },
      { label: "Affiliate", href: ROUTES.USER.AFFILIATE, iconName: "badge-percent" },
    ],
  },
  {
    label: "System",
    iconName: "settings",
    defaultOpen: false,
    children: [{ label: "Settings", href: ROUTES.USER.SETTINGS, iconName: "settings" }],
  },
];

export default async function UserLayout({ children, }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAppUser(ROUTES.AUTH.LOGIN);

  return (
    <div>
      <aside className="admin-sidebar-scroll fixed top-0 left-0 hidden h-screen w-60 overflow-y-auto border-r bg-background p-5 md:flex md:flex-col md:gap-3">
        <div className="flex items-center gap-2 mb-6 px-3">
          <div className="h-6 w-6 rounded-bg bg-primary" />
          <h2 className="text-lg font-bold tracking-tight">PinkLove</h2>
        </div>

        <nav className="flex flex-col gap-2.5">
          <UserNavLink
            href={ROUTES.USER.DASHBOARD}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </UserNavLink>

          {userNavGroups.map((group) => (
            <UserSidebarGroup
              key={group.label}
              label={group.label}
              iconName={group.iconName}
              children={group.children}
              defaultOpen={group.defaultOpen}
            />
          ))}

          <div className="mt-auto pt-4 border-t">
            <Link href={ROUTES.HOME} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted">
              <ExternalLink className="h-5 w-5" />
              Xem Website
            </Link>
          </div>
        </nav>
      </aside>

      <main className="md:ml-60 min-h-screen bg-muted/30 bg-[#f9f9f9]">
        <UserTopHeader username={user.username} />

        <section className="min-h-screen pt-14">
          <section className="md:hidden border-b bg-background px-4 py-2">
            <nav className="flex gap-4 overflow-x-auto py-1">
              <UserNavLink href={ROUTES.USER.DASHBOARD} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </UserNavLink>
              <UserNavLink href={ROUTES.USER.INVITATIONS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">
                <FolderHeart className="h-4 w-4" />
                My Invitations
              </UserNavLink>
              <UserNavLink href={ROUTES.USER.PROFILE} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">
                <UserIcon className="h-4 w-4" />
                Profile
              </UserNavLink>
              <UserNavLink href={ROUTES.USER.AFFILIATE} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">
                <BadgePercent className="h-4 w-4" />
                Affiliate
              </UserNavLink>
              <UserNavLink href={ROUTES.USER.SETTINGS} className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </UserNavLink>
            </nav>
          </section>
          <section className="min-h-screen">
            <div>{children}</div>
          </section>
        </section>
      </main>
    </div>
  );
}
