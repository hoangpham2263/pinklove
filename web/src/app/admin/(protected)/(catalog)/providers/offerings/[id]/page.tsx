import { notFound } from "next/navigation";

import { CurrencyInput } from "@/components/common/currency-input";
import { AdminDeleteButton, AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminCheckbox, AdminField, AdminTextarea } from "@/features/admin/components/admin-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { getProviderOfferingSubmissionDetailForAdmin } from "@/features/provider-offering-submissions/server/service";
import { getProviderOfferingReviewStatusLabel, getProviderOfferingSubmissionTypeLabel } from "@/features/provider-offering-submissions/labels";
import { ProviderOfferingStatusBadge } from "@/features/provider-offering-submissions/components/provider-offering-status-badge";
import { getProviderServiceKindLabel } from "@/features/provider-offering-submissions/config/service-kinds";

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFulfillmentLabel(value: string) {
  switch (value) {
    case "service":
      return "Dịch vụ";
    case "physical":
      return "Sản phẩm vật lý";
    case "digital":
      return "Sản phẩm online";
    default:
      return value;
  }
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
  const applyLabel = detail.reviewStatus === "approved" ? "Cập nhật lại catalog" : "Duyệt và áp dụng vào catalog";

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

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-9">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Thông tin submission</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 text-sm md:grid-cols-2">
              <div><p className="text-muted-foreground">Nhà cung cấp</p><p>{detail.providerDisplayName} ({detail.providerUsername})</p></div>
              <div><p className="text-muted-foreground">Slug đề xuất</p><p>/{detail.slugCandidate}</p></div>
              <div><p className="text-muted-foreground">Category</p><p>{detail.categoryName || "Chưa chọn"}</p></div>
              <div><p className="text-muted-foreground">Dịch vụ/sản phẩm live</p><p>{detail.linkedOfferingName || "Chưa liên kết"}</p></div>
              <div><p className="text-muted-foreground">Loại hồ sơ</p><p>{getFulfillmentLabel(detail.fulfillmentType)}</p></div>
              {detail.fulfillmentType === "service" ? (
                <>
                  <div><p className="text-muted-foreground">Loại dịch vụ</p><p>{getProviderServiceKindLabel(detail.serviceKind)}</p></div>
                  <div><p className="text-muted-foreground">Thời lượng mặc định</p><p>{detail.durationMinutes > 0 ? `${detail.durationMinutes} phút` : "Chưa khai báo"}</p></div>
                  <div><p className="text-muted-foreground">Khu vực phục vụ</p><p>{detail.serviceArea || "Chưa khai báo"}</p></div>
                </>
              ) : null}
              <div><p className="text-muted-foreground">Giá nhập</p><p>{formatVnd(detail.purchaseCost)}</p></div>
              <div><p className="text-muted-foreground">Giá bán admin</p><p>{detail.adminSellPrice ? formatVnd(detail.adminSellPrice) : "Chưa nhập"}</p></div>
              <div><p className="text-muted-foreground">Số lượng</p><p>{detail.proposedStockQuantity}</p></div>
              <div><p className="text-muted-foreground">SKU provider</p><p>{detail.providerSku || "Chưa có"}</p></div>
              <div><p className="text-muted-foreground">Ngày gửi duyệt</p><p>{formatDateTime(detail.submittedAt)}</p></div>
              <div><p className="text-muted-foreground">Ngày duyệt</p><p>{formatDateTime(detail.reviewedAt)}</p></div>
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
                <p>Ghi chú nhà cung cấp</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.providerNote || "Chưa có"}</p>
              </div>
              <div>
                <p>Ghi chú duyệt của admin</p>
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

        <div className="space-y-5 lg:col-span-3">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Thao tác duyệt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="under_review" />
                <AdminOutlineButton type="submit" className="w-full">Đánh dấu đang duyệt</AdminOutlineButton>
              </form>

              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="changes_requested" />
                <AdminTextarea name="reviewNote" className="min-h-24" placeholder="Nêu rõ provider cần chỉnh gì" />
                <AdminOutlineButton type="submit" className="w-full">Yêu cầu chỉnh sửa</AdminOutlineButton>
              </form>

              <form action={ROUTES.API.ADMIN.PROVIDER_OFFERINGS.REVIEW(detail.id)} method="POST" className="space-y-3">
                <input type="hidden" name="nextStatus" value="rejected" />
                <AdminTextarea name="reviewNote" className="min-h-24" placeholder="Lý do từ chối" />
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
                <AdminField label="Giá bán admin">
                  <CurrencyInput
                    name="adminSellPrice"
                    defaultValue={detail.adminSellPrice ? String(detail.adminSellPrice) : ""}
                    required
                    disabled={!canApply}
                    className="rounded-md bg-background px-3 text-sm disabled:opacity-60"
                  />
                </AdminField>
                <AdminField label="Ghi chú duyệt">
                  <AdminTextarea
                    name="reviewNote"
                    defaultValue={detail.reviewNote}
                    disabled={!canApply}
                    className="min-h-24"
                  />
                </AdminField>
                {detail.submissionType !== "discontinue" ? (
                  <div className="rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Cung ứng / chủ sở hữu</p>
                    <p className="mt-1 text-muted-foreground">
                      Khi áp dụng, catalog tự gán provider gửi hồ sơ này làm nguồn cung ứng/chủ sở hữu ban đầu.
                    </p>
                  </div>
                ) : null}
                {detail.submissionType !== "discontinue" ? (
                  <AdminCheckbox
                    name="assignProviderSupplier"
                    defaultChecked
                    disabled={!canApply}
                    description="Gán provider này làm nhà cung cấp đã duyệt cho dịch vụ/sản phẩm sau khi áp dụng."
                  />
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
