"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvitationTemplateOptions } from "@/features/invitations/templates/registry";
import { finishMutation, postForm } from "@/lib/client-mutation";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import type { ProductCategory, ProductFulfillmentType, ProductType } from "@/features/products/types";

export function QuickCreateProductForm({ categories = [] }: { categories?: ProductCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [productType, setProductType] = useState<ProductType>("coded_template");
  const [fulfillmentType, setFulfillmentType] = useState<ProductFulfillmentType>("digital");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateOptions = useMemo(
    () => getInvitationTemplateOptions(productType),
    [productType]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await postForm(ROUTES.API.ADMIN.PRODUCTS.CREATE, new FormData(event.currentTarget));
      toast.success(result.message ?? "Đã tạo sản phẩm mới.");
      finishMutation(router, result, { redirect: "push", refresh: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo sản phẩm.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <NativeForm
      action={ROUTES.API.ADMIN.PRODUCTS.CREATE}
      method="POST"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      onSubmit={handleSubmit}
    >
      <Card className="min-w-0 rounded-lg lg:col-span-9">
        <CardHeader>
          <CardTitle>Thông tin sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="font-medium">
                Tên sản phẩm
              </label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => {
                  const next = e.target.value;
                  setName(next);
                  if (!isSlugEdited) {
                    setSlug(slugify(next));
                  }
                }}
                placeholder="Ví dụ: Romantic Bloom"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="font-medium">
                Slug
              </label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugEdited(true);
                }}
                placeholder="romantic-bloom"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="categoryId" className="font-medium">
                Product Cat
              </label>
              <select
                id="categoryId"
                name="categoryId"
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
              <label htmlFor="productType" className="font-medium">
                Loại sản phẩm
              </label>
              <select
                id="productType"
                name="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="coded_template">Coded Template</option>
                <option value="builder_template">Builder Template</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="templateKey" className="font-medium">
                Template
              </label>
              <select
                id="templateKey"
                name="templateKey"
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {templateOptions.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="fulfillmentType" className="font-medium">
                Hình thức bàn giao
              </label>
              <select
                id="fulfillmentType"
                name="fulfillmentType"
                value={fulfillmentType}
                onChange={(e) => setFulfillmentType(e.target.value as ProductFulfillmentType)}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="digital">Digital</option>
                <option value="physical">Cần vận chuyển</option>
                <option value="service">Dịch vụ</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6 lg:col-span-3">
        <Card className="min-w-0 rounded-lg lg:self-start">
          <CardHeader>
            <CardTitle>Xuất bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="status" className="font-medium">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              Chọn trạng thái tạo mới để tiếp tục hoàn thiện hoặc publish ngay từ đầu.
            </p>
            <Button type="submit" className="h-10 w-full rounded-md" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo sản phẩm"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </NativeForm>
  );
}
