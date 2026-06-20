"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, ChevronDown, Heart, Menu, Search, UserRound, X } from "lucide-react";
import { GuestNotificationBell } from "@/features/notifications/components/guest-notification-bell";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useWishlist } from "@/features/offerings/use-wishlist";
import { getRoleLabel, isAdminRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type GuestHeaderLink = {
  id: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
  megaMenuSpan: "full" | "half" | "third" | null;
  href: string;
  parentId?: string | null;
};

export type GuestHeaderNode = GuestHeaderLink & {
  children: GuestHeaderNode[];
};

type GuestHeaderProps = {
  user: {
    username: string;
    role: UserRole;
    avatarUrl?: string | null;
  } | null;
  headerTree: GuestHeaderNode[];
  dashboardHref: string;
  settingsHref: string;
  siteName: string;
  siteLogo?: string;
};

function getNavSections(item: GuestHeaderNode) {
  const standaloneItems = item.children.filter((child) => child.children.length === 0);
  return [
    ...(standaloneItems.length > 0
      ? [{
        id: `${item.id}-primary`,
        label: "Khám phá",
        span: "half" as const,
        children: standaloneItems,
      }]
      : []),
    ...item.children
      .filter((child) => child.children.length > 0)
      .map((child) => ({
        id: child.id,
        label: child.label,
        span: child.megaMenuSpan ?? "half",
        children: child.children,
      })),
  ];
}

function NavDropdown({ item }: { item: GuestHeaderNode }) {
  const sections = getNavSections(item);

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="inline-flex items-center gap-1 whitespace-nowrap text-sm md:text-base"
      >
        {item.label}
        <ChevronDown className="size-4 transition-transform duration-200 group-hover:rotate-180" />
      </Link>
      <div className="absolute left-0 top-full h-5 w-full" />
      <div className="invisible absolute left-0 top-[calc(100%+1.25rem)] z-50 max-h-[calc(100vh-7rem)] w-[min(42rem,calc(100vw-2rem))] translate-y-2 overflow-y-auto rounded-lg bg-white p-3 opacity-0 shadow-default transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-6">
          {sections.map((section) => (
            <section
              key={section.id}
              className={cn(
                "min-w-0 md:col-span-3",
                section.span === "full" && "md:col-span-6",
                section.span === "third" && "md:col-span-2",
              )}
            >
              <p className="px-3 pb-2 pt-1 text-xs uppercase tracking-[0.08em]">
                {section.label}
              </p>
              <div className={cn("grid gap-1", section.span === "full" && "md:grid-cols-2")}>
                {section.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href}
                    className="flex min-h-14 items-start gap-3 rounded-xl p-3 transition hover:bg-stone-100"
                  >
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white">
                      {child.imageUrl ? (
                        <img src={child.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm">{child.label}</span>
                      {child.description ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5">
                          {child.description}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNavLink({ item, onNavigate }: { item: GuestHeaderNode; onNavigate: () => void }) {
  return (
    <Link
      href={item.href}
      className="flex min-h-12 items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-stone-100"
      onClick={onNavigate}
    >
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ArrowUpRight className="size-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm">{item.label}</span>
        {item.description ? (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-5">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function MobileNavItem({ item, onNavigate }: { item: GuestHeaderNode; onNavigate: () => void }) {
  if (item.children.length === 0) {
    return <MobileNavLink item={item} onNavigate={onNavigate} />;
  }

  const sections = getNavSections(item);

  return (
    <details className="group rounded-xl border border-stone-200 bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm">
        <span>{item.label}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-stone-100 px-2 py-3">
        {sections.map((section) => (
          <section key={section.id}>
            <p className="px-2 pb-1 text-xs uppercase tracking-[0.08em]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.children.map((child) => (
                <MobileNavLink key={child.id} item={child} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </details>
  );
}

export function GuestHeader({
  user,
  headerTree,
  dashboardHref,
  settingsHref,
  siteName,
  siteLogo,
}: GuestHeaderProps) {
  const router = useRouter();
  const userInitial = user?.username?.trim().charAt(0).toUpperCase() || "U";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const activeSearchQuery = searchParams.get("q")?.trim() ?? "";
  const { count } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideSearchButton = searchContainerRef.current?.contains(target);
      const isInsideSearchPanel = searchPanelRef.current?.contains(target);

      if (!isInsideSearchButton && !isInsideSearchPanel) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => {
      const input = window.matchMedia("(min-width: 1024px)").matches
        ? searchInputRef.current
        : mobileSearchInputRef.current;
      input?.focus();
      input?.select();
    });

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    setIsSearchOpen(false);

    if (!query) {
      router.push(ROUTES.SEARCH);
      return;
    }

    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const closeAccountMenu = () => setIsAccountMenuOpen(false);

  const headerIconButtonClassName =
    "relative hidden h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white transition hover:border-stone-300 hover:bg-stone-50 sm:inline-flex";
  const headerDesktopDropdownTopClassName = "lg:!top-[3.25rem]";

  return (
    <header data-guest-header className="container px-3 mx-auto fixed inset-x-0 top-2.5 z-50 flex justify-center sm:px-4">
      <div
        style={{ width: isScrolled ? "90%" : "100%", maxWidth: "100%" }}
        className={[
          "relative px-3 flex h-14 items-center justify-between gap-3 rounded-full border border-guest-primary/50 transition-[width,padding,background-color,box-shadow] duration-300 ease-out sm:h-16 sm:px-5 lg:gap-15",
          isScrolled
            ? "bg-white/95 sm:px-6 shadow-default"
            : "bg-white/40",
        ].join(" ")}
      >
        <Link href={ROUTES.HOME} className="min-w-0 shrink-0">
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} className="h-5 max-w-[6.5rem] object-contain pointer-events-none sm:max-w-[11rem] 2xl:h-7.5" />
          ) : (
            <span className="block max-w-[6.5rem] truncate text-sm tracking-[0.18em] uppercase sm:max-w-[11rem] sm:text-base">{siteName}</span>
          )}
        </Link>

        <nav className="hidden items-center justify-center gap-4 lg:flex">
          {headerTree.map((item) =>
            item.children.length > 0 ? (
              <NavDropdown key={item.id} item={item} />
            ) : (
              <Link key={item.id} href={item.href} className="text-sm md:text-base whitespace-nowrap">
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center justify-end gap-x-2 sm:gap-x-3 lg:gap-x-5">
          {user ? (
            <NotificationBell
              triggerClassName={headerIconButtonClassName}
              dropdownClassName={headerDesktopDropdownTopClassName}
            />
          ) : (
            <GuestNotificationBell
              triggerClassName={headerIconButtonClassName}
              dropdownClassName={headerDesktopDropdownTopClassName}
            />
          )}
          <Link
            href={ROUTES.WISHLIST}
            aria-label={`Yêu thích (${count})`}
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white transition hover:border-rose-200 sm:inline-flex"
            onClick={(event) => {
              if (user) {
                return;
              }

              event.preventDefault();
              window.location.href = `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(ROUTES.WISHLIST)}`;
            }}
          >
            <Heart className={cn("size-5", count > 0 && "fill-current")} />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] leading-none">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
          <div ref={searchContainerRef} className="relative">
            <button
              type="button"
              aria-label="Mo tim kiem"
              aria-expanded={isSearchOpen}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white transition hover:border-stone-300 hover:bg-stone-50",
                isSearchOpen && "border-stone-900"
              )}
              onClick={() => {
                setIsAccountMenuOpen(false);
                setIsMobileMenuOpen(false);
                setIsSearchOpen((current) => !current);
              }}
            >
              <Search className="size-5" />
            </button>
            {isSearchOpen ? (
              <div className="absolute right-0 top-[3.25rem] z-50 hidden w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-stone-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:block lg:rounded-2xl">
                <form className="space-y-3" onSubmit={handleSearchSubmit}>
                  <label className="block text-sm" htmlFor="guest-header-search">
                    Tim kiem nhanh
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={searchInputRef}
                      id="guest-header-search"
                      key={activeSearchQuery}
                      type="search"
                      name="q"
                      defaultValue={activeSearchQuery}
                      placeholder="Tim mau thiep, blog, trang..."
                      className="h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-950 lg:rounded-2xl"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-stone-950 px-4 transition hover:bg-stone-800 lg:rounded-2xl"
                    >
                      <Search className="size-4" />
                    </button>
                  </div>
                  <p className="text-xs leading-5">
                    Tim san pham, bai viet blog va cac trang thong tin cong khai.
                  </p>
                </form>
              </div>
            ) : null}
          </div>
          <details
            className="group relative"
            open={isAccountMenuOpen}
            onToggle={(event) => setIsAccountMenuOpen(event.currentTarget.open)}
          >
            <summary
              className="list-none"
              onClick={() => {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="inline-flex cursor-pointer items-center">
                {user ? (
                  <span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 text-sm transition hover:border-stone-300 hover:bg-stone-200">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.username}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      userInitial
                    )}
                  </span>
                ) : (
                  <span
                    aria-label="Tài khoản khách"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                )}
              </span>
            </summary>
            <div className="absolute right-0 top-[3.25rem] z-50 hidden min-w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:block lg:rounded-2xl">
              {user ? (
                <div className="flex flex-col gap-1">
                  <div className="border-b border-stone-100 px-3 py-2">
                    <p>{user.username}</p>
                    <p className="text-sm">{getRoleLabel(user.role)}</p>
                  </div>
                  <Link href={dashboardHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    {isAdminRole(user.role) ? "Quản lý admin" : "Khu vực khách hàng"}
                  </Link>
                  <Link href={ROUTES.CUSTOMER.INVITATIONS} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    Thiệp của tôi
                  </Link>
                  <Link href={ROUTES.WISHLIST} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    Yêu thích của tôi
                  </Link>
                  <Link href={ROUTES.CUSTOMER.ORDERS} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    Đơn hàng của tôi
                  </Link>
                  <Link href={settingsHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    Cài đặt tài khoản
                  </Link>
                  <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-stone-100 lg:rounded-2xl"
                    >
                      Đăng xuất
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link href={ROUTES.AUTH.LOGIN} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    Đăng nhập
                  </Link>
                  <Link href={ROUTES.AUTH.REGISTER} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl" onClick={closeAccountMenu}>
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </details>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white transition hover:border-stone-300 hover:bg-stone-50 lg:hidden"
            onClick={() => {
              setIsAccountMenuOpen(false);
              setIsSearchOpen(false);
              setIsMobileMenuOpen((current) => !current);
            }}
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {isSearchOpen ? (
          <div ref={searchPanelRef} className="absolute inset-x-0 top-[calc(100%+0.5rem)] lg:hidden">
            <div className="max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
              <form className="space-y-3" onSubmit={handleSearchSubmit}>
                <label className="block px-1 text-sm" htmlFor="guest-header-search-mobile">
                  Tìm kiếm nhanh
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={mobileSearchInputRef}
                    id="guest-header-search-mobile"
                    key={activeSearchQuery}
                    type="search"
                    name="q"
                    defaultValue={activeSearchQuery}
                    placeholder="Tìm mẫu thiệp, blog, trang..."
                    className="h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-stone-950"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-950 transition hover:bg-stone-800"
                    aria-label="Tìm kiếm"
                  >
                    <Search className="size-4" />
                  </button>
                </div>
                <p className="px-1 text-xs leading-5">
                  Tìm sản phẩm, bài viết blog và các trang thông tin công khai.
                </p>
              </form>
            </div>
          </div>
        ) : null}

        {isAccountMenuOpen ? (
          <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] lg:hidden">
            <div className="max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
              {user ? (
                <div className="space-y-1">
                  <div className="border-b border-stone-100 px-3 pb-3 pt-1">
                    <p>{user.username}</p>
                    <p className="text-sm">{getRoleLabel(user.role)}</p>
                  </div>
                  <Link href={dashboardHref} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-stone-100" onClick={closeAccountMenu}>
                    {isAdminRole(user.role) ? "Quản lý admin" : "Khu vực khách hàng"}
                  </Link>
                  <Link href={ROUTES.CUSTOMER.INVITATIONS} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-stone-100" onClick={closeAccountMenu}>
                    Thiệp của tôi
                  </Link>
                  <Link href={ROUTES.WISHLIST} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-stone-100" onClick={closeAccountMenu}>
                    Yêu thích của tôi
                  </Link>
                  <Link href={ROUTES.CUSTOMER.ORDERS} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-stone-100" onClick={closeAccountMenu}>
                    Đơn hàng của tôi
                  </Link>
                  <Link href={settingsHref} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-stone-100" onClick={closeAccountMenu}>
                    Cài đặt tài khoản
                  </Link>
                  <form action={ROUTES.AUTH.LOGOUT_API} method="POST" className="border-t border-stone-100 pt-2">
                    <button
                      type="submit"
                      className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm hover:bg-stone-100"
                    >
                      Đăng xuất
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-950 px-3 text-sm"
                    onClick={closeAccountMenu}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href={ROUTES.AUTH.REGISTER}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 px-3 text-sm"
                    onClick={closeAccountMenu}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {isMobileMenuOpen ? (
          <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] lg:hidden">
            <div className="max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
              <nav className="space-y-2">
                {headerTree.map((item) => (
                  <MobileNavItem key={item.id} item={item} onNavigate={closeMobileMenu} />
                ))}
              </nav>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                <Link
                  href={ROUTES.WISHLIST}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 px-3 text-sm"
                  onClick={closeMobileMenu}
                >
                  Yêu thích
                </Link>
                <Link
                  href={user ? dashboardHref : ROUTES.AUTH.LOGIN}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-stone-950 px-3 text-sm"
                  onClick={closeMobileMenu}
                >
                  {user ? "Tài khoản" : "Đăng nhập"}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
