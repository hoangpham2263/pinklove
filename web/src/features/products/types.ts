export type ProductType = "coded_template" | "builder_template";

export type Product = {
  id: number;
  slug: string;
  name: string;
  excerpt?: string;
  description?: string;
  status: "draft" | "published";
  productType: ProductType;
  templateKey: string;
  thumbnailUrl?: string;
  price: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
