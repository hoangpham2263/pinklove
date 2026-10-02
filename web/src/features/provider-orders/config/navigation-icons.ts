import {
  CalendarClock,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  MessagesSquare,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  Settings,
  ShoppingBag,
  Store,
  User as UserIcon,
} from "lucide-react";
import type React from "react";

import type { ProviderNavIconName } from "@/features/provider-orders/config/navigation";

export const PROVIDER_NAV_ICON_MAP = {
  "calendar-clock": CalendarClock,
  "layout-dashboard": LayoutDashboard,
  "messages-square": MessagesSquare,
  "map-pin": MapPin,
  "package-check": PackageCheck,
  "package-plus": PackagePlus,
  "package-search": PackageSearch,
  settings: Settings,
  "shopping-bag": ShoppingBag,
  store: Store,
  user: UserIcon,
  "external-link": ExternalLink,
} satisfies Record<ProviderNavIconName, React.ComponentType<{ className?: string }>>;
