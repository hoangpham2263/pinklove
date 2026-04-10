"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export type ClientHeaderLink = {
  id: string;
  label: string;
  href: string;
  parentId?: string | null;
};

export type ClientHeaderNode = ClientHeaderLink & {
  children: ClientHeaderNode[];
};

type ClientHeaderProps = {
  user: {
    username: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  headerTree: ClientHeaderNode[];
  dashboardHref: string;
  settingsHref: string;
};

function NavDropdown({
  item,
  depth = 0,
}: {
  item: ClientHeaderNode;
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

export function ClientHeader({
  user,
  headerTree,
  dashboardHref,
  settingsHref,
}: ClientHeaderProps) {
  const userInitial = user?.username?.trim().charAt(0).toUpperCase() || "U";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="container px-4 mx-auto fixed inset-x-0 top-2.5 z-50 flex justify-center">
      <div
        style={{ width: isScrolled ? "1024px" : "100%", maxWidth: "100%" }}
        className={[
          "px-5 flex h-14 items-center justify-between gap-15 rounded-full border border-stone-200 transition-[width,padding,background-color,box-shadow] duration-300 ease-out",
          isScrolled
            ? "bg-[rgba(255,250,247,0.9)] px-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur"
            : "bg-white",
        ].join(" ")}
      >
        <div className="flex items-center justify-start">
          <Link href={ROUTES.HOME} className="font-semibold tracking-[0.18em] uppercase">Pinklove</Link>
        </div>

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

        <div className="flex items-center justify-end">
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
                    <p className="text-sm text-stone-500">{user.role}</p>
                  </div>
                  <Link href={dashboardHref} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    {user.role === "admin" ? "Quản lý Admin" : "Trang người dùng"}
                  </Link>
                  <Link href={ROUTES.USER.INVITATIONS} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Thiệp của tôi
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
