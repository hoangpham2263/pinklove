"use client";

import { useMemo, useState } from "react";
import { NativeForm } from "@/components/common/native-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getWeddingTemplateOptions } from "@/features/sites/templates/registry";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";
import type { ProductType } from "@/features/products/types";

export function QuickCreateProductForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [productType, setProductType] = useState<ProductType>("coded_template");

  const templateOptions = useMemo(
    () => getWeddingTemplateOptions(productType),
    [productType]
  );

  return (
    <NativeForm action={ROUTES.API.ADMIN.PRODUCTS.CREATE} method="POST" className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="font-medium text-sm">
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
        <label htmlFor="slug" className="font-medium text-sm">
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="productType" className="font-medium text-sm">
            Loại sản phẩm
          </label>
          <select
            id="productType"
            name="productType"
            value={productType}
            onChange={(e) => setProductType(e.target.value as ProductType)}
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="coded_template">Thiếp mẫu sẵn</option>
            <option value="builder_template">Tự tạo thiệp</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="templateKey" className="font-medium text-sm">
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
      </div>

      <Button type="submit" className="w-full rounded-md">
        Tạo sản phẩm
      </Button>
    </NativeForm>
  );
}
