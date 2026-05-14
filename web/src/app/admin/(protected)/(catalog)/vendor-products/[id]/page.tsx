import { notFound } from "next/navigation";

import { AdminBackButton, AdminDeleteButton, AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
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
            <AdminBackButton href={ROUTES.ADMIN.VENDOR_PRODUCTS}>Quay lại danh sách</AdminBackButton>
            <VendorProductStatusBadge status={detail.reviewStatus} />
          </div>
          <h1 className="mt-3 text-2xl">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">
            {detail.vendorDisplayName} • {getVendorProductSubmissionTypeLabel(detail.submissionType)} • {getVendorProductReviewStatusLabel(detail.reviewStatus)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Thông tin submission</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 text-sm md:grid-cols-2">
              <div><p className="text-muted-foreground">Vendor</p><p>{detail.vendorDisplayName} ({detail.vendorUsername})</p></div>
              <div><p className="text-muted-foreground">Slug đề xuất</p><p>/{detail.slugCandidate}</p></div>
              <div><p className="text-muted-foreground">Category</p><p>{detail.categoryName || "Chưa chọn"}</p></div>
              <div><p className="text-muted-foreground">Sản phẩm live</p><p>{detail.linkedProductName || "Chưa liên kết"}</p></div>
              <div><p className="text-muted-foreground">Giá nhập</p><p>{detail.purchaseCost}</p></div>
              <div><p className="text-muted-foreground">Giá bán admin</p><p>{detail.adminSellPrice ?? "Chưa nhập"}</p></div>
              <div><p className="text-muted-foreground">Số lượng</p><p>{detail.proposedStockQuantity}</p></div>
              <div><p className="text-muted-foreground">SKU vendor</p><p>{detail.vendorSku || "Chưa có"}</p></div>
              <div><p className="text-muted-foreground">Submitted</p><p>{formatDateTime(detail.submittedAt)}</p></div>
              <div><p className="text-muted-foreground">Reviewed</p><p>{formatDateTime(detail.reviewedAt)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Nội dung vendor gửi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              <div>
                <p>Mô tả ngắn</p>
                <p className="mt-1 text-muted-foreground">{detail.excerpt || "Chưa có"}</p>
              </div>
              <div>
                <p>Mô tả chi tiết</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.description || "Chưa có"}</p>
              </div>
              <div>
                <p>Ghi chú vendor</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.vendorNote || "Chưa có"}</p>
              </div>
              <div>
                <p>Review note admin</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.reviewNote || "Chưa có"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {detail.events.map((event) => (
                <div key={event.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>{event.message}</p>
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
            <CardHeader className="border-b">
              <CardTitle>Review nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="under_review" />
                <AdminOutlineButton type="submit" className="w-full">Đánh dấu đang review</AdminOutlineButton>
              </form>

              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="changes_requested" />
                <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Nêu rõ vendor cần chỉnh gì" />
                <AdminOutlineButton type="submit" className="w-full">Yêu cầu chỉnh sửa</AdminOutlineButton>
              </form>

              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="rejected" />
                <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Lý do từ chối" />
                <AdminDeleteButton type="submit" className="w-full">Từ chối hồ sơ</AdminDeleteButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Duyệt và áp dụng</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form action={ROUTES.API.ADMIN.VENDOR_PRODUCTS.APPROVE(detail.id)} method="POST" className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm">Giá bán admin</label>
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
                  <label className="text-sm">Ghi chú duyệt</label>
                  <textarea
                    name="reviewNote"
                    defaultValue={detail.reviewNote}
                    disabled={!canApprove}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  />
                </div>
                {detail.submissionType === "create" ? (
                  <div className="space-y-2">
                    <label className="text-sm">Quyền sở hữu catalog</label>
                    <select
                      name="productOwnership"
                      defaultValue="platform"
                      disabled={!canApprove}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                    >
                      <option value="platform">Platform-owned, có thể mở cho nhiều vendor</option>
                      <option value="vendor_originated">Vendor-originated, gán vendor đề xuất làm nguồn ban đầu</option>
                    </select>
                  </div>
                ) : null}
                {detail.submissionType !== "discontinue" ? (
                  <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      name="assignVendorSupplier"
                      defaultChecked
                      disabled={!canApprove}
                      className="mt-1"
                    />
                    <span>Gán vendor này làm supplier đã duyệt cho sản phẩm sau khi approve.</span>
                  </label>
                ) : null}
                <AdminSubmitButton className="w-full" disabled={!canApprove}>
                  Duyệt và apply vào catalog
                </AdminSubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
