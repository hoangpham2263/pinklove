"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getRoleLabel, isAdminRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_12_3190)">
              <path d="M12 24C11.6583 24 11.3289 23.8609 11.0722 23.6081C10.1026 22.6552 9.16789 21.7597 8.34317 20.9698L8.33895 20.9657C5.92105 18.6497 3.8331 16.6497 2.38035 14.6794C0.75642 12.4769 0 10.3885 0 8.10708C0 5.89052 0.676217 3.84556 1.90392 2.3487C3.14629 0.834148 4.85099 0 6.70456 0C8.08995 0 9.35867 0.492312 10.4755 1.46313C11.039 1.95313 11.5499 2.55287 12 3.2524C12.4502 2.55287 12.9609 1.95313 13.5247 1.46313C14.6415 0.492312 15.9102 0 17.2956 0C19.149 0 20.8538 0.834148 22.0962 2.3487C23.3239 3.84556 24 5.89052 24 8.10708C24 10.3884 23.2437 12.4769 21.6198 14.6792C20.167 16.6497 18.0792 18.6495 15.6617 20.9653C14.8355 21.7565 13.8993 22.6534 12.9276 23.6085C12.6708 23.861 12.3412 24.0001 12 24ZM6.70456 1.5802C5.24835 1.5802 3.91059 2.23348 2.93737 3.41973C1.94971 4.62396 1.40568 6.28857 1.40568 8.10708C1.40568 10.0259 2.04014 11.7419 3.4627 13.6712C4.83763 15.536 6.88274 17.4949 9.25067 19.7632L9.25503 19.7673C10.0828 20.5602 11.0213 21.4593 11.998 22.4192C12.9805 21.4574 13.9204 20.557 14.7498 19.7628C17.1176 17.4945 19.1625 15.536 20.5374 13.6712C21.9598 11.7419 22.5943 10.0259 22.5943 8.10708C22.5943 6.28852 22.0502 4.62391 21.0626 3.41973C20.0896 2.23348 18.7516 1.5802 17.2956 1.5802C16.2288 1.5802 15.2493 1.9614 14.3845 2.71299C13.6139 3.38312 13.077 4.23023 12.7622 4.82296C12.6004 5.12776 12.3155 5.30969 12 5.30969C11.6845 5.30969 11.3996 5.12776 11.2377 4.82296C10.9232 4.23023 10.3863 3.38312 9.61536 2.71299C8.75061 1.9614 7.77116 1.5802 6.70456 1.5802Z" fill="black" />
            </g>
            <defs>
              <clipPath id="clip0_12_3190">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_10_3186)">
              <path d="M23.7728 22.6943L17.5764 16.5969C19.199 14.834 20.196 12.5024 20.196 9.93682C20.1952 4.44852 15.6747 0 10.0979 0C4.52104 0 0.000488281 4.44852 0.000488281 9.93682C0.000488281 15.4251 4.52104 19.8736 10.0979 19.8736C12.5074 19.8736 14.7174 19.0402 16.4534 17.6546L22.6738 23.776C22.9769 24.0746 23.469 24.0746 23.7721 23.776C23.8442 23.7056 23.9015 23.6215 23.9406 23.5287C23.9797 23.4358 23.9999 23.3361 24 23.2353C24.0001 23.1345 23.98 23.0348 23.941 22.9419C23.902 22.849 23.8448 22.7648 23.7728 22.6943ZM10.0979 18.3448C5.37926 18.3448 1.55411 14.5804 1.55411 9.93682C1.55411 5.29321 5.37926 1.52884 10.0979 1.52884C14.8165 1.52884 18.6416 5.29321 18.6416 9.93682C18.6416 14.5804 14.8165 18.3448 10.0979 18.3448Z" fill="black" />
            </g>
            <defs>
              <clipPath id="clip0_10_3186">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
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
                  <Link href={ROUTES.CHECKOUT.CART} className="rounded-xl px-3 py-2 text-sm hover:bg-stone-100 lg:rounded-2xl">
                    Giỏ hàng
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
