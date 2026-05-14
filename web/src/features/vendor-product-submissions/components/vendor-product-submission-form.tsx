"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AdminOutlineButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import { vendorApi } from "@/lib/api-client.vendor";
import { finishMutation } from "@/lib/client-mutation";
import { slugify } from "@/lib/utils";
import type { ProductCategory } from "@/features/products/types";
import type { VendorProductSubmissionDetail, VendorProductSubmissionType } from "@/features/vendor-product-submissions/types";
import { getVendorProductSubmissionTypeLabel } from "@/features/vendor-product-submissions/labels";
import { VendorProductStatusBadge } from "@/features/vendor-product-submissions/components/vendor-product-status-badge";

type LiveProductOption = {
  id: string;
  name: string;
  slug: string;
};

type VendorProductSubmissionFormProps = {
  submission?: VendorProductSubmissionDetail | null;
  categories: ProductCategory[];
  liveProducts: LiveProductOption[];
};

export function VendorProductSubmissionForm({
  submission,
  categories,
  liveProducts,
}: VendorProductSubmissionFormProps) {
  const router = useRouter();
  const [name, setName] = useState(submission?.name ?? "");
  const [slugCandidate, setSlugCandidate] = useState(submission?.slugCandidate ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(submission?.thumbnailUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canEdit = !submission || ["draft", "changes_requested"].includes(submission.reviewStatus);
  const canSubmit = Boolean(submission && ["draft", "changes_requested"].includes(submission.reviewStatus));

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await vendorApi.saveProductSubmission(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu hồ sơ sản phẩm.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu hồ sơ sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!submission) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const result = await vendorApi.submitProductSubmission(submission.id, formData);
      toast.success(result.message ?? "Đã gửi duyệt.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi duyệt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {submission ? <input type="hidden" name="submissionId" value={submission.id} /> : null}
      <input type="hidden" name="thumbnailUrl" value={thumbnailUrl} />

      <Card className="border-zinc-200/80 bg-white/92">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-semibold text-zinc-950">Thông tin sản phẩm vendor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Loại yêu cầu</label>
              <select
                name="submissionType"
                defaultValue={submission?.submissionType ?? "create"}
                disabled={!canEdit}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
              >
                {(["create", "update", "discontinue"] as VendorProductSubmissionType[]).map((item) => (
                  <option key={item} value={item}>
                    {getVendorProductSubmissionTypeLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Sản phẩm live liên kết</label>
              <select
                name="linkedProductId"
                defaultValue={submission?.linkedProductId ?? ""}
                disabled={!canEdit}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
              >
                <option value="">Không liên kết</option>
                {liveProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} /{product.slug}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Tên sản phẩm</label>
              <Input
                name="name"
                value={name}
                disabled={!canEdit}
                onChange={(event) => {
                  const next = event.target.value;
                  setName(next);
                  setSlugCandidate(slugify(next));
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Slug đề xuất</label>
              <Input
                name="slugCandidate"
                value={slugCandidate}
                disabled={!canEdit}
                onChange={(event) => setSlugCandidate(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Category</label>
              <select
                name="categoryId"
                defaultValue={submission?.categoryId ?? ""}
                disabled={!canEdit}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
              >
                <option value="">Không chọn category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Hình thức bàn giao</label>
              <select
                name="fulfillmentType"
                defaultValue={submission?.fulfillmentType ?? "physical"}
                disabled={!canEdit}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
              >
                <option value="digital">Digital</option>
                <option value="physical">Vật lý / vận chuyển</option>
                <option value="service">Dịch vụ</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Giá nhập</label>
              <Input name="purchaseCost" type="number" min="0" step="1000" defaultValue={String(submission?.purchaseCost ?? 0)} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Số lượng</label>
              <Input name="proposedStockQuantity" type="number" min="0" defaultValue={String(submission?.proposedStockQuantity ?? 0)} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Ngưỡng cảnh báo thấp</label>
              <Input name="lowStockThreshold" type="number" min="0" defaultValue={String(submission?.lowStockThreshold ?? 0)} disabled={!canEdit} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">SKU vendor</label>
              <Input name="vendorSku" defaultValue={submission?.vendorSku ?? ""} disabled={!canEdit} />
            </div>
            <label className="flex items-start gap-3 rounded-md border border-zinc-200 p-3 text-sm">
              <input type="checkbox" name="allowBackorder" defaultChecked={submission?.allowBackorder ?? false} disabled={!canEdit} className="mt-1 rounded border-input" />
              <span className="text-zinc-700">Cho phép backorder khi số lượng không đủ.</span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-950">Ảnh đại diện</label>
            {canEdit ? (
              <MediaSelector value={thumbnailUrl} onChange={setThumbnailUrl} />
            ) : thumbnailUrl ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                {thumbnailUrl}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-200 p-3 text-sm text-zinc-500">
                Chưa có ảnh đại diện.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-950">Mô tả ngắn</label>
            <textarea name="excerpt" defaultValue={submission?.excerpt ?? ""} disabled={!canEdit} className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-950">Mô tả chi tiết</label>
            <textarea name="description" defaultValue={submission?.description ?? ""} disabled={!canEdit} className="min-h-36 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-950">Ghi chú cho admin</label>
            <textarea name="vendorNote" defaultValue={submission?.vendorNote ?? ""} disabled={!canEdit} className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="border-zinc-200/80 bg-white/92">
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold text-zinc-950">Trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {submission ? (
              <>
                <VendorProductStatusBadge status={submission.reviewStatus} />
                <div className="space-y-2 text-sm text-zinc-600">
                  <p>Giá bán admin: {submission.adminSellPrice ?? "Chưa nhập"}</p>
                  <p>Review note: {submission.reviewNote || "Chưa có"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-600">Tạo nháp mới cho vendor, sau đó gửi admin duyệt.</p>
            )}

            {canEdit ? (
              <AdminSubmitButton className="w-full" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : submission ? "Lưu hồ sơ" : "Tạo nháp"}
              </AdminSubmitButton>
            ) : null}

            {canSubmit ? (
              <AdminOutlineButton className="w-full" disabled={isSubmitting} onClick={() => void handleSubmitForReview()}>
                {isSubmitting ? "Đang gửi..." : "Gửi admin duyệt"}
              </AdminOutlineButton>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
