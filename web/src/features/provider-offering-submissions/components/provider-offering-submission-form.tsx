"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ProviderOutlineButton, ProviderSubmitButton } from "@/features/provider-orders/components/provider-buttons";
import { CurrencyInput } from "@/components/common/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MediaSelector } from "@/features/media/components/media-selector";
import { providerApi } from "@/lib/api-client.provider";
import { finishMutation } from "@/lib/client-mutation";
import { formatVnd } from "@/lib/currency";
import { slugify } from "@/lib/utils";
import type { OfferingCategory, OfferingFulfillmentType } from "@/features/offerings/types";
import type { ProviderOfferingSubmissionDetail, ProviderOfferingSubmissionType } from "@/features/provider-offering-submissions/types";
import { getProviderOfferingSubmissionTypeLabel } from "@/features/provider-offering-submissions/labels";
import { ProviderOfferingStatusBadge } from "@/features/provider-offering-submissions/components/provider-offering-status-badge";
import { PROVIDER_SERVICE_KIND_OPTIONS } from "@/features/provider-offering-submissions/config/service-kinds";

type LiveOfferingOption = {
  id: string;
  name: string;
  slug: string;
};

type ProviderOfferingSubmissionFormProps = {
  submission?: ProviderOfferingSubmissionDetail | null;
  categories: OfferingCategory[];
  liveOfferings: LiveOfferingOption[];
  defaultFulfillmentType?: OfferingFulfillmentType;
};

export function ProviderOfferingSubmissionForm({
  submission,
  categories,
  liveOfferings,
  defaultFulfillmentType = "service",
}: ProviderOfferingSubmissionFormProps) {
  const router = useRouter();
  const [name, setName] = useState(submission?.name ?? "");
  const [slugCandidate, setSlugCandidate] = useState(submission?.slugCandidate ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(submission?.thumbnailUrl ?? "");
  const [submissionType, setSubmissionType] = useState<ProviderOfferingSubmissionType>(submission?.submissionType ?? "create");
  const [fulfillmentType, setFulfillmentType] = useState<OfferingFulfillmentType>(submission?.fulfillmentType ?? defaultFulfillmentType);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canEdit = !submission || ["draft", "changes_requested"].includes(submission.reviewStatus);
  const canSubmit = Boolean(submission && ["draft", "changes_requested"].includes(submission.reviewStatus));
  const requiresLinkedOffering = submissionType !== "create";

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await providerApi.saveOfferingSubmission(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu hồ sơ dịch vụ/sản phẩm.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu hồ sơ dịch vụ/sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitForReview() {
    if (!submission) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const result = await providerApi.submitOfferingSubmission(submission.id, formData);
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
          <CardTitle className="text-base font-semibold text-zinc-950">Thông tin dịch vụ/sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Loại yêu cầu</label>
              <select
                name="submissionType"
                value={submissionType}
                disabled={!canEdit}
                onChange={(event) => setSubmissionType(event.target.value as ProviderOfferingSubmissionType)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
              >
                {(["create", "update", "discontinue"] as ProviderOfferingSubmissionType[]).map((item) => (
                  <option key={item} value={item}>
                    {getProviderOfferingSubmissionTypeLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            {requiresLinkedOffering ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">Dịch vụ/sản phẩm đang liên kết</label>
                <select
                  name="linkedOfferingId"
                  defaultValue={submission?.linkedOfferingId ?? ""}
                  disabled={!canEdit}
                  required
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                >
                  <option value="">Chọn dịch vụ/sản phẩm cần cập nhật/ngừng bán</option>
                  {liveOfferings.map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {offering.name} /{offering.slug}
                    </option>
                  ))}
                </select>
                {liveOfferings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Chưa có dịch vụ/sản phẩm live thuộc provider này. Hãy tạo mới và chờ admin duyệt trước.
                  </p>
                ) : null}
              </div>
            ) : (
              <input type="hidden" name="linkedOfferingId" value="" />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Tên dịch vụ/sản phẩm</label>
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
              <label className="text-sm font-medium text-zinc-950">Loại dịch vụ/sản phẩm</label>
              <select
                name="fulfillmentType"
                value={fulfillmentType}
                disabled={!canEdit}
                onChange={(event) => setFulfillmentType(event.target.value as OfferingFulfillmentType)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
              >
                <option value="service">Dịch vụ - Có người thực hiện/đặt lịch</option>
                <option value="physical">Sản phẩm vật lý - Có sản xuất/giao hàng</option>
                <option value="digital">Sản phẩm online - Nhận qua link/file</option>
              </select>
            </div>
          </div>

          {fulfillmentType === "service" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">Loại dịch vụ</label>
                <select
                  name="serviceKind"
                  defaultValue={submission?.serviceKind ?? "other"}
                  disabled={!canEdit}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
                >
                  {PROVIDER_SERVICE_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">Thời lượng mặc định</label>
                <Input
                  name="durationMinutes"
                  type="number"
                  min="0"
                  step="15"
                  defaultValue={String(submission?.durationMinutes ?? 0)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-950">Khu vực phục vụ</label>
                <Input name="serviceArea" defaultValue={submission?.serviceArea ?? ""} disabled={!canEdit} />
              </div>
            </div>
          ) : (
            <>
              <input type="hidden" name="serviceKind" value="general" />
              <input type="hidden" name="durationMinutes" value="0" />
              <input type="hidden" name="serviceArea" value="" />
            </>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-950">Giá nhập</label>
              <CurrencyInput name="purchaseCost" defaultValue={submission?.purchaseCost ?? 0} disabled={!canEdit} />
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
              <label className="text-sm font-medium text-zinc-950">SKU provider</label>
              <Input name="providerSku" defaultValue={submission?.providerSku ?? ""} disabled={!canEdit} />
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
            <textarea name="providerNote" defaultValue={submission?.providerNote ?? ""} disabled={!canEdit} className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60" />
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
                <ProviderOfferingStatusBadge status={submission.reviewStatus} />
                <div className="space-y-2 text-sm text-zinc-600">
                  <p>Giá bán admin: {submission.adminSellPrice ? formatVnd(submission.adminSellPrice) : "Chưa nhập"}</p>
                  <p>Ghi chú duyệt: {submission.reviewNote || "Chưa có"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-600">Tạo hồ sơ nháp, chọn loại dịch vụ/sản phẩm rồi gửi admin duyệt.</p>
            )}

            {canEdit ? (
              <ProviderSubmitButton className="w-full" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : submission ? "Lưu hồ sơ" : "Tạo hồ sơ nháp"}
              </ProviderSubmitButton>
            ) : null}

            {canSubmit ? (
              <ProviderOutlineButton className="w-full" disabled={isSubmitting} onClick={() => void handleSubmitForReview()}>
                {isSubmitting ? "Đang gửi..." : "Gửi admin duyệt"}
              </ProviderOutlineButton>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
