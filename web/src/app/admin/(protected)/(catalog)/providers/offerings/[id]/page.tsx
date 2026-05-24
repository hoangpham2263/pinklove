import { notFound } from "next/navigation";

import { AdminDeleteButton, AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getProviderOfferingSubmissionDetailForAdmin } from "@/features/provider-offering-submissions/server/service";
import { getProviderOfferingReviewStatusLabel, getProviderOfferingSubmissionTypeLabel } from "@/features/provider-offering-submissions/labels";
import { ProviderOfferingStatusBadge } from "@/features/provider-offering-submissions/components/provider-offering-status-badge";

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminProviderOfferingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; updated?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const detail = await getProviderOfferingSubmissionDetailForAdmin(id);

  if (!detail) {
    notFound();
  }

  const canApply = ["submitted", "under_review", "changes_requested", "approved"].includes(detail.reviewStatus);
  const applyLabel = detail.reviewStatus === "approved" ? "Cập nhật lại catalog" : "Duyệt và apply vào catalog";

  return (
    <section className="flex w-full flex-1 flex-col gap-5 p-5 md:p-7.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ProviderOfferingStatusBadge status={detail.reviewStatus} />
          </div>
          <h1 className="mt-3 text-2xl">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">
            {detail.providerDisplayName} • {getProviderOfferingSubmissionTypeLabel(detail.submissionType)} • {getProviderOfferingReviewStatusLabel(detail.reviewStatus)}
          </p>
        </div>
      </div>

      {query.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Không thể cập nhật catalog: {query.error}
        </div>
      ) : null}

      {query.updated ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Đã cập nhật catalog.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Thông tin submission</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 text-sm md:grid-cols-2">
              <div><p className="text-muted-foreground">Provider</p><p>{detail.providerDisplayName} ({detail.providerUsername})</p></div>
              <div><p className="text-muted-foreground">Slug đề xuất</p><p>/{detail.slugCandidate}</p></div>
              <div><p className="text-muted-foreground">Category</p><p>{detail.categoryName || "Chưa chọn"}</p></div>
              <div><p className="text-muted-foreground">Sản phẩm live</p><p>{detail.linkedOfferingName || "Chưa liên kết"}</p></div>
              <div><p className="text-muted-foreground">Giá nhập</p><p>{detail.purchaseCost}</p></div>
              <div><p className="text-muted-foreground">Giá bán admin</p><p>{detail.adminSellPrice ?? "Chưa nhập"}</p></div>
              <div><p className="text-muted-foreground">Số lượng</p><p>{detail.proposedStockQuantity}</p></div>
              <div><p className="text-muted-foreground">SKU provider</p><p>{detail.providerSku || "Chưa có"}</p></div>
              <div><p className="text-muted-foreground">Submitted</p><p>{formatDateTime(detail.submittedAt)}</p></div>
              <div><p className="text-muted-foreground">Reviewed</p><p>{formatDateTime(detail.reviewedAt)}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Nội dung provider gửi</CardTitle>
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
                <p>Ghi chú provider</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.providerNote || "Chưa có"}</p>
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
              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="under_review" />
                <AdminOutlineButton type="submit" className="w-full">Đánh dấu đang review</AdminOutlineButton>
              </form>

              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="changes_requested" />
                <textarea name="reviewNote" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Nêu rõ provider cần chỉnh gì" />
                <AdminOutlineButton type="submit" className="w-full">Yêu cầu chỉnh sửa</AdminOutlineButton>
              </form>

              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.REVIEW(detail.id)} method="POST" className="space-y-3">
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
              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.APPROVE(detail.id)} method="POST" className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm">Giá bán admin</label>
                  <input
                    name="adminSellPrice"
                    type="number"
                    min="0"
                    defaultValue={detail.adminSellPrice ? String(detail.adminSellPrice) : ""}
                    required
                    disabled={!canApply}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Ghi chú duyệt</label>
                  <textarea
                    name="reviewNote"
                    defaultValue={detail.reviewNote}
                    disabled={!canApply}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  />
                </div>
                {detail.submissionType === "create" ? (
                  <div className="space-y-2">
                    <label className="text-sm">Quyền sở hữu catalog</label>
                    <select
                      name="offeringOwnership"
                      defaultValue="platform"
                      disabled={!canApply}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                    >
                      <option value="platform">Platform-owned, có thể mở cho nhiều provider</option>
                      <option value="provider_originated">Provider-originated, gán provider đề xuất làm nguồn ban đầu</option>
                    </select>
                  </div>
                ) : null}
                {detail.submissionType !== "discontinue" ? (
                  <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                    <input
                      type="checkbox"
                      name="assignProviderSupplier"
                      defaultChecked
                      disabled={!canApply}
                      className="mt-1"
                    />
                    <span>Gán provider này làm supplier đã duyệt cho sản phẩm sau khi approve.</span>
                  </label>
                ) : null}
                <AdminSubmitButton className="w-full" disabled={!canApply}>
                  {applyLabel}
                </AdminSubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
