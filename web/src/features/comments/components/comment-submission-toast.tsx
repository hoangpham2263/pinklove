"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function CommentSubmissionToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams.get("comment");

  useEffect(() => {
    if (state !== "pending") return;

    toast.success("Bình luận đang chờ admin duyệt.");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("comment");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, state]);

  return null;
}
