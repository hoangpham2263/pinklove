"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { NativeForm } from "@/components/common/native-form";
import { AdminCancelButton, AdminSubmitButton } from "@/features/admin/components/admin-buttons";
import { AdminCheckbox, AdminField, AdminInput, AdminSelect, AdminTextarea } from "@/features/admin/components/admin-form";
import type { OfferingBundle } from "@/features/offerings/server/bundles";
import { getOfferingStatusLabel, getOfferingTypeLabel, type Offering } from "@/features/offerings/types";
import { adminApi, adminApiActions } from "@/lib/api-client.admin";
import { finishMutation } from "@/lib/client-mutation";
import { formatVnd } from "@/lib/currency";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";

const bundleStatusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

type OfferingBundleFormProps = {
  bundle?: OfferingBundle | null;
  offerings: Offering[];
};

export function OfferingBundleForm({ bundle, offerings }: OfferingBundleFormProps) {
  const router = useRouter();
  const [name, setName] = useState(bundle?.name ?? "");
  const [slug, setSlug] = useState(bundle?.slug ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedItems = new Map(bundle?.items.map((item) => [item.offeringId, item]) ?? []);
  const selectableOfferings = offerings.filter((offering) => offering.status !== "archived");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await adminApi.saveOfferingBundle(new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã lưu combo.");
      finishMutation(router, result, { redirect: "replace", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu combo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm action={adminApiActions.saveOfferingBundle} method="POST" className="grid gap-6 lg:grid-cols-12" onSubmit={handleSubmit}>
      {bundle ? <input type="hidden" name="currentSlug" value={bundle.slug} /> : null}
      <input type="hidden" name="currency" value="VND" />

      <div className="min-w-0 space-y-6 lg:col-span-9">
        <section className="space-y-4 rounded-lg border bg-background p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Thông tin combo</h2>
            <p className="text-sm text-muted-foreground">Thiết lập tên, trạng thái và giá bán.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Tên combo">
            <AdminInput
              name="name"
              required
              value={name}
              onChange={(event) => {
                const next = event.target.value;
                setName(next);
                setSlug(slugify(next));
              }}
              placeholder="Combo cưới trọn gói"
            />
          </AdminField>

          <AdminField label="Slug">
            <AdminInput
              name="slug"
              required
              value={slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              placeholder="combo-cuoi-tron-goi"
            />
          </AdminField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Giá combo">
              <AdminInput
                name="price"
                type="number"
                min="0"
                step="1000"
                defaultValue={String(bundle?.price ?? 0)}
              />
            </AdminField>
            <AdminField label="Trạng thái">
              <AdminSelect
                name="status"
                defaultValue={bundle?.status ?? "draft"}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                {bundle ? <option value="archived">Archived</option> : null}
              </AdminSelect>
            </AdminField>
          </div>

          <AdminField label="Mô tả ngắn">
            <AdminTextarea
              name="description"
              rows={5}
              defaultValue={bundle?.description ?? ""}
              placeholder="Tóm tắt nội dung combo..."
            />
          </AdminField>
        </section>

        <section className="space-y-4 rounded-lg border bg-background p-5">
          <div className="space-y-1">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Thành phần combo</h2>
              <p className="text-sm text-muted-foreground">Chọn dịch vụ/sản phẩm và số lượng đi kèm.</p>
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto rounded-md border">
            {selectableOfferings.length ? (
              <div className="divide-y">
                {selectableOfferings.map((offering) => {
                  const selectedItem = selectedItems.get(offering.id);

                  return (
                    <div key={offering.id} className="grid gap-3 p-3 hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_88px] sm:items-center">
                      <span className="flex min-w-0 items-start gap-3">
                        <AdminCheckbox
                          name="offeringIds"
                          value={offering.id}
                          defaultChecked={Boolean(selectedItem)}
                          className="border-0 bg-transparent p-0"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{offering.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {getOfferingTypeLabel(offering.offeringType)} · {getOfferingStatusLabel(offering.status)} · {formatVnd(offering.price)}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">SL</span>
                        <AdminInput
                          name={`quantity_${offering.id}`}
                          type="number"
                          min="1"
                          defaultValue={String(selectedItem?.quantity ?? 1)}
                          className="h-8 w-16 px-2"
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">Chưa có dịch vụ/sản phẩm nào để ghép combo.</div>
            )}
          </div>

        </section>
      </div>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <section className="space-y-4 rounded-lg border bg-background p-5 lg:sticky lg:top-20">
          <div>
            <h2 className="text-base font-semibold">Thao tác</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lưu hoặc hủy chỉnh sửa combo.</p>
          </div>
          <AdminSubmitButton className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu combo"}
          </AdminSubmitButton>
          <AdminCancelButton className="w-full" nativeButton={false} render={<Link href={ROUTES.ADMIN.OFFERING_BUNDLES}>Hủy</Link>} />
          {bundle ? (
            <p className="border-t pt-4 text-xs text-muted-foreground">
              Trạng thái hiện tại: {bundleStatusLabels[bundle.status] ?? bundle.status}
            </p>
          ) : null}
        </section>
      </div>
    </NativeForm>
  );
}
