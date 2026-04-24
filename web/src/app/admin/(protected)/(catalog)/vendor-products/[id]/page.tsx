import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getVendorProductSubmissionDetailForAdmin } from "@/features/vendor-product-submissions/server/service";
import { getVendorProductReviewStatusLabel, getVendorProductSubmissionTypeLabel } from "@/features/vendor-product-submissions/labels";
import { VendorProductStatusBadge } from "@/features/vendor-product-submissions/components/vendor-product-status-badge";

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminVendorProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getVendorProductSubmissionDetailForAdmin(id);

  if (!detail) {
    notFound();
  }

  const canApprove = ["submitted", "under_review", "changes_requested"].includes(detail.reviewStatus);

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="outline" render={<Link href={ROUTES.ADMIN.VENDOR_PRODUCTS}>Quay lại danh sách</Link>} />
            <VendorProductStatusBadge status={detail.reviewStatus} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">
            {detail.vendorDisplayName} • {getVendorProductSubmissionTypeLabel(detail.submissionType)} • {getVendorProductReviewStatusLabel(detail.reviewStatus)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Thông tin submission</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              <div><p className="text-muted-foreground">Vendor</p><p className="font-medium">{detail.vendorDisplayName} ({detail.vendorUsername})</p></div>
              <div><p className="text-muted-foreground">Slug đề xuất</p><p className="font-medium">/{detail.slugCandidate}</p></div>
              <div><p className="text-muted-foreground">Category</p><p className="font-medium">{detail.categoryName || "Chưa chọn"}</p></div>
              <div><p className="text-muted-foreground">Sản phẩm live</p><p className="font-medium">{detail.linkedProductName || "Chưa liên kết"}</p></div>
              <div><p className="text-muted-foreground">Giá nhập</p><p className="font-medium">{detail.purchaseCost}</p></div>
              <div><p className="text-muted-foreground">Giá bán admin</p><p className="font-medium">{detail.adminSellPrice ?? "Chưa nhập"}</p></div>
              <div><p className="text-muted-foreground">Số lượng</p><p className="font-medium">{detail.proposedStockQuantity}</p></div>
              <div><p className="text-muted-foreground">SKU vendor</p><p className="font-medium">{detail.vendorSku || "Chưa có"}</p></div>
              <div><p className="text-muted-foreground">Submitted</p><p className="font-medium">{formatDateTime(detail.submittedAt)}</p></div>
              <div><p className="text-muted-foreground">Reviewed</p><p className="font-medium">{formatDateTime(detail.reviewedAt)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Nội dung vendor gửi</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Mô tả ngắn</p>
                <p className="mt-1 text-muted-foreground">{detail.excerpt || "Chưa có"}</p>
              </div>
              <div>
                <p className="font-medium">Mô tả chi tiết</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.description || "Chưa có"}</p>
              </div>
              <div>
                <p className="font-medium">Ghi chú vendor</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.vendorNote || "Chưa có"}</p>
              </div>
              <div>
                <p className="font-medium">Review note admin</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.reviewNote || "Chưa có"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {detail.events.map((event) => (
                <div key={event.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-muted-foreground">{event.actorType}{event.actorUsername ? ` • ${event.actorUsername}` : ""}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Review nhanh</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="under_review" />
                <Button type="submit" variant="outline" className="w-full">Đánh dấu đang review</Button>
              </form>

              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="changes_requested" />
                <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Nêu rõ vendor cần chỉnh gì" />
                <Button type="submit" variant="outline" className="w-full">Yêu cầu chỉnh sửa</Button>
              </form>

              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="rejected" />
                <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Lý do từ chối" />
                <Button type="submit" variant="destructive" className="w-full">Từ chối hồ sơ</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Duyệt và áp dụng</CardTitle></CardHeader>
            <CardContent>
              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.APPROVE(detail.id)} method="POST" className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Giá bán admin</label>
                  <input
                    name="adminSellPrice"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={String(detail.adminSellPrice ?? 0)}
                    disabled={!canApprove}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú duyệt</label>
                  <textarea
                    name="reviewNote"
                    defaultValue={detail.reviewNote}
                    disabled={!canApprove}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!canApprove}>
                  Duyệt và apply vào catalog
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
