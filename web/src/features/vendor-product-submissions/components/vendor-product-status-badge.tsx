import { Badge } from "@/components/ui/badge";
import { getVendorProductReviewStatusLabel } from "@/features/vendor-product-submissions/labels";
import type { VendorProductReviewStatus } from "@/features/vendor-product-submissions/types";
import { cn } from "@/lib/utils";

export function VendorProductStatusBadge({ status }: { status: VendorProductReviewStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-1 text-xs",
        status === "approved" && "bg-emerald-100 text-emerald-800",
        status === "submitted" && "bg-sky-100 text-sky-800",
        status === "under_review" && "bg-indigo-100 text-indigo-800",
        status === "changes_requested" && "bg-amber-100 text-amber-900",
        status === "rejected" && "bg-rose-100 text-rose-800",
        status === "draft" && "bg-zinc-100 text-zinc-700",
        status === "archived" && "bg-zinc-200 text-zinc-700"
      )}
    >
      {getVendorProductReviewStatusLabel(status)}
    </Badge>
  );
}
