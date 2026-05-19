"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { publicApi } from "@/lib/api-client.public";
import { ROUTES } from "@/lib/routes";

export function AffiliateRefTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("ref")?.trim().toLowerCase();
    if (!code || !pathname) {
      return;
    }

    if (pathname.startsWith(ROUTES.ADMIN.ROOT) || pathname.startsWith("/api")) {
      return;
    }

    const key = `pinklove-affiliate-track:${code}:${pathname}`;
    if (window.sessionStorage.getItem(key)) {
      return;
    }

    const landingParams = new URLSearchParams(searchParams.toString());
    landingParams.delete("ref");
    const landingPath = `${pathname}${landingParams.toString() ? `?${landingParams.toString()}` : ""}`;

    window.sessionStorage.setItem(key, "1");

    void publicApi.trackAffiliateReferral({
      code,
      landingPath,
    }).catch(() => {
      window.sessionStorage.removeItem(key);
    });
  }, [pathname, searchParams]);

  return null;
}
