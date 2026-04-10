"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type PageToastProps = {
  message: string;
  variant?: "success" | "error" | "info";
  cleanupKeys?: string[];
};

export function PageToast({
  message,
  variant = "info",
  cleanupKeys = ["saved", "error", "deleted", "bulk", "count"],
}: PageToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!message) return;

    if (variant === "success") {
      toast.success(message);
    } else if (variant === "error") {
      toast.error(message);
    } else {
      toast(message);
    }

    if (cleanupKeys.length === 0) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    let changed = false;

    for (const key of cleanupKeys) {
      if (nextParams.has(key)) {
        nextParams.delete(key);
        changed = true;
      }
    }

    if (!changed) return;

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [cleanupKeys, message, pathname, router, searchParams, variant]);

  return null;
}
