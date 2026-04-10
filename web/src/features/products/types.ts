export type ProductType = "coded_template" | "builder_template";

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  excerpt?: string;
  description?: string;
  status: "draft" | "published";
  productType: ProductType;
  templateKey: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  thumbnailUrl?: string;
  price: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
