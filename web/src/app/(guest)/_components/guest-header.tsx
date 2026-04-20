"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { useWishlist } from "@/features/products/use-wishlist";
import { getRoleLabel, isAdminRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type GuestHeaderLink = {
  id: string;
  label: string;
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

function NavDropdown({
  item,
  depth = 0,
}: {
  item: GuestHeaderNode;
  depth?: number;
}) {
  const contentClassName =
    depth === 0
      ? "invisible absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-56 translate-y-2 rounded-xl border border-stone-200 bg-white p-2 opacity-0 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 lg:rounded-2xl"
      : "invisible absolute left-[calc(100%+0.5rem)] top-0 z-50 min-w-56 rounded-xl border border-stone-200 bg-white p-2 opacity-0 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-200 group-hover:visible group-hover:opacity-100 lg:rounded-2xl";

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className={depth === 0 ? "text-sm md:text-base whitespace-nowrap" : "rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl"}
      >
        {item.label}
      </Link>
      {depth === 0 ? <div className="absolute left-0 top-full h-3 w-full" /> : null}
      <div className={contentClassName}>
        <div className="flex flex-col gap-1">
          {item.children.map((child) => (
            child.children.length > 0 ? (
              <NavDropdown key={child.id} item={child} depth={depth + 1} />
            ) : (
              <Link key={child.id} href={child.href} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                {child.label}
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
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
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
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
    if (!isSearchOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
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
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchInputRef.current?.value.trim() ?? "";
    setIsSearchOpen(false);

    if (!query) {
      router.push(ROUTES.SEARCH);
      return;
    }

    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="container px-4 mx-auto fixed inset-x-0 top-2.5 z-50 flex justify-center">
      <div
        style={{ width: isScrolled ? "1024px" : "100%", maxWidth: "100%" }}
        className={[
          "px-5 flex h-16 items-center justify-between gap-15 rounded-full border border-stone-200 transition-[width,padding,background-color,box-shadow] duration-300 ease-out",
          isScrolled
            ? "bg-[rgba(255,250,247,0.9)] px-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur"
            : "bg-white",
        ].join(" ")}
      >
        <Link href={ROUTES.HOME}>
          {siteLogo ? (
            <img src={siteLogo} alt={siteName} className="h-5 2xl:h-7.5 object-contain pointer-events-none" />
          ) : (
            <span className="font-semibold tracking-[0.18em] uppercase">{siteName}</span>
          )}
        </Link>

        <nav className="flex items-center justify-center gap-4">
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

        <div className="flex items-center justify-end gap-x-5">
          <Link
            href={ROUTES.WISHLIST}
            aria-label={`Wishlist (${count})`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 transition hover:border-rose-200 hover:text-rose-500"
            onClick={(event) => {
              if (user) {
                return;
              }

              event.preventDefault();
              window.location.href = `${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(ROUTES.WISHLIST)}`;
            }}
          >
            <Heart className={cn("size-5", count > 0 && "fill-current text-rose-500")} />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
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
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-900 transition hover:border-stone-300 hover:bg-stone-50",
                isSearchOpen && "border-stone-900"
              )}
              onClick={() => setIsSearchOpen((current) => !current)}
            >
              <Search className="size-5" />
            </button>
            {isSearchOpen ? (
              <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-stone-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:rounded-2xl">
                <form className="space-y-3" onSubmit={handleSearchSubmit}>
                  <label className="block text-sm font-medium text-stone-900" htmlFor="guest-header-search">
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
                      className="h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-950 lg:rounded-2xl"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-stone-950 px-4 text-white transition hover:bg-stone-800 lg:rounded-2xl"
                    >
                      <Search className="size-4" />
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-stone-500">
                    Tim san pham, bai viet blog va cac trang thong tin cong khai.
                  </p>
                </form>
              </div>
            ) : null}
          </div>
          <details className="group relative">
            <summary className="list-none">
              <span className="inline-flex cursor-pointer items-center">
                {user ? (
                  <span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 text-sm font-semibold transition hover:border-stone-300 hover:bg-stone-200">
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50">
                    L
                  </span>
                )}
              </span>
            </summary>
            <div className="absolute right-0 top-12 z-50 min-w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:rounded-2xl">
              {user ? (
                <div className="flex flex-col gap-1">
                  <div className="border-b border-stone-100 px-3 py-2">
                    <p className="font-medium text-stone-900">{user.username}</p>
                    <p className="text-sm text-stone-500">{getRoleLabel(user.role)}</p>
                  </div>
                  <Link href={dashboardHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    {isAdminRole(user.role) ? "Quản lý admin" : "Khu vực khách hàng"}
                  </Link>
                  <Link href={ROUTES.CUSTOMER.INVITATIONS} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Thiệp của tôi
                  </Link>
                  <Link href={ROUTES.WISHLIST} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Yeu thich cua toi
                  </Link>
                  <Link href={ROUTES.CUSTOMER.ORDERS} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Đơn hàng của tôi
                  </Link>
                  <Link href={settingsHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Cài đặt tài khoản
                  </Link>
                  <form action={ROUTES.AUTH.LOGOUT_API} method="POST">
                    <button
                      type="submit"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-stone-100 lg:rounded-2xl"
                    >
                      Đăng xuất
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link href={ROUTES.AUTH.LOGIN} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Đăng nhập
                  </Link>
                  <Link href={ROUTES.AUTH.REGISTER} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
